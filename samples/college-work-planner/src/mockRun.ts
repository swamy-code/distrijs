import { toolByName } from './tools';

const call = (
  name: string,
  input: Record<string, unknown> = {}
) => toolByName(name).handler(input) as Promise<string>;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function runMockPlanning(
  onNarrate: (line: string) => void
) {
  // 1. Read the current college work
  onNarrate('Reading your college work…');
  await call('list_college_work');
  await sleep(700);

  // 2. Propose a plan and show the approval gate
  onNarrate('Creating a study plan for your upcoming deadlines…');

  const proposal = call('propose_study_plan', {
    title: 'Upcoming College Work Study Plan',
    objective:
      'Prepare for the Computer Networks assignment and Operating Systems exam while keeping the workload manageable.',
    total_hours: 6,
    sessions: [
      {
        title: 'Computer Networks — Assignment',
        subject: 'Computer Networks',
        duration: 2,
      },
      {
        title: 'Operating Systems — Processes and Synchronization',
        subject: 'Operating Systems',
        duration: 2,
      },
      {
        title: 'Operating Systems — Scheduling and Revision',
        subject: 'Operating Systems',
        duration: 2,
      },
    ],
  });

  // In the real agent, this waits for the human.
  // In the mocked demo, give the UI time to show the approval gate,
  // then simulate the human approving it.
  await sleep(1200);

  onNarrate('Waiting for your approval…');

  await sleep(1800);

  const { planStore } = await import('./planStore');

  planStore.resolveApproval({
    approved: true,
  });

  const proposalResult = await proposal;

  if (!proposalResult.includes('approved')) {
    onNarrate('The plan needs changes before work can continue.');
    return;
  }

  await sleep(700);

  // 3. Demonstrate validation and retry.
  // This intentionally fails because the tool only accepts 1–4 hours.
  onNarrate('Testing the first study session…');

  const invalidResult = await call('create_study_session', {
    title: 'Computer Networks — Deep Study',
    subject: 'Computer Networks',
    duration: 6,
  });

  if (invalidResult.startsWith('ERROR')) {
    onNarrate(
      'The tool rejected a 6-hour session. Correcting it to 3 hours…'
    );
  }

  await sleep(900);

  // 4. Correct the rejected input
  await call('create_study_session', {
    title: 'Computer Networks — Assignment',
    subject: 'Computer Networks',
    duration: 3,
  });

  await sleep(500);

  // 5. Create another valid session
  onNarrate('Creating the remaining study sessions…');

  await call('create_study_session', {
    title: 'Operating Systems — Processes and Synchronization',
    subject: 'Operating Systems',
    duration: 2,
  });

  await sleep(500);

  await call('create_study_session', {
    title: 'Operating Systems — Scheduling and Revision',
    subject: 'Operating Systems',
    duration: 1,
  });

  await sleep(700);

  // 6. Finish the plan
  await call('finish_study_plan');

  onNarrate(
    'Study plan completed — 3 validated study sessions created.'
  );
}