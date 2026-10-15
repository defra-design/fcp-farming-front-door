---
name: ship
description: Commit and push prototype kit changes in this repo — check what changed, verify edited pages on the user's running dev server, stage only the right files, write a commit message in the repo's style and push. Use whenever the user says "ship it", "ship this", "commit and push", "push this up", "save this to GitHub", or otherwise asks to commit and/or push work in the FCP single front door prototype.
---

# Ship

Commits and pushes work in this GOV.UK Prototype Kit repo. The prototype is shared with designers and researchers who pull `main` and run it, so a push should never break a page, carry someone's local settings, or sweep up files the user didn't mean to share.

## 1. See what changed

Run `git status --short`, `git branch --show-current` and `git diff --stat`.

- Read the diff of anything you didn't change in this session before staging it. The user edits files themselves between requests, and their edits belong in the commit too, but you should know what you're shipping.
- If nothing has changed, say so and stop.

## 2. Decide what to stage

Stage files by name — never `git add -A` or `git add .`, which pick up stray files.

Leave out, and mention you left out:
- `.claude/settings.local.json` (machine-specific permissions)
- `.DS_Store`, editor folders, PDFs (gitignored, but check), scratch files, logs, anything in the scratchpad
- anything that looks like a secret or credential (tokens, `.env`, keys)

Include project skills under `.claude/skills/` — they're shared with the team on purpose.

If an untracked file's purpose is unclear, ask rather than guess.

## 3. Check the pages still render

For each changed view under `app/views/`, work out its URL (the path under `app/views/` without `.html`, e.g. `app/views/v18/_design-history/design-history-1-2.html` → `/v18/_design-history/design-history-1-2`) and `curl` it on the user's running dev server at `http://localhost:3000`. Expect a 200.

- Don't start or stop a dev server yourself. A broad `pkill` kills the user's own server. If nothing answers on port 3000, ask the user to run `npm run dev` (not `npm start`, which forces https), or ship without the check and say that you skipped it.
- Map pages under `v18/` usually need a `?parcel=` query string to render meaningfully.
- For changed Sass, confirm `/public/stylesheets/application.css` returns 200 and contains the new selector.
- If a page returns an error, stop and report it — don't ship a broken page.

## 4. Write the commit message

Match the repo's history (`git log -10 --format=%s`):

- Subject: one plain-English sentence in the imperative, sentence case, no full stop, no `feat:`-style prefix. Name the version and page in the user's terms, e.g. "Put the 1.2 research themes and their design implications in notification banners".
- Body (for anything beyond a one-line change): a short paragraph on what changed and why, wrapped at about 80 characters.
- End with the co-author trailer from the current attribution system reminder, if there is one.

Pass the message with a heredoc (`git commit -F - <<'EOF'`) so quotes and apostrophes survive.

## 5. Commit

The repo has a `detect-secrets` pre-commit hook. If a hook fails, read the output, fix the cause or ask the user. Never use `--no-verify`, and never amend a commit you've already pushed.

## 6. Push

- The user works on `main` and pushes straight to it. Push the current branch: `git push origin <branch>`. For a new branch, use `git push -u origin <branch>`.
- If the push is rejected because the remote has moved on, run `git pull --rebase origin <branch>`, re-check any conflicted files with the user, then push again. Never force-push `main`.
- Open a pull request only if the user asks for one.

## 7. Report

Tell the user, briefly:
- the commit hash and subject, and the branch it was pushed to
- what was included, including any of their own edits that went in
- what was left out on purpose, and any check you skipped
