# AGENTS.md

Instructions for coding agents that read `AGENTS.md` (Codex, Cursor, GitHub
Copilot, Windsurf, opencode, Zed, Amp and others). Claude Code reads `CLAUDE.md`
directly; the rules are the same for every agent and live in one place.

## Read before changing anything

1. `CLAUDE.md` — commands, the map of the codebase, and the hard rules
   (bindings only in `cf.ts`, the one data channel, D1 without transactions,
   auth config in two files, vertical feature slices, localization).
2. `src/CLAUDE.md` — the design language, for anything under `src/`.

The rules are enforced, not advisory: `bun run test`, `bun run typecheck` and
`bun run check` fail when one is broken. Run them before you call a change
done.

## Skills

Step-by-step procedures for the recurring jobs are plain Markdown under
`.claude/skills/<name>/SKILL.md`. Claude Code runs them as slash commands
(`/setup`); any other agent should open the file and follow it:

| Skill | Use it to |
| --- | --- |
| `setup` | install, write `.dev.vars`, migrate, start dev |
| `google-oauth` | wire Google sign-in credentials |
| `deploy` | provision D1/R2, push secrets, deploy to Cloudflare Workers |
