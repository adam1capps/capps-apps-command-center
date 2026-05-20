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

// repo is "owner/name" as stored in apps.github_repo.
export async function getLatestCommit(
  repo: string,
  token: string | undefined = process.env.GITHUB_TOKEN,
): Promise<GitHubResult<LatestCommit>> {
  if (!token) return { data: null, rateLimitRemaining: null };

  const res = await fetch(`${GITHUB_API}/repos/${repo}/commits?per_page=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(8000),
  });

  const rlHeader = res.headers.get("x-ratelimit-remaining");
  const rateLimitRemaining = rlHeader == null ? null : Number(rlHeader);

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
