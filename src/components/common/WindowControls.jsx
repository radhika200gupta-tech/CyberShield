import React from 'react';

export default function WindowControls({ className = '' }) {
  return (
    <div className={`flex gap-1.5 ${className}`}>
      <div className="w-2.5 h-2.5 rounded-full bg-danger/80" />
      <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
      <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
    </div>
  );
}
