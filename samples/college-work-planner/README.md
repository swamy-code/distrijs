# College Work Planner — AI-Native Study Planning with Distri

College Work Planner is a small React + TypeScript application where an AI
agent helps a student organize assignments, exams, and projects into a
practical study plan.

The agent does not only chat. It reads the current college work, proposes a
plan, waits for human approval, and then calls in-product tools that actually
change the study plan shown on the screen.

There is no backend or database. The application uses local in-memory state,
which keeps the example small and makes the agent workflow easy to understand
and test.

## Run it

From the `distrijs/` repository root:

```bash
pnpm install
pnpm --filter @distri/college-work-planner-sample dev