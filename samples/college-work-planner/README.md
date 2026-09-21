# ⚡ College Work Planner — AI-Native Study Planning with Distri

> An AI-native React + TypeScript application where an autonomous AI agent organizes college assignments, exams, and projects into a validated, human-approved study plan using **Distri**.

---

## 🌟 Features & Key Highlights

- **Obsidian Glassmorphic UI**: High-end dark aesthetic with ambient radial glow lighting, metric overview cards, status badges, and custom typography (`Plus Jakarta Sans` & `JetBrains Mono`).
- **Human-in-the-Loop Approval Gate**: The AI agent proposes a study plan and **pauses execution** until the user reviews and clicks *Approve & Schedule* (or requests revisions).
- **In-Product Tool Invocation**: Rather than just chatting, the AI agent directly executes tools that mutate local React state and update the canvas UI in real time.
- **Validation & Self-Correction**: Enforces domain constraints (e.g. session durations must be between 1 and 4 hours). If a tool call fails, the AI reads the error trace and automatically retries with corrected parameters.
- **Standalone Scripted Runner**: Run the full end-to-end AI function-calling workflow locally with zero setup or API keys required.
- **Coursework Management Modal**: Easily add, edit, or delete assignments, exams, and projects.

---

## 🚀 Quick Start

### 1. Run Local Dev Server
From the repository root directory:

```bash
pnpm install
pnpm --filter @distri/college-work-planner-sample dev
```

Open `http://localhost:5304` (or `http://localhost:5303`) in your browser.

### 2. Experience the AI Workflow (No API Key Required)
Click **`▶ Run Scripted AI Workflow`** or **`Run Demo Script`** in the header to launch the automated function-calling runner!

---

## 🧠 AI-Native Architecture & Design Philosophy

In traditional AI applications, LLMs act merely as text generators in a side chat window. **College Work Planner** adopts an **AI-Native Workflow** where the agent actively drives application state through tools.

```
Read Context ──► Propose Plan ──► ⚡ [HUMAN APPROVAL GATE] ──► Execute Tools ──► Validate & Correct ──► Complete Schedule
  list_*()         propose_*()       (Waits for User Input)       create_*()       Rejects Bad Inputs      finish_*()
```

### 🤝 Division of Ownership: AI vs. Human

| Responsibility Area | Owner | Rationale |
| :--- | :--- | :--- |
| **Context Extraction** | **AI Agent** | AI scans coursework deadlines, subject priorities, and task types to determine optimal study hours. |
| **Schedule Strategy** | **AI Agent** | AI structures complex subjects into manageable, non-overwhelming 1–4 hour study blocks. |
| **Final Approval** | **Human User** | **Crucial Stop Point.** The student retains total authority over their calendar before any tasks are created. |
| **Execution & Guardrails** | **Tool Layer** | Tools enforce strict duration rules (1–4h), rejecting invalid inputs so the AI can correct itself. |

---

## 🛠️ Tool Architecture Breakdown

The agent tools are modularly split into six distinct function primitives:

1. **`list_college_work`**: Reads current assignments, exams, and projects to ground the agent in active deadlines.
2. **`propose_study_plan`**: Generates the proposed study plan, displays the **Human Approval Gate**, and pauses execution until approved or revised.
3. **`create_study_session`**: Creates individual validated study sessions (enforcing 1–4h durations).
4. **`create_college_work`**: Adds new assignments, exams, or projects to the planner.
5. **`update_college_work`** / **`delete_college_work`**: Modifies or removes existing coursework items.
6. **`finish_study_plan`**: Seals the approved study plan once all sessions are validated and created.

### Why Tools Are Split This Way:
- **Separation of Concerns**: Reading context is isolated from mutating state or requesting approvals.
- **Atomic Operations**: Breaking down session creation ensures that validation failures affect only the invalid block, allowing the AI to retry individually without re-running the entire plan.

---

## 📈 Future Roadmap (Next Steps)

If extending this application further, the next enhancements would include:

1. **Google Calendar / iCal Export**: One-click sync to export approved study sessions directly into Google Calendar or Apple Calendar.
2. **Spaced Repetition & Progress Tracking**: Interactive checkboxes for completing study sessions with auto-rebalancing when a student misses a session.
3. **Multi-Student Workspaces**: Shared project planning and group study session scheduling.