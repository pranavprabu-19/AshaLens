# Foundations crash path (Phase 0)

Work through this in order during weeks 1–4. The product code already uses these skills.

## Web (HTML / CSS / JS / TypeScript)

1. Open [apps/web/src/app/page.tsx](apps/web/src/app/page.tsx). That is a React component — TypeScript on top of JS.
2. Change a label, save, see it hot-reload at http://localhost:3000.
3. Read [apps/web/src/lib/types.ts](apps/web/src/lib/types.ts) to see how we name data.
4. Git: this folder is a repo. After you change files:

```bash
git status
git diff
```

Do not commit unless you mean to. Ask before `git commit`.

## Python / NumPy / pandas / scikit-learn

From the repo root (venv on):

```bash
.\.venv\Scripts\activate
py -3 learn/sklearn_crash.py
```

You should see a tiny classifier accuracy. That is the same family of model as the follow-up ranker.

## What “done” looks like for Phase 0

- You can explain what a component, a type, and a git diff are.
- You can run the sklearn crash script and read a classification report.
