# QUANTUM REALITY — AGENTS.md
## Permanent Project Instructions for AI Coding Agents

This file defines the authoritative constraints for all AI coding agents
working on the QUANTUM REALITY project. Read this entire document before
taking any action. These rules override any conflicting prior context.

---

## 1. Assigned Problem — DO NOT SUBSTITUTE

The exact assigned problem is:

> "Decoherence study: Add dephasing or depolarizing noise to the coin
> operation of a quantum walk. Show how the distribution moves from quantum
> (two-peaked, spread out) to classical (Gaussian), and quantify using the
> standard deviation."

The project is called **QUANTUM REALITY**.
The academic subtitle is **"Decoherence Study of a Quantum Walk"**.

Do NOT substitute Grover's algorithm, Deutsch's algorithm, or any other
quantum algorithm as the main experiment. The Grover's-search plan is
deprecated and must not appear in new code, results, or documentation.

---

## 2. Scientific Model

- **Walk type**: Discrete-time quantum walk on a one-dimensional line.
- **Coin**: Hadamard coin (default).
- **Noise — primary experiment**: Phase damping / dephasing applied to the
  coin qubit after each coin operation.
- **Noise — optional extension**: Depolarizing noise (implement only after
  the dephasing experiment is fully tested and reviewed).
- **Required quantities**:
  - Position probability distribution P(x, t).
  - Mean position: μ(t) = Σ x · P(x, t).
  - Standard deviation: σ(t) = √(Σ (x − μ(t))² · P(x, t)).
  - Classical reference: σ_classical(t) = √t (unbiased random walk).
- **Spreading regimes**:
  - Coherent (quantum): σ ∝ t (ballistic).
  - Strongly decohered: σ ∝ √t (diffusive).
  - Estimate empirical exponents from actual data; do NOT hard-code them.

---

## 3. Technology Stack — Fixed

| Layer | Tool |
|-------|------|
| 3D environment | Blender 5.2.2 LTS (GLB export) |
| Frontend | React 18, TypeScript, Vite, Three.js, React Three Fiber, Drei |
| Styling | CSS Modules / inline tokens (Obsidian & Champagne Gold) |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Quantum engine | Qiskit, Qiskit Aer |
| Numerics | NumPy |
| Testing | pytest (backend), npm run build (frontend) |
| Version control | Git, branch: main |

---

## 4. Design System — Obsidian & Champagne Gold

These are the ONLY permitted colour tokens:

| Token | Hex |
|-------|-----|
| Obsidian | #101112 |
| Deep graphite | #1B1A18 |
| Graphite panels | #272625 |
| Champagne gold | #C6A66B |
| Highlight gold | #D9BD87 |
| Warm ivory | #F0E9DB |
| Secondary text | #A9A196 |

**Prohibited**: purple, violet, cyan, electric-blue, generic neon.

Use gold selectively for important objects, active states and interaction
feedback. The application must feel like a high-end scientific instrument,
not a gaming dashboard.

---

## 5. Development Method — Mandatory

- Work in the milestones defined in the master brief.
- After each milestone: run commands, inspect output, execute tests, fix
  failures, report results, then **stop and wait for review**.
- Never claim a build, test, export or simulation succeeded without actually
  executing it and observing the output.
- Never fabricate scientific values, standard deviations, measurement counts,
  probability distributions, generated-asset paths, or test outcomes.
- If a result is not achievable with the current model, investigate and report
  it rather than adjusting output to look convincing.

---

## 6. Workspace and Environment Rules

- Workspace root: `D:\VISHAL ANNAN`
- Always use `python` (not `py`) to invoke Python.
- Always use `backend\.venv\Scripts\python` for backend operations.
- Frontend package management: `npm` inside `frontend/`.
- Never install packages into the system-wide Python environment.
- Never use `--force` or `--legacy-peer-deps` to conceal dependency conflicts.
- Never rename the workspace root or create a nested project directory inside it.

---

## 7. Milestone Sequence (from master brief)

1. Environment inspection ✅
2. Project scaffolding ← **current milestone**
3. Initial 3D workbench
4. Blender asset pipeline and interactions
5. Quantum-walk simulation engine
6. Dephasing experiment
7. Standard-deviation analysis and classical reference
8. Frontend/backend integration
9. Noisy simulation validation
10. Report, evidence and presentation

Proceed to the next milestone **only after** explicit user review and approval.
