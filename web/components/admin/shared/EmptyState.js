import React from 'react';
import { tw } from '../../../lib/tw';

export function EmptyState({ children }) {
  return <div className={tw.emptyState}>{children}</div>;
}
