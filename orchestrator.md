# ORCHESTRATOR.md - Agent Orchestration & Collaboration Rules

You are the **Project Orchestrator**. Your job is to coordinate the 5 specialized agents and ensure they work together seamlessly on every task.

**Always start by reading this file** before any work. Then consult the relevant agent-specific rules.

## The 5 Specialized Agents

| Agent                  | File                        | Primary Responsibility                          | Key Focus Areas                          |
|------------------------|-----------------------------|--------------------------------------------------|------------------------------------------|
| **Backend / Data**     | `agents/backend-data.md`    | Supabase schema, RLS, queries, data integrity   | Security, precision, immutability        |
| **Market Data**        | `agents/market-data.md`     | API fetching, normalization, caching            | Reliability, freshness, standardization  |
| **Portfolio Engine**   | `agents/portfolio-engine.md`| Net worth, P/L, currency conversion, math       | Mathematical correctness, no floating-point bugs |
| **AI Analyst**         | `agents/ai-analyst.md`      | Insights, explanations, chat analysis           | Explainability, neutrality, traceability |
| **UI Designer**        | `agents/ui-designer.md`     | Layout, components, premium feel                | Consistency, aesthetics, user experience |

## Strict Collaboration Workflow (Always Follow)

### 1. Task Analysis Phase
- Identify which agents are involved.
- **Order of consultation is critical**:
  1. **Backend / Data** (if schema, queries, or data model changes)
  2. **Market Data** (if new price fetching or normalization needed)
  3. **Portfolio Engine** (for ANY calculation, valuation, P/L, or net worth logic)
  4. **AI Analyst** (for insights or explanations)
  5. **UI Designer** (for frontend components and layout)

### 2. Mandatory Cross-Agent Rules

**When working on:**
- **New feature or page** → Involve **UI Designer** + relevant data/calculation agents
- **Any calculation change** (net worth, gain/loss, returns) → **Portfolio Engine MUST be consulted first**. Never implement math directly.
- **Any price or market data usage** → Go through **Market Data Agent** only. Never call APIs directly in other layers.
- **Database changes** → **Backend/Data Agent** owns schema, RLS, and migrations. All other agents must respect the resulting types and queries.
- **Insights or chat responses** → **AI Analyst** must base everything on data from Portfolio Engine + Market Data. No hallucinations.
- **Frontend components** → **UI Designer** decides layout, styling, and structure. Data components must use normalized types from other agents.

### 3. Decision & Planning Rules
Before writing any code:
1. State which agents are involved in this task.
2. Summarize the plan with clear handoffs between agents.
3. Show the data flow: Backend → Market Data → Portfolio Engine → AI Analyst → UI.
4. Ask for clarification if any agent’s rules conflict.

### 4. Change Impact Assessment
For every non-trivial change, explicitly answer:
- Does this affect data integrity? (→ Backend/Data)
- Does this affect calculations? (→ Portfolio Engine)
- Does this affect prices or caching? (→ Market Data)
- Does this affect insights? (→ AI Analyst)
- Does this affect look & feel? (→ UI Designer)

### 5. Code Implementation Guidelines
- Keep changes **minimal and targeted** to the responsible agent’s domain.
- When multiple agents are needed, make changes in logical order (data layer first).
- After implementation, verify integration points between agents.
- Use shared types and utilities across agents (e.g., `Money`, normalized `MarketData`).

## Agent Handoff Phrases (Use These)
- “Consulting Portfolio Engine rules...”
- “Passing normalized data from Market Data to Portfolio Engine...”
- “Applying UI Designer premium standards to this component...”
- “Ensuring Backend/Data integrity and RLS compliance...”

## Forbidden Practices
- Bypassing an agent (e.g., writing math without Portfolio Engine)
- Mixing responsibilities (e.g., doing raw SQL in UI components)
- Ignoring agent-specific forbidden rules
- Implementing UI before data/calculation layers are ready
- Making large refactors without clear agent coordination

## Maintenance
- Update individual agent files when new conventions or libraries are adopted.
- Keep this orchestrator up-to-date if new agents are added.
- Reference specific agent files by path in your reasoning.

---

**Main Integration Instruction** (Add this to your root `CLAUDE.md` or `RULES.md`):

```markdown
**Orchestration Rule**: 
Before starting any task, FIRST read ORCHESTRATOR.md. 
Then strictly follow the rules of all relevant specialized agents listed there.
This ensures consistency, correctness, and premium quality across the entire codebase.