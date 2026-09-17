import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

/**
 * GSC OAuth callback receiver.
 *
 * Google redirects the browser here with ?code=...&state=... after the user
 * consents. We forward the code to the backend's token-exchange endpoint
 * (which stores the token in memory and associates it with `state` as the
 * userId), then show a confirmation and a link back into the app.
 */
export default function GscCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // pending | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = params.get('code');
    const state = params.get('state') || 'demo-user';
    const error = params.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Google returned an error: ${error}`);
      return;
    }
    if (!code) {
      setStatus('error');
      setMessage('Missing authorization code in the redirect URL.');
      return;
    }

    // Forward to backend token exchange. The backend expects a GET with the
    // same query params (code + state).
    const url = `/api/live/gsc/callback?code=${encodeURIComponent(
      code
    )}&state=${encodeURIComponent(state)}`;

    fetch(url, { method: 'GET' })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Backend responded ${res.status}`);
        }
        setStatus('success');
        setMessage('Google Search Console connected successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(`Failed to complete GSC connection: ${err.message}`);
      });
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-6">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
        {status === 'pending' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-emerald-400" />
            <h1 className="mt-4 text-lg font-semibold">Connecting Google Search Console…</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Finishing the authorization with Vizion SEO.
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
            <h1 className="mt-4 text-lg font-semibold">GSC Connected</h1>
            <p className="mt-2 text-sm text-neutral-400">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400"
            >
              Back to Dashboard
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-red-400" />
            <h1 className="mt-4 text-lg font-semibold">Connection failed</h1>
            <p className="mt-2 text-sm text-neutral-400">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 w-full rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
