import React, { createContext, useContext, useMemo, useState } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: '', description: '', variant: 'danger', confirmLabel: undefined, onConfirm: null, errorText: '', loading: false });
  const [resolver, setResolver] = useState(null);

  const confirm = ({ title, description = '', variant = 'danger', confirmLabel, onConfirm, action, meta }) => {
    return new Promise((resolve) => {
      setResolver(() => resolve);
      setState({ open: true, title, description, variant, confirmLabel, onConfirm, errorText: '', loading: false, action, meta });
    });
  };

  const handleClose = (result = false) => {
    resolver?.(result);
    setResolver(null);
    setState((s) => ({ ...s, open: false, errorText: '', loading: false }));
  };

  const handleConfirm = async () => {
    if (typeof state.onConfirm !== 'function') {
      handleClose(true);
      return;
    }
    try {
      setState((s) => ({ ...s, loading: true, errorText: '' }));
      await state.onConfirm();
      if (state.action) {
        try { console.info('[confirm]', { action: state.action, ok: true, meta: state.meta }); } catch {}
      }
      handleClose(true);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Action failed';
      setState((s) => ({ ...s, errorText: msg, loading: false }));
      if (state.action) {
        try { console.error('[confirm]', { action: state.action, ok: false, error: msg, meta: state.meta }); } catch {}
      }
    }
  };

  const value = useMemo(() => ({ confirm }), []);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmModal
        open={state.open}
        title={state.title}
        description={state.description}
        confirmVariant={state.variant === 'danger' ? 'danger' : 'primary'}
        confirmLabel={state.confirmLabel || (state.variant === 'danger' ? 'Delete' : 'Confirm')}
        errorText={state.errorText}
        loading={state.loading}
        onConfirm={handleConfirm}
        onClose={() => handleClose(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirmModal() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirmModal must be used within ConfirmProvider');
  return ctx.confirm;
}
