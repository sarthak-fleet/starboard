# OpenSpec workflow

Starboard uses [OpenSpec](https://github.com/openspec-ai/openspec) for
spec-driven development on non-trivial features. Config in `openspec/config.yaml`.

## Layout

```
openspec/
  config.yaml              # OpenSpec config (schema: spec-driven)
  specs/                   # current accepted specs (one folder per spec)
    repo-tool-intelligence/spec.md
    star-momentum-insights/spec.md
  changes/                 # archived change proposals
    archive/<change-slug>/
      proposal.md, design.md, tasks.md, README.md, specs/
```

## When to use it

Trigger the spec-driven workflow (the `spec-driven` skill) at the start of
non-trivial feature work: multi-file, new surface, behavior change, or
cross-repo. The workflow is explore → propose → apply → archive so human and
agent agree on what to build before code is written.

## Archived changes

- `2026-07-12-star-history-tool-intelligence` — star history + tool
  intelligence (shipped). Specs promoted to `openspec/specs/`.

## Spec status note

Some `openspec/specs/*/spec.md` files have a `Purpose: TBD` placeholder left by
the archive step. Update the Purpose when a spec is next touched.
