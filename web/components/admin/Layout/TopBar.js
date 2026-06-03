import React from 'react';

export function TopBar({ activeView }) {
  const title = activeView ? activeView.charAt(0).toUpperCase() + activeView.slice(1) : 'Dashboard';

  return (
    <></>
  );
}
