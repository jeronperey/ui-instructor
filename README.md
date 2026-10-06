# AI Ed Innovations: Instructor UI

React 19 + Vite + TypeScript dashboard for instructors. It calls the AIEIC agents **directly** (there is no orchestrator):

| Tab | Backed by | Env var |
|---|---|---|
| Lab Tasks, Lab Quiz | curriculum designer (`curriculum-designer` repo, port 8003) | `VITE_CURRICULUM_URL`, `VITE_LAB_ID` |
| Student Submissions | assessment agent (`assessment_agent` repo, port 8000) | `VITE_ASSESSMENT_URL`, `VITE_ASSIGNMENT_ID` |
| Statistics | hardcoded sample data | none |

If `VITE_ASSESSMENT_URL` is unset, or the assessment agent is unreachable, Student Submissions shows sample data and says so.
The Student Activity and AI Overview tabs are commented out (see `src/App.tsx`); `src/api/agents.ts` is legacy code for an
orchestrator that was never built.

## Run

```bash
npm install
cp .env.example .env.local     # adjust URLs if your agents run elsewhere
npm run dev                    # http://localhost:5173 (any login works for now)
```

Run the agents it talks to (each repo's README has details):

```bash
# curriculum designer: no model credentials needed in mock mode (the mock ignores chat feedback)
cd ../curriculum-designer && LLM_BACKEND=mock python -m uvicorn main:app --port 8003

# assessment agent: offline fake LLM provider plus seed data
cd ../assessment_agent && cp demo/seed_results.json assessment_results.json
DEFAULT_LLM_PROVIDER=fake python run.py
```

The curriculum designer keeps labs **in memory**: restarting it empties the lab and the UI returns to its empty state.

## Checks

```bash
npx tsc -b && npx eslint src && npm run build
```
There is no test runner yet. `npm run build` writes `dist/`, which is gitignored.

## Contributing
Fork, branch from `main`, and open a PR. Comment out (do not delete) features that are being deactivated. No styling work
for now; the look and feel comes later.
