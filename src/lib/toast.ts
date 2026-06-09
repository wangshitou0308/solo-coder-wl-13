type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

const ICON_SVG: Record<ToastType, string> = {
  success: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  error: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  warning: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
};

const BORDER_COLOR: Record<ToastType, string> = {
  success: '#DCFCE7',
  error: '#FEE2E2',
  warning: '#FFEDD5',
  info: '#DBEAFE',
};

const ICON_BG: Record<ToastType, string> = {
  success: '#DCFCE7',
  error: '#FEE2E2',
  warning: '#FFEDD5',
  info: '#DBEAFE',
};

function ensureContainer(): HTMLDivElement {
  let container = document.getElementById('toast-container') as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(container);
  }
  return container;
}

export function toast(message: string, options: ToastOptions = {}) {
  const { type = 'info', duration = 2500 } = options;
  const container = ensureContainer();

  const toastEl = document.createElement('div');
  toastEl.style.cssText = `
    display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:12px;
    background:rgba(255,255,255,0.98);
    box-shadow:0 10px 30px rgba(0,0,0,0.12),0 2px 6px rgba(0,0,0,0.06);
    border:1px solid ${BORDER_COLOR[type]};
    color:#1F2937;font-size:14px;font-weight:500;
    opacity:0;transform:translateY(-10px);
    transition:opacity 0.25s ease,transform 0.25s ease;
    pointer-events:auto;white-space:nowrap;
  `;

  const iconWrapper = document.createElement('div');
  iconWrapper.style.cssText = `display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${ICON_BG[type]};`;
  iconWrapper.innerHTML = ICON_SVG[type];

  const messageEl = document.createElement('span');
  messageEl.textContent = message;

  toastEl.appendChild(iconWrapper);
  toastEl.appendChild(messageEl);
  container.appendChild(toastEl);

  requestAnimationFrame(() => {
    toastEl.style.opacity = '1';
    toastEl.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(-10px)';
    setTimeout(() => toastEl.remove(), 250);
  }, duration);
}

toast.success = (msg: string, opts?: ToastOptions) => toast(msg, { ...opts, type: 'success' });
toast.error = (msg: string, opts?: ToastOptions) => toast(msg, { ...opts, type: 'error' });
toast.warning = (msg: string, opts?: ToastOptions) => toast(msg, { ...opts, type: 'warning' });
toast.info = (msg: string, opts?: ToastOptions) => toast(msg, { ...opts, type: 'info' });
