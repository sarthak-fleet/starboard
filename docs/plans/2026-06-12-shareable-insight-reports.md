# Shareable Insight Reports

**Status:** Shipped 2026-06-13

**Implementation:** `src/lib/insight-reports.ts`, `POST /api/reports`, `/reports/[slug]`, share buttons on Radar, My Projects, and weekly cleanup digest

**Follow-up:** None required for the first slice; extend only if new report sources are added.

## Summary

Create shareable, read-only reports for Starboard's radar, project recommendations,
and cleanup suggestions so users can send a concise artifact instead of a raw app
link.

## Problem

Starboard currently works best as a personal workspace. That is useful, but it
limits the product's spread when a user wants to show a teammate why a repo was
flagged, why a project recommendation was made, or which starred repos are worth
reviewing this week.

## Proposed Feature

Add public or unlisted report pages for:

- weekly radar summaries
- project recommendation snapshots
- stale-repo cleanup lists

Reports should include:

- the ranking summary
- the key reasons behind each item
- a snapshot timestamp
- optional redaction of private notes

## User Value

- Makes Starboard easier to share with teammates and collaborators
- Provides a durable artifact for decisions, not just an interactive dashboard
- Increases product visibility without changing the core library workflow

## Non-Goals

- No editable collaboration in the first slice
- No full document editor
- No public exposure of private metadata by default

## Acceptance Criteria

- A user can generate a report from at least one existing Starboard surface.
- The report has a stable URL.
- The report is readable without exposing sensitive private state.
- The report renders cleanly on mobile and desktop.

## Rollout Plan

1. Pick one source surface, starting with the radar summary.
2. Serialize the report snapshot and reasoning.
3. Add a public read-only page.
4. Extend the pattern to project recommendations and cleanup views.

## Risks

- Shareable pages can leak information if defaults are too permissive.
- Snapshot storage can drift from the live library if not labeled clearly.

