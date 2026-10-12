# Mission image workflow

## Add or change an image

1. Find the record in `data/source-catalog.json` by stable mission `id` under its owning source group.
2. Keep image metadata on that record’s `image` field: image URL, alt text, credit, original source URL, and license where applicable.
3. For a locally served image, add the primary at `public/images/missions/<mission-id>.jpg` and point that record’s image URL to `/images/missions/<mission-id>.jpg`.
4. Optional visual candidates may stay beside the primary as `<mission-id>-2.jpg` and `<mission-id>-3.jpg`; they are not rendered automatically.
5. Preserve a documented permission basis, credit, and source URL. Existing project-approved images are retained; adding a new image still requires its own rights review.
6. Run `npm run catalog:validate` and inspect the browser. The validator rejects a referenced local file that does not exist.

## Current collection

The existing asset directory contains 282 JPG files: 134 unsuffixed local primary images and 148 alternate candidates. The catalog includes local image metadata and two legacy externally hosted Wikimedia Commons images with credit/license metadata. Image records are embedded in their catalog entries; there is no separate image-ID manifest.

## Image quality and fallback

- Use landscape crops appropriate for wide cards.
- Keep filenames stable and lowercase; do not use spaces or dates.
- Do not switch to an unreviewed alternate automatically.
- If no image has a clear permission basis, omit it and use the venue/neighborhood visual treatment.
- Do not mirror remote files without permission, credit, source URL, checksum, fetch time, and deletion policy.
