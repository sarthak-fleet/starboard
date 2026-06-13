# Hybrid Ranking Eval Harness

**Status:** Shipped 2026-06-13

**Implementation:** `src/lib/recommendation-eval.ts`, `src/__tests__/fixtures/recommendation-eval-fixture.ts`, `src/__tests__/recommendation-eval.test.ts`

**Follow-up:** Tune production ranking only after the fixture benchmark stays green across scorer changes.

## Summary

Ship a fixture-backed evaluation harness for Starboard's recommendation scoring,
then use it to safely introduce hybrid ranking improvements without regressing
the current deterministic behavior.

## Problem

Starboard already has several ranking signals:

- lexical and metadata overlap
- repository category and AI metadata
- embedding-distance boosts where available
- suppression of dependencies already used by a project

Those signals are useful, but the current tuning is hard to validate. There is no
portable benchmark that says whether a scoring change improves top-k quality or
explanation clarity before it reaches production.

## Proposed Feature

Add a small, checked-in evaluation fixture with:

- 3 to 5 representative fleet project snapshots
- 20 to 40 saved repositories per fixture set
- expected top recommendations per project
- explanation expectations for why a repo ranked well or was suppressed

Then add a test-only hybrid scorer variant that can compare:

- current deterministic scoring
- an RRF-style fusion score
- future feature-specific weighting tweaks

## User Value

- Safer recommendation changes
- Faster iteration on project recommendations
- Better confidence that hybrid search improves relevance instead of just moving scores around

## Non-Goals

- No new vector store
- No new third-party search engine
- No LLM-generated explanation layer in the critical path

## Acceptance Criteria

- A checked-in fixture describes multiple project contexts and candidate repos.
- The test suite can score the fixture with the current scorer and the hybrid variant.
- The harness reports top-k hits and suppression reasons for each fixture.
- The docs explain how to extend the fixture when a new project surface is added.

## Rollout Plan

1. Add fixture data.
2. Add a test-only scoring comparison helper.
3. Write regression tests around expected top recommendations.
4. Tune production ranking only after the benchmark is stable.

## Risks

- Fixtures can drift from real project surfaces if not refreshed.
- Overfitting to the sample set could hide ranking issues in larger libraries.

