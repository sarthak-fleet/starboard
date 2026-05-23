import { describe, expect, it } from "vitest";

import {
  buildMaintainerDigest,
  type MaintainerDigestRepoInput,
} from "@/lib/maintainer-digest";

const baseRepo: MaintainerDigestRepoInput = {
  id: 1,
  name: "repo",
  fullName: "owner/repo",
  htmlUrl: "https://github.com/owner/repo",
  description: "A useful project",
  language: "TypeScript",
  stargazersCount: 1200,
  archived: false,
  repoUpdatedAt: "2026-05-01T00:00:00Z",
  starredAt: "2026-05-07T00:00:00Z",
  isStarred: true,
  isSaved: false,
  notes: null,
  collectionCount: 0,
  starsSevenDaysAgo: 1150,
  thresholdEventsSevenDays: 0,
};

describe("maintainer digest", () => {
  const now = new Date("2026-05-08T00:00:00Z");

  it("groups recent star activity and follow-up actions", () => {
    const digest = buildMaintainerDigest([baseRepo], now);

    expect(digest.summary.starActivity).toBe(1);
    expect(digest.summary.followUps).toBe(1);
    expect(digest.groups.find((group) => group.id === "star_activity")?.items[0]?.starboardUrl).toBe("/explore/owner/repo");
    expect(digest.groups.find((group) => group.id === "follow_up")?.items[0]?.actionLabel).toBe("Assign collection");
  });

  it("flags new high-signal repositories from stars and thresholds", () => {
    const digest = buildMaintainerDigest(
      [
        {
          ...baseRepo,
          id: 2,
          fullName: "owner/hot",
          htmlUrl: "https://github.com/owner/hot",
          stargazersCount: 7200,
          starsSevenDaysAgo: 6800,
          thresholdEventsSevenDays: 1,
        },
      ],
      now
    );

    const highSignal = digest.groups.find((group) => group.id === "high_signal");
    expect(highSignal?.items).toHaveLength(1);
    expect(highSignal?.items[0]?.detail).toContain("threshold");
  });

  it("surfaces stale saved repos for review", () => {
    const digest = buildMaintainerDigest(
      [
        {
          ...baseRepo,
          id: 3,
          fullName: "owner/stale",
          htmlUrl: "https://github.com/owner/stale",
          isSaved: true,
          isStarred: false,
          repoUpdatedAt: "2024-01-01T00:00:00Z",
          starredAt: "2025-01-01T00:00:00Z",
        },
      ],
      now
    );

    const stale = digest.groups.find((group) => group.id === "stale_saved");
    expect(stale?.items).toHaveLength(1);
    expect(stale?.items[0]?.actionLabel).toBe("Review saved status");
  });
});
