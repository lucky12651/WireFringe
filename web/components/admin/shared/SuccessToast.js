import React, { useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { tw } from '../../../lib/tw';

export function SuccessToast({ message, onDismiss, onClose }) {
  const dismiss = onDismiss || onClose;

  useEffect(() => {
    if (!dismiss) return;
    const timer = setTimeout(dismiss, 3000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <div className={cn(tw.toast, tw.toastSuccess)}>
      <span className={tw.toastIcon}>✓</span>
      <span className={tw.toastMessage}>{message}</span>
    </div>
  );
}
