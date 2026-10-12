# Mission image assets

Add one primary image for a mission as:

```text
<mission-id>.jpg
```

For example, the mission ID `sfjazz` maps to `sfjazz.jpg`.

Optional alternates stay beside the primary as `sfjazz-2.jpg` and `sfjazz-3.jpg`; the application renders only the unsuffixed primary. Add or activate an image through that mission record’s `image` field in `data/source-catalog.json`, under its owning source group.

Do not use spaces, dates, or informal suffixes in filenames. Keep images landscape when possible, since mission cards crop them horizontally.
