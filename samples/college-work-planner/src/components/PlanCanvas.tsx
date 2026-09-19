import { useState } from 'react';
import { planStore, type PlanState } from '../planStore';

function ApprovalGate({ plan }: { plan: PlanState }) {
  const [note, setNote] = useState('');

  const studyPlan = plan.studyPlan;

  if (!studyPlan) return null;

  return (
    <div className="plan-card">
      <div className="plan-card__flag">
        Check the study plan before it is added
      </div>

      <h2>{studyPlan.title}</h2>

      <p className="plan-card__gist">
        {studyPlan.objective}
      </p>

      <div className="plan-card__meta">
        <span>{studyPlan.totalHours} hours</span>
        <span>{studyPlan.sessions.length} sessions</span>
      </div>

      <ol className="plan-card__beats">
        {studyPlan.sessions.map((session, index) => (
          <li key={index}>
            <strong>
              {session.title}
              <span className="plan-card__mins">
                {session.duration}h
              </span>
            </strong>

            <span>{session.subject}</span>
          </li>
        ))}
      </ol>

      {plan.awaitingApproval ? (
        <div className="plan-card__actions">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Or say what should change…"
            aria-label="Requested change"
          />

          <button
            className="btn btn--ghost"
            disabled={!note.trim()}
            onClick={() => {
              planStore.resolveApproval({
                approved: false,
                note: note.trim(),
              });

              setNote('');
            }}
          >
            Request changes
          </button>

          <button
            className="btn btn--primary"
            onClick={() =>
              planStore.resolveApproval({
                approved: true,
              })
            }
          >
            Approve &amp; create
          </button>
        </div>
      ) : (
        <div className="plan-card__approved">
          Approved
        </div>
      )}
    </div>
  );
}

function WorkList({ plan }: { plan: PlanState }) {
  if (!plan.work.length) {
    return (
      <div className="empty__hint">
        No college work has been added yet.
      </div>
    );
  }

  return (
    <section className="questions">
      <h2 className="questions__title">
        My College Work
      </h2>

      {plan.work.map((item) => (
        <div className="question" key={item.id}>
          <div className="question__head">
            <span className="question__num">
              {item.type.toUpperCase()}
            </span>

            <span className="question__kind">
              {item.subject}
            </span>
          </div>

          <p className="question__prompt">
            {item.title}
          </p>

          <div className="question__keys">
            <div>
              <span>Deadline</span>
              {item.deadline}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function StudySessions({ plan }: { plan: PlanState }) {
  if (!plan.studySessions.length) {
    return null;
  }

  return (
    <section className="questions">
      <h2 className="questions__title">
        AI Study Plan
      </h2>

      {plan.studySessions.map((session, index) => (
        <div className="question" key={session.id}>
          <div className="question__head">
            <span className="question__num">
              {index + 1}
            </span>

            <span className="question__kind">
              {session.duration} hour
              {session.duration !== 1 ? 's' : ''}
            </span>
          </div>

          <p className="question__prompt">
            {session.title}
          </p>

          <div className="question__keys">
            <div>
              <span>Subject</span>
              {session.subject}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function ActionLog({ plan }: { plan: PlanState }) {
  if (!plan.log.length) return null;

  return (
    <section className="questions">
      <h2 className="questions__title">
        Agent Actions
      </h2>

      {plan.log.map((entry) => (
        <div className="question" key={entry.id}>
          <div className="question__head">
            <span className="question__num">
              {entry.ok ? '✓' : '✕'}
            </span>

            <span className="question__kind">
              {entry.tool}
            </span>
          </div>

          <p className="question__prompt">
            {entry.detail}
          </p>
        </div>
      ))}
    </section>
  );
}

export function PlanCanvas({
  plan,
  onRunMock,
  mockRunning,
}: {
  plan: PlanState;
  onRunMock: () => void;
  mockRunning: boolean;
}) {
  if (
    plan.status === 'empty' &&
    !plan.studyPlan &&
    plan.studySessions.length === 0
  ) {
    return (
      <div className="paper paper--empty">
        <div className="empty">
          <h1>College Work Planner</h1>

          <p>
            Your AI study assistant reads your assignments,
            exams, and projects, proposes a study plan,
            waits for your approval, and then creates the
            study sessions for you.
          </p>

          <p className="empty__try">
            Try:
            <em>
              “Help me plan my Computer Networks assignment
              and Operating Systems exam.”
            </em>
          </p>

          <button
            className="btn btn--primary"
            onClick={onRunMock}
            disabled={mockRunning}
          >
            {mockRunning
              ? 'Running…'
              : 'Run the mocked planning'}
          </button>

          <p className="empty__hint">
            The mocked run uses the same agent tools and
            works without an API key.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="paper">
      {plan.studyPlan && (
        <ApprovalGate plan={plan} />
      )}

      <WorkList plan={plan} />

      <StudySessions plan={plan} />

      <ActionLog plan={plan} />

      {plan.status === 'ready' && (
        <div className="published">
          Study plan completed successfully.
        </div>
      )}
    </div>
  );
}