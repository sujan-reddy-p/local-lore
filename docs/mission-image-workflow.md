# Mission image workflow

## Add or change an image

1. Find the record in `data/source-catalog.json` by stable mission `id` under its owning source group.
2. Keep image metadata on that record’s `image` field: image URL, alt text, credit, original source URL, and license where applicable.
3. For a locally served image, add the primary at `public/images/missions/<mission-id>.jpg` and point that record’s image URL to `/images/missions/<mission-id>.jpg`.
4. Keep new candidates with unclear reuse rights **outside `public/`**, in ignored `outputs/image-review/<mission-id>/`. They must not be referenced by catalog image URLs or committed as public assets.
5. Preserve credit, source URL, and the actual permission evidence. Do not invent a license or mark unclear rights as confirmed. User review is required before publishing a staged unclear-rights candidate; this image-specific hold is not a general content approval gate.
6. Run `npm run catalog:validate` and inspect the browser. The validator rejects a referenced local file that does not exist.

## Current collection

Image metadata is embedded in catalog records. Existing authorized local and remote images remain usable; historical alternate files are not selected automatically. Current counts must be derived from the catalog, not this document.

## Image quality and fallback

- Use landscape crops appropriate for wide cards.
- Keep filenames stable and lowercase; do not use spaces or dates.
- Do not switch to an unreviewed alternate automatically.
- Missing or failed published photos use owned subject-specific artwork; do not replace them with unrelated stock imagery.
- Every discovery **and refresh** researches missing images: event photo, suitable venue photo, then logo. Download the best publicly accessible candidate locally even when explicit reuse permission cannot be established. Keep it private, not on the website.
- Record each successful staged download in `data/discovery-state.json.pendingImages`: record/lead ID, source page, original image URL, local path, image kind, alt, known credit, observed date, MIME type, byte size, content hash, actual reuse evidence, and `awaiting-image-review` status.
- Verify a bounded response decodes as an image, not an HTML error page. Do not bypass access controls or download whole galleries. Record failures honestly.
- A fresh clone does not contain ignored staged files. Use the manifest to locate or re-fetch candidates; never assume another agent has the original local binary.
- Follow `.claude/skills/local-discovery/SKILL.md` for the full research, staging, review, and publication procedure.
