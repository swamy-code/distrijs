/**
 * State store for the AI College Work Planner.
 *
 * The agent changes this state through tools.ts.
 * React components simply subscribe to the store and render the state.
 */

export type PlanStatus =
  | 'empty'
  | 'awaiting_approval'
  | 'approved'
  | 'ready';

export type WorkType = 'assignment' | 'exam' | 'project';

export interface CollegeWork {
  id: string;
  title: string;
  subject: string;
  type: WorkType;
  deadline: string;
}

export interface StudySession {
  id: string;
  title: string;
  subject: string;
  duration: number;
}

export interface ProposedStudySession {
  title: string;
  subject: string;
  duration: number;
}

export interface StudyPlan {
  title: string;
  objective: string;
  totalHours: number;
  sessions: ProposedStudySession[];
}

export interface LogEntry {
  id: string;
  tool: string;
  detail: string;
  ok: boolean;
}

export interface PlanState {
  status: PlanStatus;

  work: CollegeWork[];

  studyPlan: StudyPlan | null;

  studySessions: StudySession[];

  log: LogEntry[];

  /**
   * True while the AI is waiting for the human
   * to approve or reject the proposed study plan.
   */
  awaitingApproval: boolean;
}

const EMPTY: PlanState = {
  status: 'empty',
  work: [],
  studyPlan: null,
  studySessions: [],
  log: [],
  awaitingApproval: false,
};

let state: PlanState = EMPTY;

let seq = 0;

let approvalResolver:
  | ((decision: ApprovalDecision) => void)
  | null = null;

const listeners = new Set<() => void>();

const set = (patch: Partial<PlanState>) => {
  state = {
    ...state,
    ...patch,
  };

  listeners.forEach((fn) => fn());
};

const nextId = (prefix: string) => `${prefix}-${++seq}`;

export type ApprovalDecision =
  | {
      approved: true;
    }
  | {
      approved: false;
      note: string;
    };

export const planStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);

    return () => listeners.delete(fn);
  },

  getSnapshot(): PlanState {
    return state;
  },

  reset() {
    approvalResolver?.({
      approved: false,
      note: 'The study plan was reset.',
    });

    approvalResolver = null;

    state = {
      ...EMPTY,
      work: [...DEFAULT_WORK],
    };

    listeners.forEach((fn) => fn());
  },

  log(tool: string, detail: string, ok = true) {
    set({
      log: [
        ...state.log,
        {
          id: nextId('log'),
          tool,
          detail,
          ok,
        },
      ],
    });
  },

  /**
   * Add a new assignment, exam, or project.
   */
  createWork(item: CollegeWork): CollegeWork {
    set({
      work: [...state.work, item],
    });

    return item;
  },

  /**
   * Update an existing college work item.
   */
  updateWork(
    id: string,
    changes: Partial<Omit<CollegeWork, 'id'>>,
  ) {
    set({
      work: state.work.map((item) =>
        item.id === id
          ? {
              ...item,
              ...changes,
            }
          : item,
      ),
    });
  },

  /**
   * Delete a college work item.
   */
  deleteWork(id: string) {
    set({
      work: state.work.filter((item) => item.id !== id),
    });
  },

  /**
   * Propose a study plan and pause until the human responds.
   */
  proposeStudyPlan(
    studyPlan: StudyPlan,
  ): Promise<ApprovalDecision> {
    set({
      status: 'awaiting_approval',
      studyPlan,
      awaitingApproval: true,
    });

    return new Promise((resolve) => {
      approvalResolver = (decision) => {
        approvalResolver = null;

        set({
          awaitingApproval: false,
          status: decision.approved ? 'approved' : 'empty',
        });

        resolve(decision);
      };
    });
  },

  /**
   * Called by the UI when the user clicks Approve
   * or Request Changes.
   */
  resolveApproval(decision: ApprovalDecision) {
    approvalResolver?.(decision);
  },

  /**
   * Add one study session to the planner.
   */
  createStudySession(session: StudySession): StudySession {
    set({
      status: 'approved',
      studySessions: [
        ...state.studySessions,
        session,
      ],
    });

    return session;
  },

  /**
   * Mark the generated plan as complete.
   */
  markReady() {
    set({
      status: 'ready',
    });
  },
};


/**
 * Demo data.
 *
 * This gives the mocked run something useful to work with
 * even when the user has no API key.
 */
const DEFAULT_WORK: CollegeWork[] = [
  {
    id: 'work-cn-assignment',
    title: 'Computer Networks Assignment',
    subject: 'Computer Networks',
    type: 'assignment',
    deadline: '2026-09-22',
  },
  {
    id: 'work-os-exam',
    title: 'Operating Systems Mid Exam',
    subject: 'Operating Systems',
    type: 'exam',
    deadline: '2026-09-25',
  },
  {
    id: 'work-quantum-project',
    title: 'Quantum Technology Project',
    subject: 'Quantum Technology',
    type: 'project',
    deadline: '2026-09-28',
  },
];

/**
 * Start with demo college work.
 */
state = {
  ...EMPTY,
  work: [...DEFAULT_WORK],
};