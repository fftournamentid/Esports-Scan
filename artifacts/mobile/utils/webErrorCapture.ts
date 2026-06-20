const _DEBUG_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/debuglog`;
function _postErr(label: string, msg: string): void {
  try {
    fetch(_DEBUG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg: `[${label}] ${msg.substring(0, 2000)}` }),
    }).catch(() => {});
  } catch (_) {}
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // No-op stub so stepLog.ts calls don't throw
  (window as Record<string, unknown>).__stepLog = (_msg: string) => {};

  // ── Error overlay (only shown on crash) ───────────────────────────────────
  const showErr = (label: string, msg: string) => {
    try {
      const existing = document.getElementById('__diag_err');
      if (existing) {
        existing.textContent += '\n\n── ' + label + ' ──\n' + msg;
        return;
      }
      const d = document.createElement('div');
      d.id = '__diag_err';
      d.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:2147483647',
        'background:#120000', 'color:#ff6b6b',
        'font-family:monospace', 'font-size:12px',
        'padding:20px', 'overflow:auto', 'white-space:pre-wrap',
      ].join(';');
      d.textContent = '══ ' + label + ' ══\n\n' + msg;
      document.body.appendChild(d);
    } catch (_) {}
  };

  // Classic JS error
  window.addEventListener('error', (e: ErrorEvent) => {
    const msg = `${e.message}\nFile: ${e.filename}\nLine: ${e.lineno}:${e.colno}\n\n${e.error?.stack ?? ''}`;
    showErr('window error', msg);
    _postErr('window.error', msg);
  });

  // Unhandled promise rejection
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const r = e.reason as Error | string | undefined;
    const msg = r == null
      ? 'Unknown rejection'
      : typeof r === 'string' ? r
      : `${r.message ?? String(r)}\n\n${r.stack ?? ''}`;
    showErr('unhandledrejection', msg);
    _postErr('unhandledrejection', msg);
  });

  // React 19 uses reportError() for errors that escape error boundaries —
  // it does NOT fire window.onerror, so we must override it separately.
  const origReportError = (window as Record<string, unknown>).reportError as ((e: unknown) => void) | undefined;
  (window as Record<string, unknown>).reportError = (err: unknown) => {
    const msg = err instanceof Error
      ? `${err.message}\n\n${err.stack ?? ''}`
      : String(err);
    showErr('React reportError (escaped error boundary)', msg);
    _postErr('reportError', msg);
    origReportError?.(err);
  };
}
