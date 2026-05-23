/**
 * Owner-facing analytics — the shared fleet funnel plus narrow product events.
 *
 * Every project in the fleet emits these four funnel events — `signup`,
 * `activated`, `core_action`, `returned` — so a single PostHog project can
 * build one cross-fleet funnel (signup -> activated -> core_action) and a
 * D1/D7 retention insight, with no custom dashboard.
 *
 * Every event carries `project: "starboard"`. This wrapper is intentionally
 * thin so it can later be folded into `@saas-maker/posthog-client`.
 *
 * It is isomorphic: in the browser it routes through `@saas-maker/posthog-client`
 * (`track`); inside a server action / route handler it routes through
 * `@saas-maker/posthog-client/server` so the server-triggered events
 * (`activated`, `core_action`) still land.
 *
 * NOTE: both posthog entries are loaded lazily via dynamic `import()` inside the
 * branch that actually uses them. This module is imported from BOTH a client
 * component (`session-tracker.tsx`) and server route handlers, so neither entry
 * can be a static top-level import:
 *  - `@saas-maker/posthog-client` (browser) bundles `PostHogProvider`, which
 *    calls `React.createContext` at module-evaluation time — a static import
 *    would crash SSR / `next build` with "createContext is not a function".
 *  - `@saas-maker/posthog-client/server` pulls in `posthog-node`, which uses
 *    `node:fs` — a static import would drag Node built-ins into the browser
 *    client bundle and break the build.
 * Loading each lazily inside its own `typeof window` branch keeps each entry
 * out of the context where it cannot run.
 */

const PROJECT = "starboard" as const;

// Shared with foundry-monitoring.ts — same PostHog project.
const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
  "phc_qgiAarw4Co4pw9fz3Fxj4UJaHmqzFetqs4JrXhGc35Nd";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/**
 * The product-specific action behind a `core_action` event.
 * Starboard's core verbs: syncing your GitHub stars in, and organizing
 * them into collections.
 */
export type CoreAction = "repos_synced" | "list_created";
export type DigestItemAction = "reviewed" | "dismissed";

interface AnalyticsEventMap {
  /** First session after an account is created. */
  signup: { project: typeof PROJECT };
  /** The user reaches first real value — their first successful star sync. */
  activated: { project: typeof PROJECT };
  /** The thing the product exists to do. */
  core_action: { project: typeof PROJECT; action: CoreAction };
  /** A return session by a user with prior activity. */
  returned: { project: typeof PROJECT };
  /** The maintainer digest was rendered for the user. */
  digest_opened: { project: typeof PROJECT; digest_id: string; item_count: number };
  /** A digest item was reviewed or dismissed. */
  digest_item_actioned: {
    project: typeof PROJECT;
    digest_id: string;
    item_id: string;
    group: string;
    action: DigestItemAction;
  };
}

function emit<K extends keyof AnalyticsEventMap>(
  event: K,
  props: Omit<AnalyticsEventMap[K], "project">,
  distinctId?: string,
): void {
  const payload = { project: PROJECT, ...props };
  try {
    if (typeof window === "undefined") {
      // Server context (route handler / server action). Load the React-free
      // `/server` entry lazily so `posthog-node` (`node:fs`) is never bundled
      // into the browser client chunk.
      void import("@saas-maker/posthog-client/server")
        .then(({ createPostHogServer, getServerClient, trackServer }) => {
          if (!getServerClient()) {
            createPostHogServer({ apiKey: POSTHOG_KEY, host: POSTHOG_HOST });
          }
          trackServer(event, {
            distinctId: distinctId ?? `${PROJECT}-server`,
            properties: payload,
          });
        })
        .catch(() => {
          // Analytics must never break a user flow. Swallow and move on.
        });
    } else {
      // Browser context. Load the browser client lazily so the React-dependent
      // `@saas-maker/posthog-client` entry is never evaluated during SSR.
      void import("@saas-maker/posthog-client")
        .then(({ track }) => {
          track(event, payload);
        })
        .catch(() => {
          // Analytics must never break a user flow. Swallow and move on.
        });
    }
  } catch {
    // Analytics must never break a user flow. Swallow and move on.
  }
}

/** Fire once, on the first session after an account is created. */
export function trackSignup(): void {
  emit("signup", {});
}

/** Fire once, when the user first reaches real value (first star sync). */
export function trackActivated(distinctId?: string): void {
  emit("activated", {}, distinctId);
}

/** Fire on each completion of the core product action. */
export function trackCoreAction(action: CoreAction, distinctId?: string): void {
  emit("core_action", { action }, distinctId);
}

/** Fire on session start for a user who has prior activity. */
export function trackReturned(): void {
  emit("returned", {});
}

/** Fire when the weekly maintainer digest is opened. */
export function trackDigestOpened(digestId: string, itemCount: number): void {
  emit("digest_opened", { digest_id: digestId, item_count: itemCount });
}

/** Fire when a digest item is marked reviewed or dismissed. */
export function trackDigestItemActioned(
  digestId: string,
  itemId: string,
  group: string,
  action: DigestItemAction
): void {
  emit("digest_item_actioned", {
    digest_id: digestId,
    item_id: itemId,
    group,
    action,
  });
}
