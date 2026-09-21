import { useState } from 'react';
import { planStore, type PlanState } from '../planStore';

function StatsOverview({ plan }: { plan: PlanState }) {
  const totalWork = plan.work.length;
  const totalHours = plan.studySessions.reduce((acc, s) => acc + s.duration, 0) || plan.studyPlan?.totalHours || 0;
  const totalSessions = plan.studySessions.length;
  
  // Find nearest deadline
  const deadlines = plan.work
    .map((w) => w.deadline)
    .filter(Boolean)
    .sort();
  const nextDeadline = deadlines[0] ? deadlines[0] : 'None';

  return (
    <div className="stats-grid">
      <div className="stat-card stat-card--purple">
        <div className="stat-card__icon">📚</div>
        <div className="stat-card__label">Active Tasks</div>
        <div className="stat-card__value">{totalWork}</div>
        <div className="stat-card__sub">Assignments & Exams</div>
      </div>

      <div className="stat-card stat-card--cyan">
        <div className="stat-card__icon">⏱️</div>
        <div className="stat-card__label">Planned Study</div>
        <div className="stat-card__value">{totalHours} hrs</div>
        <div className="stat-card__sub">Total calculated workload</div>
      </div>

      <div className="stat-card stat-card--emerald">
        <div className="stat-card__icon">🎯</div>
        <div className="stat-card__label">Study Sessions</div>
        <div className="stat-card__value">{totalSessions}</div>
        <div className="stat-card__sub">Validated AI blocks</div>
      </div>

      <div className="stat-card stat-card--amber">
        <div className="stat-card__icon">📅</div>
        <div className="stat-card__label">Next Due</div>
        <div className="stat-card__value" style={{ fontSize: '16px', paddingTop: '6px' }}>
          {nextDeadline}
        </div>
        <div className="stat-card__sub">Earliest submission</div>
      </div>
    </div>
  );
}

function ApprovalGate({ plan }: { plan: PlanState }) {
  const [note, setNote] = useState('');
  const studyPlan = plan.studyPlan;

  if (!studyPlan) return null;

  return (
    <div className="approval-card">
      <div className="approval-card__badge">
        <span>⚡ Human Approval Required</span>
      </div>

      <h2 className="approval-card__title">{studyPlan.title}</h2>
      <p className="approval-card__objective">{studyPlan.objective}</p>

      <div className="approval-card__meta">
        <span className="approval-card__chip">⏱️ {studyPlan.totalHours} Hours Total</span>
        <span className="approval-card__chip">📝 {studyPlan.sessions.length} Planned Sessions</span>
      </div>

      <div className="approval-sessions">
        {studyPlan.sessions.map((session, index) => (
          <div className="approval-session-item" key={index}>
            <div className="approval-session-item__info">
              <span className="approval-session-item__title">{session.title}</span>
              <span className="approval-session-item__subject">{session.subject}</span>
            </div>
            <span className="duration-badge">{session.duration}h block</span>
          </div>
        ))}
      </div>

      {plan.awaitingApproval ? (
        <div className="approval-actions">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Feedback / requested changes for AI agent…"
            aria-label="Requested change"
          />

          <button
            className="btn btn--secondary btn--sm"
            disabled={!note.trim()}
            onClick={() => {
              planStore.resolveApproval({
                approved: false,
                note: note.trim(),
              });
              setNote('');
            }}
          >
            Request Revision
          </button>

          <button
            className="btn btn--primary"
            onClick={() =>
              planStore.resolveApproval({
                approved: true,
              })
            }
          >
            Approve &amp; Schedule
          </button>
        </div>
      ) : (
        <div style={{ color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>✓</span> Plan approved by student
        </div>
      )}
    </div>
  );
}

function WorkList({ plan }: { plan: PlanState }) {
  if (!plan.work.length) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
        No college tasks found. Click "+ Add Work" to create one or run the AI planning.
      </div>
    );
  }

  return (
    <section>
      <div className="section-header">
        <div className="section-title">
          <span>College Coursework &amp; Exams</span>
          <span className="section-title__badge">{plan.work.length}</span>
        </div>
      </div>

      <div className="cards-grid">
        {plan.work.map((item) => (
          <div className="work-card" key={item.id}>
            <div className="work-card__top">
              <div>
                <h3 className="work-card__title">{item.title}</h3>
                <div className="work-card__subject">{item.subject}</div>
              </div>
              <span className={`type-pill type-pill--${item.type}`}>
                {item.type}
              </span>
            </div>

            <div className="work-card__bottom">
              <div className="work-card__deadline">
                <span>📅</span> {item.deadline}
              </div>

              <button
                className="btn btn--danger btn--sm"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                title="Remove task"
                onClick={() => planStore.deleteWork(item.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StudySessions({ plan }: { plan: PlanState }) {
  if (!plan.studySessions.length) {
    return null;
  }

  return (
    <section>
      <div className="section-header">
        <div className="section-title">
          <span>Validated AI Study Timeline</span>
          <span className="section-title__badge">{plan.studySessions.length}</span>
        </div>
      </div>

      <div className="timeline">
        {plan.studySessions.map((session, index) => (
          <div className="timeline-item" key={session.id}>
            <div className="timeline-item__left">
              <div className="timeline-item__num">{index + 1}</div>
              <div className="timeline-item__content">
                <span className="timeline-item__title">{session.title}</span>
                <span className="timeline-item__subject">{session.subject}</span>
              </div>
            </div>
            <span className="duration-badge">{session.duration} hour{session.duration !== 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>
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
    plan.studySessions.length === 0 &&
    plan.work.length === 0
  ) {
    return (
      <div className="empty-hero">
        <div className="empty-hero__icon">🎓</div>
        <h1 className="empty-hero__title">College Work Planner</h1>
        <p className="empty-hero__desc">
          Your AI study assistant reads your assignments, exams, and projects,
          proposes an optimized study schedule, waits for your approval, and automatically builds your calendar.
        </p>

        <div className="empty-hero__prompt">
          “Help me plan my Computer Networks assignment and Operating Systems exam.”
        </div>

        <button
          className="btn btn--primary"
          style={{ padding: '12px 28px', fontSize: '14px' }}
          onClick={onRunMock}
          disabled={mockRunning}
        >
          {mockRunning ? 'Running Mock Workflow…' : '🚀 Run Mocked AI Planning'}
        </button>
      </div>
    );
  }

  return (
    <div className="canvas__container">
      <StatsOverview plan={plan} />

      {plan.studyPlan && <ApprovalGate plan={plan} />}

      <WorkList plan={plan} />

      <StudySessions plan={plan} />
    </div>
  );
}