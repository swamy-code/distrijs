import type { DistriFnTool } from '@distri/core';
import { planStore } from './planStore';

type WorkType = 'assignment' | 'exam' | 'project';

const WORK_TYPES: WorkType[] = ['assignment', 'exam', 'project'];

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

export const collegeWorkPlannerTools: DistriFnTool[] = [
  {
    name: 'list_college_work',
    description:
      'Read all current college assignments, exams, and projects. Call this FIRST to understand what work the student currently has before creating a study plan.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const work = planStore.getSnapshot().work;

      planStore.log('list_college_work', `${work.length} college tasks found`);

      return JSON.stringify(work, null, 2);
    },
  },

  {
    name: 'propose_study_plan',
    description:
      'Create a proposed study plan from the current college work. ALWAYS call this before changing the schedule. The plan is shown to the student and the tool WAITS for human approval. Do not create or modify study tasks until approval is received.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short title for the proposed study plan.',
        },
        objective: {
          type: 'string',
          description: 'One sentence explaining the goal of the study plan.',
        },
        total_hours: {
          type: 'number',
          description: 'Total study hours planned.',
        },
        sessions: {
          type: 'array',
          description:
            'Study sessions in order. Each session should have a title, subject, and duration in hours.',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Name of the study session.',
              },
              subject: {
                type: 'string',
                description: 'Subject or college work being studied.',
              },
              duration: {
                type: 'number',
                description: 'Duration in hours. Must be between 1 and 4 hours.',
              },
            },
            required: ['title', 'subject', 'duration'],
          },
        },
      },
      required: ['title', 'objective', 'total_hours', 'sessions'],
    },

    handler: async (input: {
      title: string;
      objective: string;
      total_hours: number;
      sessions?: {
        title: string;
        subject: string;
        duration: number;
      }[];
    }) => {
      const sessions = input.sessions ?? [];

      if (!input.title?.trim()) {
        planStore.log('propose_study_plan', 'title is required', false);
        return 'Error: title is required.';
      }

      if (!sessions.length) {
        planStore.log('propose_study_plan', 'no study sessions', false);
        return 'Error: the study plan must contain at least one study session.';
      }

      const calculatedHours = sessions.reduce(
        (total, session) => total + session.duration,
        0,
      );

      if (calculatedHours !== input.total_hours) {
        planStore.log(
          'propose_study_plan',
          `hours ${calculatedHours}≠${input.total_hours}`,
          false,
        );

        return `Error: the sessions add up to ${calculatedHours} hours, but total_hours is ${input.total_hours}. Make them match exactly.`;
      }

      for (const session of sessions) {
        if (session.duration < 1 || session.duration > 4) {
          planStore.log(
            'propose_study_plan',
            `invalid duration ${session.duration}`,
            false,
          );

          return `Error: study session "${session.title}" has duration ${session.duration} hours. Each study session must be between 1 and 4 hours. Correct the duration and try again.`;
        }
      }

      planStore.log(
        'propose_study_plan',
        `${sessions.length} sessions · awaiting approval`,
      );

      const decision = await planStore.proposeStudyPlan({
        title: input.title,
        objective: input.objective,
        totalHours: input.total_hours,
        sessions,
      });

      if (!decision.approved) {
        planStore.log(
          'propose_study_plan',
          'changes requested',
          false,
        );

        return `The student did not approve the study plan. They said: "${decision.note}". Revise the plan using this feedback and call propose_study_plan again.`;
      }

      planStore.log('propose_study_plan', 'approved');

      return `Study plan approved. Create the planned college work sessions using create_study_session.`;
    },
  },

  {
    name: 'create_study_session',
    description:
      'Create one approved study session in the student work planner. Only call this after the student has approved the proposed study plan. Duration must be between 1 and 4 hours.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Study session title.',
        },
        subject: {
          type: 'string',
          description: 'Subject or work being studied.',
        },
        duration: {
          type: 'number',
          description: 'Study duration in hours. Must be 1 to 4 hours.',
        },
      },
      required: ['title', 'subject', 'duration'],
    },

    handler: async ({
      title,
      subject,
      duration,
    }: {
      title: string;
      subject: string;
      duration: number;
    }) => {
      const snapshot = planStore.getSnapshot();

      if (snapshot.status !== 'approved') {
        return 'Error: the study plan has not been approved yet. Call propose_study_plan and wait for human approval first.';
      }

      if (!title?.trim()) {
        return 'Error: study session title is required.';
      }

      if (!subject?.trim()) {
        return 'Error: subject is required.';
      }

      if (duration < 1 || duration > 4) {
        planStore.log(
          'create_study_session',
          `invalid duration ${duration}`,
          false,
        );

        return `Error: duration ${duration} is invalid. Study sessions must be between 1 and 4 hours. Correct the duration and retry.`;
      }

      const session = planStore.createStudySession({
        id: `session-${slug(title)}-${Date.now()}`,
        title,
        subject,
        duration,
      });

      const count = planStore.getSnapshot().studySessions.length;

      planStore.log(
        'create_study_session',
        `${title} · ${duration} hour(s)`,
      );

      return `Study session created: "${session.title}". ${count} session(s) are now on the planner.`;
    },
  },

  {
    name: 'create_college_work',
    description:
      'Add a college assignment, exam, or project to the work list. Use this when the student asks the agent to record new college work.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Name of the assignment, exam, or project.',
        },
        subject: {
          type: 'string',
          description: 'Subject or course.',
        },
        type: {
          type: 'string',
          enum: WORK_TYPES,
          description: 'assignment, exam, or project.',
        },
        deadline: {
          type: 'string',
          description: 'Deadline in YYYY-MM-DD format.',
        },
      },
      required: ['title', 'subject', 'type', 'deadline'],
    },

    handler: async ({
      title,
      subject,
      type,
      deadline,
    }: {
      title: string;
      subject: string;
      type: WorkType;
      deadline: string;
    }) => {
      if (!title?.trim()) {
        return 'Error: title is required.';
      }

      if (!subject?.trim()) {
        return 'Error: subject is required.';
      }

      if (!WORK_TYPES.includes(type)) {
        return `Error: invalid work type "${type}". Use assignment, exam, or project.`;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        return 'Error: deadline must use YYYY-MM-DD format.';
      }

      const item = planStore.createWork({
        id: `work-${slug(title)}-${Date.now()}`,
        title,
        subject,
        type,
        deadline,
      });

      planStore.log(
        'create_college_work',
        `${type} · ${title}`,
      );

      return `Added "${item.title}" to college work.`;
    },
  },

  {
    name: 'update_college_work',
    description:
      'Update an existing college work item such as its title, subject, type, or deadline. Use the id returned by list_college_work.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the college work item.',
        },
        title: {
          type: 'string',
          description: 'New title.',
        },
        subject: {
          type: 'string',
          description: 'New subject.',
        },
        type: {
          type: 'string',
          enum: WORK_TYPES,
          description: 'New type.',
        },
        deadline: {
          type: 'string',
          description: 'New deadline in YYYY-MM-DD format.',
        },
      },
      required: ['id'],
    },

    handler: async ({
      id,
      title,
      subject,
      type,
      deadline,
    }: {
      id: string;
      title?: string;
      subject?: string;
      type?: WorkType;
      deadline?: string;
    }) => {
      const existing = planStore
        .getSnapshot()
        .work.find((item) => item.id === id);

      if (!existing) {
        return `Error: no college work item exists with id "${id}". Call list_college_work to get valid ids.`;
      }

      if (type && !WORK_TYPES.includes(type)) {
        return `Error: invalid work type "${type}". Use assignment, exam, or project.`;
      }

      if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        return 'Error: deadline must use YYYY-MM-DD format.';
      }

      planStore.updateWork(id, {
        title,
        subject,
        type,
        deadline,
      });

      planStore.log(
        'update_college_work',
        `${existing.title} updated`,
      );

      return `Updated "${existing.title}".`;
    },
  },

  {
    name: 'delete_college_work',
    description:
      'Delete a college assignment, exam, or project from the work list. Only use this when the user explicitly asks to remove it.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the college work item to delete.',
        },
      },
      required: ['id'],
    },

    handler: async ({ id }: { id: string }) => {
      const existing = planStore
        .getSnapshot()
        .work.find((item) => item.id === id);

      if (!existing) {
        return `Error: no college work item exists with id "${id}". Call list_college_work to get valid ids.`;
      }

      planStore.deleteWork(id);

      planStore.log(
        'delete_college_work',
        `${existing.title} deleted`,
      );

      return `Deleted "${existing.title}" from college work.`;
    },
  },

  {
    name: 'finish_study_plan',
    description:
      'Finish the approved study plan after all planned study sessions have been created. Return a concise summary of what was added.',
    type: 'function',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'One or two sentence summary of the completed study plan.',
        },
      },
      required: ['summary'],
    },

    handler: async ({ summary }: { summary: string }) => {
      const snapshot = planStore.getSnapshot();

      if (snapshot.status !== 'approved') {
        return 'Error: there is no approved study plan to finish.';
      }

      if (!snapshot.studySessions.length) {
        return 'Error: no study sessions have been created yet.';
      }

      planStore.markReady();
      planStore.log(
        'finish_study_plan',
        summary.slice(0, 80),
      );

      return `Study plan completed with ${snapshot.studySessions.length} study session(s).`;
    },
  },
];

export function toolByName(name: string): DistriFnTool {
  const tool = collegeWorkPlannerTools.find(
    (tool) => tool.name === name,
  );

  if (!tool) {
    throw new Error(`No such tool: ${name}`);
  }

  return tool;
}