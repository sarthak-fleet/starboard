import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackSearchOutcome } from '@/lib/analytics';

describe('trackSearchOutcome', () => {
  const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(null, { status: 200 }))
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    [0, 'zero'],
    [3, '1-5'],
    [6, '6-20'],
    [21, '21+'],
  ])('emits only the bucket for a result count of %i', (count, expectedBucket) => {
    trackSearchOutcome('lexical', count);

    expect(fetchMock).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(request.body as string);

    expect(body.properties).toEqual({
      project_id: 'starboard',
      surface: 'lexical',
      result_count_bucket: expectedBucket,
    });
    expect(body.properties).not.toHaveProperty('result_count_exact_capped');
  });
});
