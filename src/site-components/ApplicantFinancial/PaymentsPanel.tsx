'use client';

import  { useEffect, useMemo, useState } from 'react';
import { Clock, CreditCard, ExternalLink, Loader2, XCircle, CheckCircle2, Info, RefreshCw } from 'lucide-react';
// import { cn } from '../../lib/utils';

/** ─────────── UI palette ─────────── */
const BRAND = { primary: '#a4262c', navy: '#011d41' };

/** ─────────── Types ─────────── */
export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'failed';

export interface PaymentItem {
  id: string;
  createdOn: string;       // ISO
  description?: string;
  amount: number;          // major units (e.g., 120.00)
  currency?: string;       // default CAD if not provided
  status: PaymentStatus;
  payUrl?: string | null;  // present on pending
}

/** Response shapes tolerated */
type PaymentsListResponse = { items: PaymentItem[] } | PaymentItem[];
type LatestLinkResponse = { checkoutUrl?: string | null } | { payUrl?: string | null } | string | null;

/** ─────────── Runtime detection ─────────── */
const isLocalDev = import.meta.env.MODE === 'development';

/** ─────────── Power Pages flow URLs (NO env) ───────────
 * Replace these GUIDs with your real Cloud Flow triggers.
 * Optional runtime override: window.BV_FLOW_URLS = { listPayments: '...', latestPending: '...' }
 */
const PP_FLOW_URLS_HARDCODED = {
  listPayments: '/_api/cloudflow/v1.0/trigger/66bf81a5-0f79-f011-b4cc-002248ad99ee',
  latestPending: '/_api/cloudflow/v1.0/trigger/REPLACE-GUID-LATEST-PENDING',
} as const;

function getPowerPagesUrls() {
  const w = (window as any);
  if (w?.BV_FLOW_URLS?.listPayments && w?.BV_FLOW_URLS?.latestPending) return w.BV_FLOW_URLS;
  return PP_FLOW_URLS_HARDCODED;
}

/** ─────────── Local dev flow URLs (from env) ───────────
 * These should be full Logic Apps manual-trigger URLs.
 */
const FLOW_URLS_LOCAL = {
  listPayments: import.meta.env.VITE_BV_APPLICANT_PAYMENTS_LIST_LOCAL as string | undefined,
  latestPending: import.meta.env.VITE_BV_APPLICANT_LATEST_PENDING_LOCAL as string | undefined,
};

/** Local token + test user (env) */
const LOCAL_TOKEN_URL =
  import.meta.env.VITE_LOCAL_GET_TOKEN_URL ?? 'http://localhost:3001/api/get-token';
const LOCAL_DEV_USER_ID = import.meta.env.VITE_LOCAL_DEV_USER_ID as string | undefined;

/** ─────────── Local token cache ─────────── */
let _cachedToken: string | null = null;
let _cachedAt = 0;
const TOKEN_TTL_MS = 4 * 60 * 1000;

async function getLocalAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() - _cachedAt < TOKEN_TTL_MS) return _cachedToken;
  const r = await fetch(LOCAL_TOKEN_URL, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to get local access token');
  const j = await r.json();
  const token = j.accessToken ?? j.access_token ?? j.token;
  if (!token) throw new Error('No access token in local auth response');
  _cachedToken = token;
  _cachedAt = Date.now();
  return token;
}

/** ─────────── Unified flow caller (exact Test page rules) ─────────── */
async function callFlow(urlLocal: string | undefined, urlPP: string | undefined, body: object) {
  if (isLocalDev) {
    if (!urlLocal) throw new Error('Local flow URL not set');
    const token = await getLocalAccessToken();
    const res = await fetch(urlLocal, {
      method: 'POST',
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },

      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Local flow call failed: ${res.status} ${res.statusText}`);
    return await res.json();
  } else {
    if (!urlPP) throw new Error('Power Pages flow URL not set');
    const response = await (window as any).shell.ajaxSafePost({
      type: 'POST',
      url: urlPP,
      data: { eventData: JSON.stringify(body) }, // IMPORTANT PP shape
    });
    return JSON.parse(response); // IMPORTANT PP parse
  }
}

/** ─────────── Panel ─────────── */
export default function PaymentsPanel() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PaymentItem[]>([]);
  const [latestUrl, setLatestUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ppUrls = getPowerPagesUrls();

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      // 1) payments list
      const listBody = { userid: isLocalDev ? LOCAL_DEV_USER_ID : undefined }; // userid only for local
      const listRes = (await callFlow(
        FLOW_URLS_LOCAL.listPayments,
        ppUrls.listPayments,
        listBody
      )) as PaymentsListResponse;

      const items: PaymentItem[] = Array.isArray(listRes) ? listRes : (listRes?.items ?? []);
      setRows(items);

      // 2) latest pending link (optional; fall back to derived)
      try {
        const latestRes = (await callFlow(
          FLOW_URLS_LOCAL.latestPending,
          ppUrls.latestPending,
          { userid: isLocalDev ? LOCAL_DEV_USER_ID : undefined }
        )) as LatestLinkResponse;

        let url: string | null = null;
        if (typeof latestRes === 'string') url = latestRes || null;
        else if (latestRes && typeof latestRes === 'object') {
          url = (latestRes as any).checkoutUrl ?? (latestRes as any).payUrl ?? null;
        }
        setLatestUrl(url ?? null);
      } catch {
        setLatestUrl(null);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const derivedLatestPending = useMemo(() => {
    const pending = rows.filter((r) => r.status === 'pending');
    pending.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
    return pending[0];
  }, [rows]);

  const effectiveLatestUrl = useMemo(
    () => latestUrl ?? derivedLatestPending?.payUrl ?? null,
    [latestUrl, derivedLatestPending]
  );



  return (
    <div className="space-y-6">
      {/* Latest pending card */}
      <section className="rounded-xl ring-1 ring-black/5 bg-[#f9fafb] p-4">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-[#011d41]" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold" style={{ color: BRAND.navy }}>
                Latest pending payment
              </h3>

              <button
                onClick={loadAll}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-white"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>

            {loading && (
              <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading latest payment…
              </div>
            )}

            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" /> {error}
              </div>
            )}

            {!loading && !derivedLatestPending && !effectiveLatestUrl && (
              <p className="mt-1 text-sm text-neutral-600">You have no pending payments at the moment.</p>
            )}

            {derivedLatestPending && (
              <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-neutral-700">
                  <div className="font-medium" style={{ color: BRAND.navy }}>
                    {derivedLatestPending.description || 'Payment'}
                  </div>
                  <div className="text-neutral-600">
                    Created {new Date(derivedLatestPending.createdOn).toLocaleString()} •{' '}
                    <span className="font-semibold" style={{ color: BRAND.navy }}>
                      {derivedLatestPending.currency ?? 'CAD'} {derivedLatestPending.amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {effectiveLatestUrl ? (
                  <a
                    href={effectiveLatestUrl}
                    className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: BRAND.primary }}
                  >
                    Continue payment <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Payments table */}
      <section className="rounded-2xl bg-white ring-1 ring-black/5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-600">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="border-t">
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-600">
                  <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                  Loading…
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr className="border-t">
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-600">
                  <div className="inline-flex items-center gap-2">
                    <Info className="h-4 w-4" /> No payments yet.
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((p) => {
                const badge =
                  p.status.toLowerCase() === 'paid'
                    ? <span className="rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-2 py-0.5 text-xs inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Paid</span>
                    : p.status.toLowerCase() === 'pending'
                    ? <span className="rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-2 py-0.5 text-xs inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Pending</span>
                    : p.status.toLowerCase() === 'expired'
                    ? <span className="rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200 px-2 py-0.5 text-xs inline-flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />Expired</span>
                    : <span className="rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 px-2 py-0.5 text-xs inline-flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />Failed</span>;

                return (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-2">{new Date(p.createdOn).toLocaleString()}</td>
                    <td className="px-4 py-2">{p.description ?? 'Payment'}</td>
                    <td className="px-4 py-2 font-semibold" style={{ color: BRAND.navy }}>
                      {p.currency ?? 'CAD'} {p.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">{badge}</td>
                    <td className="px-4 py-2">
                      {p.status.toLowerCase() === 'pending' && p.payUrl ? (
                        <a
                          href={p.payUrl}
                          className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: BRAND.primary }}
                        >
                          Pay now <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
