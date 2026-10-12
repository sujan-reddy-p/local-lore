# Local-first development workflow

## Goal

Develop and review Local Lore in the desktop repository first. Do not push every small change. A GitHub push is the deliberate release action that triggers Vercel.

## Daily development loop

```text
latest master → local feature branch → edit + run locally → review + iterate
→ local commits as checkpoints → final validation → one push → Vercel deploy
```

## Start a focused change

From `/Users/sujan/Documents/local lore`:

```bash
git status
git pull --ff-only origin master
git switch -c codex/<short-change-name>
npm run dev
```

The dev server is pinned to `http://127.0.0.1:4317` so it does not collide with the usual port 3000 used by other Next.js and preview processes.

Open the localhost URL printed by the command. Keep this terminal running while iterating. Make changes in the same repository folder, reload the browser, and inspect the result at desktop and mobile widths.

Concurrent agents must share runtime ownership as well as file ownership: do not stop another agent's server. `npm test` includes a production build and writes `.next`, which the default dev server also uses; coordinate a dev pause or use isolated worktrees for parallel build validation. A different port alone does not isolate build artifacts. For production browser review, start the completed build on a separately owned port after the build finishes.

If another agent is doing the work, give it the repository path plus this reading order:

1. `AGENTS.md`
2. `README.md`
3. `docs/agent-handoff.md`
4. this file
5. the focused guide for its task
6. `docs/source-and-image-policy.md` before catalog/source/image changes

Tell the agent: **work locally, do not push, deploy, change Vercel settings, or create a remote PR unless explicitly asked.**

## Local review checklist

For a UI change, review the actual local site before committing:

- Desktop and narrow mobile layout
- Map loads with roads, labels, buildings, zones, and category colors
- Pan, zoom, rotate, tilt, regional reset, hover, selection, filters, and source links
- Any day is the default; Today/Tomorrow/Weekend/custom dates and Reset all behave predictably in Bay Area calendar time
- No visible console errors or hydration warnings
- Keyboard focus, Escape handling, touch gestures, and reduced-motion behavior

For a catalog change, also follow `docs/local-agent-playbook.md` and `docs/local-agent-automation.md`.

## Local checkpoints, not remote pushes

Make local commits whenever you reach a coherent checkpoint. This is safe and makes review/revert easier; a local commit does not deploy anything.

```bash
git add <only-the-files-for-this-change>
git commit -m "feat: describe the local change"
```

Use `git diff`, `git diff --cached`, and `git log --oneline` to review exactly what changed. Do not stage `.env*`, `node_modules`, `.next`, `dist`, `.portfolio-preview`, screenshots, or local recovery files.

## Final release gate

Only when the batch is complete:

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build:vercel
npm test
git status
```

If these pass and the local visual review is good, merge or fast-forward the feature branch into `master`, then make one push:

```bash
git switch master
git merge --ff-only codex/<short-change-name>
git push origin master
```

That push triggers the production Vercel deployment. Check the Vercel build and the live PMTiles map only after the push.

## PostHog during local work

PostHog runs locally only if `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` exist in `.env.local`. It is fine to omit them during visual work. Never commit those files. Production analytics configuration remains in Vercel.

## If work is interrupted

Do not discard edits. Use `git status` and `git diff` to see the current state, then either continue the same branch or make a local checkpoint commit. A future agent should preserve unrelated uncommitted work and ask before touching overlapping files.
