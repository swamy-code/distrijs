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
import { planStore, type PlanStatus, type WorkType } from './planStore';
import { runMockPlanning } from './mockRun';
import { collegeWorkPlannerTools } from './tools';

const AGENT_ID =
  import.meta.env.VITE_DISTRI_AGENT_ID ?? 'college_work_planner_agent';

const STATUS_LABEL: Record<PlanStatus, string> = {
  empty: 'No Active Plan',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Plan Approved',
  ready: 'Schedule Ready',
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

function AddWorkModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<WorkType>('assignment');
  const [deadline, setDeadline] = useState(
    () => new Date().toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) return;

    planStore.createWork({
      id: `work-${Date.now()}`,
      title: title.trim(),
      subject: subject.trim(),
      type,
      deadline,
    });

    setTitle('');
    setSubject('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Add College Work</h3>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Systems Lab Assignment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Subject / Course</label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Systems"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as WorkType)}>
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="project">Project</option>
            </select>
          </div>

          <div className="form-group">
            <label>Deadline (YYYY-MM-DD)</label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Planner({
  subtitle,
  renderChat,
}: {
  subtitle: string;
  renderChat: (threadId: string, runMock: () => void, mockRunning: boolean) => ReactNode;
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
      {/* Header Bar */}
      <header className="header">
        <div className="header__brand">
          <div className="header__logo">⚡</div>
          <div className="header__title">
            <span className="header__name">Distri PlanAI</span>
            <span className="header__subtitle">{subtitle}</span>
          </div>
        </div>

        <div className="header__controls">
          <div className={`status-pill status-pill--${plan.status}`}>
            <span className="status-dot" />
            <span>{STATUS_LABEL[plan.status]}</span>
          </div>

          <button
            className="btn btn--secondary btn--sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Work
          </button>

          <button
            className="btn btn--primary btn--sm"
            onClick={runMock}
            disabled={mockRunning}
          >
            {mockRunning ? 'Running…' : 'Run Demo Script'}
          </button>

          <button
            className="btn btn--ghost btn--sm"
            onClick={startOver}
            title="Reset store and thread"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="planner__body">
        <main className="canvas">
          <div className="canvas__scroll">
            <PlanCanvas
              plan={plan}
              onRunMock={runMock}
              mockRunning={mockRunning}
            />
          </div>
        </main>

        {renderChat(threadId, runMock, mockRunning)}
      </div>

      {/* Bottom Agent Action Tape */}
      <footer className="tape">
        <div className="tape__label">
          <span className="tape__pulse" />
          <span>Agent Activity</span>
        </div>

        <div className="tape__items">
          {plan.log.length === 0 && (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Waiting for agent operations...
            </span>
          )}

          {plan.log.slice(-6).map((entry) => (
            <span
              key={entry.id}
              className={`tape__item${entry.ok ? '' : ' tape__item--err'}`}
            >
              <code>{entry.tool}</code>
              <span>{entry.detail}</span>
            </span>
          ))}
        </div>

        {narration && (
          <div className="tape__narration">
            💬 {narration}
          </div>
        )}
      </footer>

      {/* Add Task Modal */}
      <AddWorkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
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

function ChatUnavailable({
  error,
  onRunMock,
  mockRunning,
}: {
  error: string;
  onRunMock: () => void;
  mockRunning: boolean;
}) {
  const isKeyError = error.includes('401') || error.includes('502') || error.includes('fetch failed');
  const statusMsg = isKeyError
    ? 'Distri Cloud Offline / No Key'
    : error;

  return (
    <section className="chat-panel chat--offline">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>🤖</span>
        <h3>Agent Standby Mode</h3>
      </div>

      <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '10px 14px', borderRadius: '8px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-indigo)', fontWeight: 700, letterSpacing: '0.05em' }}>Backend Status</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-bright)', marginTop: '2px' }}>
          {statusMsg}
        </div>
      </div>

      <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-sub)' }}>
        The app is running in <strong>Scripted Demo Mode</strong>. You can run and test the complete AI agent workflow (tool execution, approval gate, self-correction, timeline creation) without needing an API key!
      </p>

      <button
        className="btn btn--primary"
        style={{ padding: '12px 18px', width: '100%', justifyContent: 'center', fontSize: '13.5px' }}
        onClick={onRunMock}
        disabled={mockRunning}
      >
        {mockRunning ? '⚡ Running Workflow…' : '▶ Run Scripted AI Workflow'}
      </button>

      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '14px', marginTop: '4px', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
        <strong style={{ color: 'var(--text-sub)' }}>Note on API Keys:</strong>
        <br />
        • <code>DISTRI_API_KEY</code> requires a <strong>Distri key</strong> (format: <code>dak_...</code>) from <a href="https://app.distri.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>app.distri.dev</a>.
        <br />
        • Google Gemini keys (<code>AIza...</code>) are not Distri keys.
        <br />
        • No key is needed to run the full workflow demo! Click the button above.
      </div>
    </section>
  );
}

export function App() {
  return (
    <DistriTokenProvider
      fallback={(error) => (
        <Planner
          subtitle="Scripted Demo Mode"
          renderChat={(_threadId, runMock, mockRunning) => (
            <ChatUnavailable
              error={error}
              onRunMock={runMock}
              mockRunning={mockRunning}
            />
          )}
        />
      )}
    >
      <Planner
        subtitle="AI-Powered Work & Study Planner"
        renderChat={(threadId) => (
          <section className="chat-panel">
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