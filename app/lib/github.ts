// Minimal GitHub Contents/Commits API helpers. Phase 4 needs only the
// latest-commit lookup; Phase 10 extends this module with Contents reads.

const GITHUB_API = "https://api.github.com";

export interface LatestCommit {
  date: string | null;
  message: string;
}

export interface GitHubResult<T> {
  data: T | null;
  rateLimitRemaining: number | null;
}

function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function rateLimitFrom(res: Response): number | null {
  const rl = res.headers.get("x-ratelimit-remaining");
  return rl == null ? null : Number(rl);
}

// repo is "owner/name" as stored in apps.github_repo.
export async function getLatestCommit(
  repo: string,
  token: string | undefined = process.env.GITHUB_TOKEN,
): Promise<GitHubResult<LatestCommit>> {
  if (!token) return { data: null, rateLimitRemaining: null };

  const res = await fetch(`${GITHUB_API}/repos/${repo}/commits?per_page=1`, {
    headers: ghHeaders(token),
    signal: AbortSignal.timeout(8000),
  });

  const rateLimitRemaining = rateLimitFrom(res);
  if (!res.ok) return { data: null, rateLimitRemaining };

  const commits = (await res.json()) as Array<{
    commit: { message: string; committer: { date: string } | null };
  }>;
  const top = commits[0];
  if (!top) return { data: null, rateLimitRemaining };

  return {
    data: { date: top.commit.committer?.date ?? null, message: top.commit.message },
    rateLimitRemaining,
  };
}

export interface RepoFile {
  text: string;
  sha: string;
}

export interface DirEntry {
  name: string;
  path: string;
  sha: string;
  type: string;
}

// Single file from the Contents API. data is null on 404 (file absent) or any
// non-OK response. `path` is repo-relative, e.g. ".cappshub/instructions.md".
export async function getRepoContents(
  repo: string,
  path: string,
  token: string | undefined = process.env.GITHUB_TOKEN,
): Promise<GitHubResult<RepoFile>> {
  if (!token) return { data: null, rateLimitRemaining: null };

  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    headers: ghHeaders(token),
    signal: AbortSignal.timeout(8000),
  });

  const rateLimitRemaining = rateLimitFrom(res);
  if (!res.ok) return { data: null, rateLimitRemaining };

  const json = (await res.json()) as {
    type?: string;
    content?: string;
    encoding?: string;
    sha?: string;
  };
  // A directory comes back as an array; callers wanting a file get null.
  if (Array.isArray(json) || json.type !== "file" || json.encoding !== "base64") {
    return { data: null, rateLimitRemaining };
  }

  const text = Buffer.from(json.content ?? "", "base64").toString("utf8");
  return { data: { text, sha: json.sha ?? "" }, rateLimitRemaining };
}

// Directory listing from the Contents API (e.g. ".cappshub/notes/"). data is
// null on 404 or when the path is not a directory.
export async function listDirContents(
  repo: string,
  path: string,
  token: string | undefined = process.env.GITHUB_TOKEN,
): Promise<GitHubResult<DirEntry[]>> {
  if (!token) return { data: null, rateLimitRemaining: null };

  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
    headers: ghHeaders(token),
    signal: AbortSignal.timeout(8000),
  });

  const rateLimitRemaining = rateLimitFrom(res);
  if (!res.ok) return { data: null, rateLimitRemaining };

  const json = await res.json();
  if (!Array.isArray(json)) return { data: null, rateLimitRemaining };

  const entries = (json as Array<{ name: string; path: string; sha: string; type: string }>).map(
    (e) => ({ name: e.name, path: e.path, sha: e.sha, type: e.type }),
  );
  return { data: entries, rateLimitRemaining };
}
