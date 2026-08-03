# Mission image assets

Add one primary image for a mission as:

```text
<mission-id>.jpg
```

For example, the mission ID `sfjazz` maps to `sfjazz.jpg`.

Optional alternates stay beside the primary as `sfjazz-2.jpg` and `sfjazz-3.jpg`. The application renders only the unsuffixed primary. To activate a new primary image, add its mission ID to `localMissionImageIds` in `lib/mission-images.ts`.

Do not use spaces, dates, or informal suffixes in filenames. Keep images landscape when possible, since mission cards crop them horizontally.
