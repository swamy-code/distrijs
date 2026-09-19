import {
  useCallback,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Chat } from '@distri/react';
import type { DistriMessage } from '@distri/core';
import { DistriTokenProvider } from './DistriTokenProvider';
import { PlanCanvas } from './components/PlanCanvas';
import { planStore, type PlanStatus } from './planStore';
import { runMockPlanning } from './mockRun';
import { collegeWorkPlannerTools } from './tools';

const AGENT_ID =
  import.meta.env.VITE_DISTRI_AGENT_ID ?? 'college_work_planner_agent';

const STATUS_LABEL: Record<PlanStatus, string> = {
  empty: 'No plan',
  awaiting_approval: 'Waiting on you',
  approved: 'Approved',
  ready: 'Plan ready',
};

const STARTERS = [
  {
    id: 'college-work',
    label: 'Plan my college work',
    description: 'Assignments, exams, and projects',
    prompt:
      'Read my current college work and create a practical study plan for the upcoming deadlines.',
  },
  {
    id: 'exam',
    label: 'Plan for my exams',
    description: 'Break exam preparation into sessions',
    prompt:
      'Look at my exams and create a study plan with focused preparation sessions.',
  },
  {
    id: 'assignment',
    label: 'Plan my assignments',
    description: 'Organize upcoming assignments',
    prompt:
      'Look at my assignments and create a study plan to finish the most urgent work first.',
  },
];

function Planner({
  subtitle,
  renderChat,
}: {
  subtitle: string;
  renderChat: (threadId: string) => ReactNode;
}) {
  const plan = useSyncExternalStore(
    planStore.subscribe,
    planStore.getSnapshot
  );

  const [threadId, setThreadId] = useState(
    () => `college-work-planner-${Date.now()}`
  );

  const [narration, setNarration] = useState<string | null>(null);
  const [mockRunning, setMockRunning] = useState(false);

  const runMock = useCallback(async () => {
    setMockRunning(true);

    try {
      await runMockPlanning(setNarration);
    } finally {
      setMockRunning(false);
    }
  }, []);

  const startOver = useCallback(() => {
    planStore.reset();
    setNarration(null);
    setThreadId(`college-work-planner-${Date.now()}`);
  }, []);

  return (
    <div className="planner">
      <main className="canvas">
        <header className="canvas__head">
          <div>
            <span className="canvas__title">
              College Work Planner
            </span>

            <span className="canvas__sub">
              {subtitle}
            </span>
          </div>

          <div className="canvas__right">
            <span
              className={`pill pill--${plan.status}`}
            >
              {STATUS_LABEL[plan.status]}
            </span>

            <button
              className="btn btn--ghost btn--sm"
              onClick={startOver}
            >
              Start over
            </button>
          </div>
        </header>

        <div className="canvas__scroll">
          <PlanCanvas
            plan={plan}
            onRunMock={runMock}
            mockRunning={mockRunning}
          />
        </div>

        <footer className="tape">
          <span className="tape__label">
            Agent actions
          </span>

          <div className="tape__items">
            {plan.log.length === 0 && (
              <span className="tape__idle">
                nothing yet
              </span>
            )}

            {plan.log.slice(-6).map((entry) => (
              <span
                key={entry.id}
                className={`tape__item${
                  entry.ok ? '' : ' tape__item--err'
                }`}
              >
                <code>{entry.tool}</code>
                {entry.detail}
              </span>
            ))}
          </div>

          {narration && (
            <span className="tape__narration">
              {narration}
            </span>
          )}
        </footer>
      </main>

      {renderChat(threadId)}
    </div>
  );
}

async function beforeSendMessage(
  message: DistriMessage
): Promise<DistriMessage> {
  const plan = planStore.getSnapshot();

  const context = {
    work: plan.work,
    study_plan: plan.studyPlan,
    study_sessions: plan.studySessions,
    status: plan.status,
  };

  return {
    ...message,
    parts: [
      {
        part_type: 'text' as const,
        data: `[College Work Planner state]\n${JSON.stringify(
          context,
          null,
          2
        )}`,
      },
      ...(message.parts || []),
    ],
  };
}

function ChatUnavailable({ error }: { error: string }) {
  return (
    <section className="chat chat--offline">
      <h3>Chat is offline</h3>

      <p className="chat--offline__err">
        {error}
      </p>

      <p>
        Copy <code>.env.example</code> to{' '}
        <code>.env</code>, set your Distri API key,
        and restart the dev server.
      </p>

      <p className="chat--offline__note">
        The planner still works without an API key.
        Click <strong>Run the mocked planning</strong>{' '}
        to see the AI-agent workflow using the same
        tools.
      </p>
    </section>
  );
}

export function App() {
  return (
    <DistriTokenProvider
      fallback={(error) => (
        <Planner
          subtitle="mocked run — no agent connected"
          renderChat={() => (
            <ChatUnavailable error={error} />
          )}
        />
      )}
    >
      <Planner
        subtitle="AI-powered college work planning"
        renderChat={(threadId) => (
          <section className="chat">
            <Chat
              agentId={AGENT_ID}
              threadId={threadId}
              externalTools={collegeWorkPlannerTools}
              beforeSendMessage={beforeSendMessage}
              starterCommands={STARTERS}
              theme="dark"
            />
          </section>
        )}
      />
    </DistriTokenProvider>
  );
}