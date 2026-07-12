/**
 * Fake WordPress REST transport for local no-live tests/smoke.
 * Never contacts a real WordPress host.
 */

export type WordPressFetch = typeof fetch;

export type FakeWordPressCapturedRequest = {
  url: string;
  method: string;
  /** Redacted Authorization for safe inspection (never raw Basic credentials). */
  authorizationRedacted: string | null;
  /** Raw Authorization present only for in-memory auth-shape asserts; never logged by smoke. */
  authorizationRawForTestOnly: string | null;
  body: Record<string, unknown> | null;
};

export type FakeWordPressTransportStats = {
  createCount: number;
  trashCount: number;
  methods: string[];
  urls: string[];
  lastCreate: FakeWordPressCapturedRequest | null;
  lastTrash: FakeWordPressCapturedRequest | null;
};

export type CreateFakeWordPressTransportOptions = {
  postId?: number;
  returnedStatus?: string;
  failCreate?: boolean;
  failTrash?: boolean;
  ambiguousCreate?: boolean;
  createHttpStatus?: number;
};

function redactAuthorization(value: string | null): string | null {
  if (!value) return null;
  return "Basic [REDACTED]";
}

export function createFakeWordPressTransport(options: CreateFakeWordPressTransportOptions = {}): {
  fetchImpl: WordPressFetch;
  stats: FakeWordPressTransportStats;
} {
  const postId = options.postId ?? 4242;
  const returnedStatus = options.returnedStatus ?? "draft";
  const stats: FakeWordPressTransportStats = {
    createCount: 0,
    trashCount: 0,
    methods: [],
    urls: [],
    lastCreate: null,
    lastTrash: null
  };

  const fetchImpl: WordPressFetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method ?? "GET").toUpperCase();
    const headers = new Headers(init?.headers);
    const authRaw = headers.get("Authorization");
    const bodyText = typeof init?.body === "string" ? init.body : init?.body ? String(init.body) : null;
    let body: Record<string, unknown> | null = null;
    if (bodyText) {
      try {
        body = JSON.parse(bodyText) as Record<string, unknown>;
      } catch {
        body = { raw: "[unparsed]" };
      }
    }

    stats.methods.push(method);
    stats.urls.push(url);

    const captured: FakeWordPressCapturedRequest = {
      url,
      method,
      authorizationRedacted: redactAuthorization(authRaw),
      authorizationRawForTestOnly: authRaw,
      body
    };

    const isPostsCollection = /\/wp-json\/wp\/v2\/posts\/?$/.test(url) && method === "POST";
    const isTrash =
      /\/wp-json\/wp\/v2\/posts\/\d+/.test(url) &&
      method === "DELETE";

    if (isPostsCollection) {
      stats.createCount += 1;
      stats.lastCreate = captured;
      if (options.failCreate) {
        return new Response(JSON.stringify({ code: "rest_forbidden", message: "fail" }), {
          status: options.createHttpStatus ?? 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (options.ambiguousCreate) {
        return new Response("not-json", { status: 200, headers: { "Content-Type": "text/plain" } });
      }
      return new Response(
        JSON.stringify({
          id: postId,
          status: returnedStatus,
          link: `https://example.test/?p=${postId}`,
          edit_link: `https://example.test/wp-admin/post.php?post=${postId}&action=edit`
        }),
        { status: options.createHttpStatus ?? 201, headers: { "Content-Type": "application/json" } }
      );
    }

    if (isTrash) {
      stats.trashCount += 1;
      stats.lastTrash = captured;
      if (options.failTrash) {
        return new Response(JSON.stringify({ code: "rest_cannot_delete", message: "fail" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(
        JSON.stringify({ id: postId, status: "trash", deleted: false }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ code: "rest_no_route", message: "unknown" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  };

  return { fetchImpl, stats };
}
