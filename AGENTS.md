# Auction mobile project

## Mission and ownership
- Build a polished native auction game. The user-approved app and project name is Auction.
- The original source website/company name and URL must never appear in the application, its accessibility text, share output, or bundled runtime content. Because the repository is public, tracked docs and scripts never name it either (user decision, 2026-11-24): write "the source site". Exact provenance lives only in git-ignored `.work/SOURCE-PROVENANCE.md`, and `npm run check:neutral` fails on any mention in the repository. Preserve third-party image credits.
- User explicitly authorized publishing the completed project to the public GitHub repository `ivchiik/auction`. Review the upload for credentials, private files, and generated build clutter before pushing.
- User approved English, iOS and Android, React Native/Expo, same-device 2–4 players and computer opponents first. Permission to reuse game data/images is granted; source/API access has not arrived.
- Codex owns research, product decisions, task management, Brilliant design direction, review and independent verification. Claude Code must implement application code using explicitly selected Opus 5.5 with maximum effort. Do not silently substitute a model.
- Read docs/PRODUCT.md, docs/TASKS.md and design/BRIEF.md before implementation. Keep status factual. Do not call a mock or local demo production integration.
- Only AGENTS.md contains project instructions. CLAUDE.md is exactly `@AGENTS.md`.

## Architecture and conventions
- Expo React Native with TypeScript, React Navigation, named const-arrow component exports. Logic belongs in screen container/useFeature.ts hooks; screens remain mostly JSX.
- AppText/AppButton/AppScreen primitives, theme tokens, ComponentName.styles.ts, flat named-export barrels. Bare src path aliases. No nested relative import chains.
- Use i18next with English resources for all user-facing copy. Dynamic content is data, not translation keys. Allow accessible text scaling where practical for this new project.
- Pure deterministic game engine independent of React Native, with injected seeded randomness. Store UI state with small Zustand stores; use durable local persistence for draft resume and daily history. No backend or pretend online state.
- Double-tap protections, safe-area-aware layouts, accessible labels and at least 48-point targets. Use live dimensions; support 360-wide Android and small iPhones.
- Prettier: 100 columns, double quotes, semicolons, es5 trailing commas, 2 spaces. ESLint: no console except warn/error, unused imports, RN no-inline-styles. No copied secrets/config from other projects.
- Do not modify other repositories or global configuration. Do not publish, create accounts, purchase services, contact the company or push code without specific direction.

## Verification
- Required checks: TypeScript, ESLint, meaningful engine tests, Expo dependency compatibility, real iOS simulator and Android emulator smoke tests.
- Test budget reserve, pass elimination, skips, roster capacity, sole-player forcing, deterministic daily deck, reveal privacy, timer cleanup/background handling, resume and malformed saves.
- Preserve tests and write the exact command/results and any device gaps into docs/QA.md. Build success is not a device test.
- Screenshots and implementation review happen before declaring the pitch ready.
- Before the final quality gate, read the current `docs/REVIEW-*.md` notes and resolve reproduced findings. During phase 2, `docs/REVIEW-PHASE2.md` contains Codex's independently reproduced backward-clock save bug and integration checks. Preserve the separate content worker's owned files.
