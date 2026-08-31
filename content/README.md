# Content

Authored as YAML, one file per content item, matching the schemas in
`docs/02-content-bible.md`. Vite transforms these at bundle time, so there is no
separate build step and no generated JSON to keep in sync.

```
/content
  /origins/*.yaml
  /events/<stage>/*.yaml
  /endings/*.yaml
```

`src/engine/content.ts` globs these, validates them, and collects a file path and a
reason for anything malformed. It catches unknown stat keys (`Agi` instead of `Ag`),
unknown stages, unknown ending categories, duplicate ids, terminal consequences with
no `ending_category`, and stat-checked choices missing an `on_success` / `on_failure`
branch. Any error blocks the app and renders the full list, so a typo cannot quietly
remove content from the pool.

## Schema extensions beyond the Content Bible

- **`name_pools` on an origin** (optional). Supplies `forenames`, `surnames`, and an
  optional `format` string (default `"{forename} {surname}"`). Character names are
  origin-flavoured, so they live next to the origin they belong to rather than in the
  engine, which keeps adding a world a content-only change. An origin without
  `name_pools` falls back to a generic pool instead of failing.

- **`record_phrase` on an origin** (optional). The display name reads as a heading
  ("Hive World: Underhive") and badly mid-sentence, so the Service Record precis uses
  this prose form instead: "Taken from the underhive, served with...". Falls back to
  `name`.

## Not yet supported

The Content Bible's multi-beat vignette shape (§1.3, §6: a `beats` array with nested
`outcomes`) is not implemented. The Long War vignettes are authored as single event
cards instead. Authoring one as a multi-beat vignette will fail validation.

## Eligibility gates are not free

A `stat_min` higher than what is actually reachable by that stage silently removes an
event from the pool: it is never drawn and never reported, because an empty candidate
set is legal. Two recruitment events shipped at 0% eligibility this way. Measure the
distribution at the stage before setting a gate rather than guessing.
