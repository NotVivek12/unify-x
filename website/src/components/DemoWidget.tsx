"use client";

import React, { useState } from 'react';
import { useDemoMode } from '../context/DemoModeContext';
import { Settings2, X } from 'lucide-react';
import { ShipmentStatus } from '../types';
import { cn } from '../utils/cn';

export default function DemoWidget() {
  const { scenario, setScenario, isDemoMode, toggleDemoMode } = useDemoMode();
  const [isOpen, setIsOpen] = useState(false);

  if (!isDemoMode && !isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-50 w-12 h-12 rounded-full glass-panel flex items-center justify-center shadow-lg hover:shadow-xl transition-all border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
      >
        <Settings2 size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 w-72 glass-panel rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <h3 className="font-semibold text-[var(--color-foreground)]">Demo Controls</h3>
        <button onClick={() => setIsOpen(false)} className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
          <X size={18} />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Enable Demo Mode</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={isDemoMode} onChange={toggleDemoMode} />
            <div className="w-11 h-6 bg-[var(--color-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-foreground)]"></div>
          </label>
        </div>

        {isDemoMode && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Scenario</label>
            <div className="grid grid-cols-2 gap-2">
              {(['GOOD', 'ATTENTION', 'BAD', 'UNCERTAIN', 'OFFLINE'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScenario(s)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    scenario === s 
                      ? 'bg-[var(--color-foreground)] text-white border-[var(--color-foreground)]' 
                      : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
