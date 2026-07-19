/**
 * Structured refresh-lifecycle manifest for Starboard's scheduled jobs.
 *
 * Satisfies the `data-research-toolbox-automation` capability requirement
 * "Refresh lifecycle and quality": every import/refresh exposes source
 * watermark, bounds, timeout, idempotency/dedup, retries, output counts /
 * quality signal, freshness, and durable failure state.
 *
 * The manifest defaults to `data/refresh-manifest.json` and can be redirected
 * by callers (notably tests). A zero-output run advances freshness only when
 * the caller supplies explicit evidence that the no-op was verified.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PROJECT_ROOT = resolve(__dirname, '..', '..');
const MANIFEST_PATH = resolve(PROJECT_ROOT, 'data', 'refresh-manifest.json');

export const DEFAULT_RETRIES = { maxAttempts: 4, backoffBaseMs: 1000 } as const;

export interface RefreshStepRecord {
  step: string;
  source_watermark: string | null;
  bounds: Record<string, number | string>;
  timeout_s: number;
  idempotency: string;
  retries: { maxAttempts: number; backoffBaseMs: number; used: number };
  output_count: number;
  evidence_status: 'produced' | 'verified_noop' | 'missing' | 'failed';
  quality_signal: {
    expected_min_output: number;
    verified_noop_reason: string | null;
  };
  quality_failed: boolean;
  error: string | null;
  freshness: { wall_clock: string | null; delta_s_from_prior: number | null };
}

export interface RefreshManifestState {
  runs: Record<string, RefreshStepRecord>;
  last_failure: {
    step: string;
    at: string;
    error: string;
    unresolved: boolean;
  } | null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function parseIso(s: string | null | undefined): number {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t / 1000;
}

function load(manifestPath: string): RefreshManifestState {
  try {
    const raw = readFileSync(manifestPath, 'utf8');
    const parsed = JSON.parse(raw) as RefreshManifestState;
    if (!parsed.runs) parsed.runs = {};
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { runs: {}, last_failure: null };
    }
    throw error;
  }
}

function save(state: RefreshManifestState, manifestPath: string): void {
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(state, null, 2));
}

export interface RecordStepInput {
  step: string;
  sourceWatermark: string | null;
  bounds: Record<string, number | string>;
  timeoutS: number;
  idempotency: string;
  outputCount: number;
  expectedMinOutput: number;
  verifiedNoopReason?: string;
  error?: string | null;
  retriesUsed?: number;
}

export interface RefreshManifestOptions {
  manifestPath?: string;
}

export function recordStep(
  input: RecordStepInput,
  options: RefreshManifestOptions = {}
): RefreshStepRecord {
  const manifestPath = options.manifestPath ?? MANIFEST_PATH;
  const state = load(manifestPath);
  const prior = state.runs[input.step];
  const priorFresh = prior?.freshness.wall_clock ?? null;

  const expectedMin = input.expectedMinOutput ?? 0;
  const verifiedNoop =
    !input.error &&
    input.outputCount === 0 &&
    expectedMin === 0 &&
    Boolean(input.verifiedNoopReason?.trim());
  const evidenceStatus: RefreshStepRecord['evidence_status'] = input.error
    ? 'failed'
    : input.outputCount >= expectedMin && input.outputCount > 0
      ? 'produced'
      : verifiedNoop
        ? 'verified_noop'
        : 'missing';
  const qualityFailed = evidenceStatus === 'missing';
  const succeeded = evidenceStatus === 'produced' || evidenceStatus === 'verified_noop';

  const record: RefreshStepRecord = {
    step: input.step,
    source_watermark: input.sourceWatermark,
    bounds: input.bounds,
    timeout_s: input.timeoutS,
    idempotency: input.idempotency,
    retries: { ...DEFAULT_RETRIES, used: input.retriesUsed ?? 0 },
    output_count: input.outputCount,
    evidence_status: evidenceStatus,
    quality_signal: {
      expected_min_output: expectedMin,
      verified_noop_reason: verifiedNoop ? input.verifiedNoopReason!.trim() : null,
    },
    quality_failed: qualityFailed,
    error: input.error ?? null,
    freshness: {
      wall_clock: succeeded ? nowIso() : priorFresh,
      delta_s_from_prior:
        succeeded && priorFresh ? Math.floor(Date.now() / 1000 - parseIso(priorFresh)) : null,
    },
  };
  state.runs[input.step] = record;

  if (input.error || qualityFailed) {
    state.last_failure = {
      step: input.step,
      at: nowIso(),
      error: input.error ?? 'quality_failed: output evidence missing or below the declared minimum',
      unresolved: true,
    };
  } else if (state.last_failure?.step === input.step) {
    state.last_failure = null;
  }

  save(state, manifestPath);
  return record;
}

/**
 * Run `fn`, retry transient failures, record the manifest entry.
 *
 * `fn` returns `[outputCount, sourceWatermark?]`. If it throws, the error
 * message is recorded as the step error.
 */
export async function withRetry(
  step: string,
  fn: () => Promise<[number, string | null]>,
  opts: {
    sourceWatermark: string | null;
    bounds: Record<string, number | string>;
    timeoutS: number;
    idempotency: string;
    expectedMinOutput: number;
    verifiedNoopReason?: string;
    manifestPath?: string;
  }
): Promise<RefreshStepRecord> {
  const maxAttempts = DEFAULT_RETRIES.maxAttempts;
  const baseMs = DEFAULT_RETRIES.backoffBaseMs;
  let lastError: string | null = null;
  let retriesUsed = 0;
  let outputCount = 0;
  let watermark = opts.sourceWatermark;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const [count, wmOverride] = await fn();
      outputCount = count;
      if (wmOverride !== null) watermark = wmOverride;
      lastError = null;
      break;
    } catch (err) {
      lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      retriesUsed = attempt;
      if (attempt >= maxAttempts) break;
      await new Promise((r) => setTimeout(r, baseMs * 2 ** (attempt - 1)));
    }
  }

  return recordStep(
    {
      step,
      sourceWatermark: watermark,
      bounds: opts.bounds,
      timeoutS: opts.timeoutS,
      idempotency: opts.idempotency,
      outputCount,
      expectedMinOutput: opts.expectedMinOutput,
      verifiedNoopReason: opts.verifiedNoopReason,
      error: lastError,
      retriesUsed,
    },
    { manifestPath: opts.manifestPath }
  );
}

export function readManifest(options: RefreshManifestOptions = {}): RefreshManifestState {
  return load(options.manifestPath ?? MANIFEST_PATH);
}
