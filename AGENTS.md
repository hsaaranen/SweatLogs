# SweatLogs project guidance

## Product context

- Read `prd.md` before planning or implementing product behavior.
- Treat `prd.md` as the product intent, but verify existing behavior against the code.
- Follow the user's latest explicit request if it conflicts with the PRD.
- Update `prd.md` when a change materially alters product scope or requirements.

## Code conventions

- Use TypeScript and follow the conventions already established in the repository.
- Add concise documentation comments to every new or modified function and class.
- Comments should explain purpose, important inputs and outputs, side effects, or non-obvious constraints. Do not add comments that merely restate the code.
- Preserve the offline-first design and do not introduce network dependencies without explicit approval.
- Keep user-visible strings in the localization system and maintain both English and Finnish keys.
- Preserve historical workout data when changing or removing exercises, focuses, or markers.

## Validation

- Run `npm run typecheck` after TypeScript changes.
- For Android-specific changes, verify the appropriate Gradle debug build when the local Android toolchain is available.
- Report any validation that could not be run and why.

