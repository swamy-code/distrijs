import { useEffect, useState, type ReactNode } from 'react';
import { DistriProvider } from '@distri/react';

/**
 * Fetches a short-lived access token from the dev server's token endpoint
 * (see `../../shared/distri-token-proxy.ts`) and hands it to `<DistriProvider>`.
 *
 * The long-lived `DISTRI_API_KEY` never reaches the browser: it lives in the
 * Vite server process, which exchanges it for this scoped token. Do the same in
 * production — one endpoint on your own server that mints a short-lived token
 * for the signed-in user.
 */
const TOKEN_ENDPOINT = import.meta.env.VITE_DISTRI_TOKEN_ENDPOINT ?? '/api/distri/token';

interface TokenResponse {
  access_token: string;
  base_url: string;
  workspace_id?: string;
}

export function DistriTokenProvider({
  children,
  fallback,
}: {
  children: ReactNode;
  /** Rendered instead of `children` when no token could be obtained. */
  fallback?: (error: string) => ReactNode;
}) {
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const resp = await fetch(TOKEN_ENDPOINT, { method: 'POST' });
        if (!resp.ok) throw new Error(`${resp.status}: ${await resp.text()}`);
        const data = (await resp.json()) as TokenResponse;
        if (!cancelled) {
          setToken(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    };

    void refresh();
    // Tokens are issued with a 1h TTL; refresh before they lapse.
    const id = window.setInterval(refresh, 50 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (error) return <>{fallback ? fallback(error) : null}</>;
  if (!token) return <div className="token-notice">Fetching Distri access token…</div>;

  return (
    <DistriProvider
      config={{
        baseUrl: token.base_url,
        accessToken: token.access_token,
        workspaceId: token.workspace_id,
        authReady: true,
      }}
    >
      {children}
    </DistriProvider>
  );
}
