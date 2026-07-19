/**
 * Tests for the refresh-lifecycle manifest quality gate.
 *
 * Covers the `data-research-toolbox-automation` requirement: a refresh that
 * exits successfully with zero output where non-zero is expected fails
 * quality verification rather than advancing freshness.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_RETRIES,
  recordStep,
  readManifest,
  withRetry,
  type RefreshManifestState,
} from '@/lib/refresh-manifest';

let testDir: string;
let manifestPath: string;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), 'starboard-refresh-manifest-'));
  manifestPath = join(testDir, 'refresh-manifest.json');
});

afterEach(() => {
  vi.useRealTimers();
  rmSync(testDir, { recursive: true, force: true });
});

function storage() {
  return { manifestPath };
}

describe('refresh-manifest recordStep', () => {
  it('advances freshness on a successful non-zero-output run', () => {
    const rec = recordStep(
      {
        step: 'seed_walk',
        sourceWatermark: 'cursor_after_walk',
        bounds: { page_limit: 120 },
        timeoutS: 3600,
        idempotency: 'upsert',
        outputCount: 312,
        expectedMinOutput: 1,
      },
      storage()
    );
    expect(rec.quality_failed).toBe(false);
    expect(rec.evidence_status).toBe('produced');
    expect(rec.error).toBeNull();
    expect(rec.freshness.wall_clock).not.toBeNull();
  });

  it('marks zero output as quality_failed and does NOT advance freshness', () => {
    // Establish a baseline successful run.
    recordStep(
      {
        step: 'seed_embed',
        sourceWatermark: null,
        bounds: { daily_limit: 1000 },
        timeoutS: 1800,
        idempotency: 'upsert',
        outputCount: 500,
        expectedMinOutput: 1,
      },
      storage()
    );
    const first = readManifest(storage()).runs.seed_embed!;
    const firstWall = first.freshness.wall_clock;
    expect(firstWall).not.toBeNull();

    // Now a "successful" run with zero output where 1 was expected.
    recordStep(
      {
        step: 'seed_embed',
        sourceWatermark: null,
        bounds: { daily_limit: 1000 },
        timeoutS: 1800,
        idempotency: 'upsert',
        outputCount: 0,
        expectedMinOutput: 1,
      },
      storage()
    );
    const second = readManifest(storage()).runs.seed_embed!;
    expect(second.quality_failed).toBe(true);
    expect(second.evidence_status).toBe('missing');
    expect(second.freshness.wall_clock).toBe(firstWall);

    const failure = readManifest(storage()).last_failure;
    expect(failure?.step).toBe('seed_embed');
    expect(failure?.unresolved).toBe(true);
    expect(failure?.error).toContain('quality_failed');
  });

  it('requires explicit evidence before a zero-output run is a verified no-op', () => {
    const missing = recordStep(
      {
        step: 'seed_walk',
        sourceWatermark: null,
        bounds: {},
        timeoutS: 60,
        idempotency: 'upsert',
        outputCount: 0,
        expectedMinOutput: 0,
      },
      storage()
    );
    expect(missing.evidence_status).toBe('missing');
    expect(missing.quality_failed).toBe(true);
    expect(missing.freshness.wall_clock).toBeNull();

    const verified = recordStep(
      {
        step: 'seed_walk',
        sourceWatermark: 'cursor_after_walk',
        bounds: {},
        timeoutS: 60,
        idempotency: 'upsert',
        outputCount: 0,
        expectedMinOutput: 0,
        verifiedNoopReason: 'GitHub search completed with no matching rows',
      },
      storage()
    );
    expect(verified.evidence_status).toBe('verified_noop');
    expect(verified.quality_failed).toBe(false);
    expect(verified.quality_signal.verified_noop_reason).toContain('GitHub search completed');
    expect(verified.freshness.wall_clock).not.toBeNull();
  });

  it('does not replace corrupt prior evidence with a false-green manifest', () => {
    writeFileSync(manifestPath, '{not valid json');

    expect(() =>
      recordStep(
        {
          step: 'seed_walk',
          sourceWatermark: null,
          bounds: {},
          timeoutS: 60,
          idempotency: 'upsert',
          outputCount: 1,
          expectedMinOutput: 1,
        },
        storage()
      )
    ).toThrow(SyntaxError);
  });

  it('clears last_failure when the failing step next succeeds', () => {
    recordStep(
      {
        step: 'seed_walk',
        sourceWatermark: null,
        bounds: {},
        timeoutS: 60,
        idempotency: 'upsert',
        outputCount: 0,
        expectedMinOutput: 1,
      },
      storage()
    );
    expect(readManifest(storage()).last_failure?.step).toBe('seed_walk');

    recordStep(
      {
        step: 'seed_walk',
        sourceWatermark: null,
        bounds: {},
        timeoutS: 60,
        idempotency: 'upsert',
        outputCount: 42,
        expectedMinOutput: 1,
      },
      storage()
    );
    expect(readManifest(storage()).last_failure).toBeNull();
  });

  it('records the error and retry count after exhausting attempts', async () => {
    vi.useFakeTimers();
    async function boom(): Promise<[number, string | null]> {
      throw new Error('upstream 503');
    }
    const pending = withRetry('seed_embed', boom, {
      sourceWatermark: null,
      bounds: { daily_limit: 1000 },
      timeoutS: 1800,
      idempotency: 'upsert',
      expectedMinOutput: 1,
      manifestPath,
    });
    await vi.runAllTimersAsync();
    const rec = await pending;
    expect(rec.error).toContain('upstream 503');
    expect(rec.retries.used).toBe(DEFAULT_RETRIES.maxAttempts);
    expect(rec.quality_failed).toBe(false); // error path, not quality path
    expect(rec.evidence_status).toBe('failed');
    expect(readManifest(storage()).last_failure?.step).toBe('seed_embed');
  });

  it('readManifest returns the current state', () => {
    recordStep(
      {
        step: 'seed_pool_coverage',
        sourceWatermark: null,
        bounds: { min_stars_floor: 5000 },
        timeoutS: 60,
        idempotency: 'read-only',
        outputCount: 4321,
        expectedMinOutput: 1,
      },
      storage()
    );
    const state: RefreshManifestState = readManifest(storage());
    expect(state.runs.seed_pool_coverage).toBeDefined();
    expect(state.last_failure).toBeNull();
  });
});
