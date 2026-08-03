# Mission image workflow

Local Lore uses one primary local photograph for a mission and can retain `-2` and `-3` alternatives beside it for future curation. The UI only renders the unsuffixed primary.

## Add an image

1. Confirm the mission ID in `lib/seed-data.ts`.
2. Add the primary file at `public/images/missions/<mission-id>.jpg`.
3. Add that exact mission ID to `localMissionImageIds` in `lib/mission-images.ts`.
4. Put alternate candidates beside it as `<mission-id>-2.jpg` and `<mission-id>-3.jpg`; they are retained but never rendered automatically.
5. The manifest applies the image to both the mission browser and selected detail view. It records the project’s confirmed creator-permission basis internally without adding credits to the interface.
6. Run the normal lint, TypeScript, build, and test checks. A missing primary file will cause a broken image in the browser, so validate the path before committing.

## Current state

- `localMissionImageIds` identifies 117 primary local photos.
- 148 retained local JPGs are alternates for those missions and can be swapped into the primary position when a better crop is chosen.
- Three existing Wikimedia Commons mission images remain externally hosted and keep their original metadata in the seed catalog.

## Naming rules

- Use the exact stable mission ID, in lowercase kebab-case.
- Do not add spaces, dates, "final", or other informal filename suffixes.
- Use JPG for the current catalog convention and crop thoughtfully for a wide card preview.
- If a mission is renamed, update its image manifest key and filename in the same change.
