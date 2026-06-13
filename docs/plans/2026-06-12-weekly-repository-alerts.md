# Weekly Repository Alerts

**Status:** Shipped 2026-06-13

**Implementation:** `src/lib/alert-preferences.ts`, `src/lib/weekly-alerts.ts`, `/api/alerts/*`, Radar alert settings + inbox UI

**Follow-up:** Wire weekly digest email delivery after alert payloads prove stable in production.

## Summary

Add opt-in alerts that notify users when starred repositories cross important
thresholds or enter a new activity state.

## Problem

Starboard already computes release, momentum, and maintenance signals, but the
value is still mostly pull-based. Users have to open the app to discover that a
repo they care about just shipped a release, crossed a star-growth threshold, or
went quiet.

## Proposed Feature

Add alert subscriptions for:

- recent releases on starred repos
- large momentum changes
- repos that have gone dormant
- repositories that cross user-defined thresholds

Alerts should support at least:

- in-app notifications
- weekly digest email
- per-lane filters for release, maintenance, and momentum

## User Value

- Reduces the need to manually check the dashboard
- Turns the radar surface into a proactive signal system
- Gives Starboard a natural retention loop beyond search

## Non-Goals

- No real-time push system in the first slice
- No broad social feed
- No notifications for every minor metadata change

## Acceptance Criteria

- A user can opt into one or more alert lanes.
- The system can generate a weekly digest from existing radar data.
- Alert rules can be edited without a schema rewrite.
- A quiet default exists so new users are not spammed.

## Rollout Plan

1. Define alert rules and storage.
2. Reuse radar scoring for digest generation.
3. Add an inbox or settings surface for subscription management.
4. Wire delivery after the alert payloads are stable.

## Risks

- Too many alerts could erode trust.
- Delivery infrastructure adds complexity if introduced before the rules are stable.

