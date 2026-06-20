if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const showErr = (label: string, msg: string) => {
    try {
      const existing = document.getElementById('__diag_err');
      if (existing) {
        existing.textContent += '\n\n--- additional ---\n' + label + '\n' + msg;
        return;
      }
      const d = document.createElement('div');
      d.id = '__diag_err';
      d.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:2147483647',
        'background:#1a0000', 'color:#ff6b6b', 'font-family:monospace',
        'font-size:13px', 'padding:20px', 'overflow:auto', 'white-space:pre-wrap',
        'pointer-events:all',
      ].join(';');
      d.textContent = label + '\n\n' + msg;
      document.body.appendChild(d);
    } catch (_) {}
  };

  (window as Record<string, unknown>).onerror = (
    msg: string | Event,
    src?: string,
    line?: number,
    col?: number,
    err?: Error,
  ) => {
    showErr('[window.onerror]', `${msg}\nFile: ${src}\nLine: ${line}:${col}\n\n${err?.stack ?? ''}`);
    return false;
  };

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const r = e.reason as Error | string | undefined;
    const msg = r == null
      ? 'Unknown rejection'
      : typeof r === 'string'
      ? r
      : `${r.message ?? String(r)}\n\n${r.stack ?? ''}`;
    showErr('[unhandledrejection]', msg);
  });
}
