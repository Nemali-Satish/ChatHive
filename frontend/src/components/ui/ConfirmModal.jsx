import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  description = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger', // 'primary' | 'danger'
  errorText = '',
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  const confirmClasses = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700';
  const headerIcon = confirmVariant === 'danger' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Info className="w-4 h-4 text-blue-500" />;
  const headerAccent = confirmVariant === 'danger' ? 'text-red-500' : 'text-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose?.(false)} />
      <div className="relative z-10 w-full max-w-sm bg-panel border border-default rounded-2xl shadow-xl overflow-hidden" role="dialog" aria-modal="true" aria-describedby={description ? 'confirm-modal-desc' : undefined}>
        <div className="px-5 py-4 bg-header border-b border-default">
          <div className="flex items-center gap-2">
            <span aria-hidden className={headerAccent}>{headerIcon}</span>
            <h3 className="text-base font-semibold text-primary">{title}</h3>
          </div>
        </div>
        <div className="p-5">
          {description && (
            <p id="confirm-modal-desc" className="text-sm text-secondary">{description}</p>
          )}
          {errorText && (
            <div className="mt-3 text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
              {errorText}
            </div>
          )}
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-md hover-surface text-sm"
              onClick={() => onClose?.(false)}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-white text-sm ${confirmClasses} disabled:opacity-60`}
              onClick={() => onConfirm?.()}
              disabled={loading}
            >
              {loading ? 'Working...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
