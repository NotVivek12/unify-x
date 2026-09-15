"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { Alert } from '../../types';
import { AlertTriangle, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDemoMode } from '../../context/DemoModeContext';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    const loadData = async () => {
      const data = await api.getAlerts(isDemoMode);
      setAlerts(data);
      setLoading(false);
    };
    loadData();
  }, [isDemoMode]);

  if (loading) {
    return <div className="animate-pulse space-y-6 flex-1 h-full flex items-center justify-center">Loading alerts...</div>;
  }

  const critical = alerts.filter(a => a.severity === 'CRITICAL');
  const warning = alerts.filter(a => a.severity === 'WARNING');
  const resolved = alerts.filter(a => a.severity === 'RESOLVED');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">Alerts</h1>
        <p className="text-[var(--color-muted)] mt-1">System notifications and critical transport events.</p>
      </div>

      <div className="space-y-6">
        <AlertSection title="Critical" alerts={critical} />
        <AlertSection title="Attention" alerts={warning} />
        <AlertSection title="Resolved" alerts={resolved} />
      </div>
    </div>
  );
}

function AlertSection({ title, alerts }: { title: string, alerts: Alert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">{title}</h2>
      <div className="space-y-3">
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </section>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const config = {
    CRITICAL: { icon: AlertTriangle, color: 'text-[var(--color-brand-bad)]', bg: 'bg-[var(--color-brand-bad)]/10', border: 'border-[var(--color-brand-bad)]/20' },
    WARNING: { icon: Info, color: 'text-[var(--color-brand-attention)]', bg: 'bg-[var(--color-brand-attention)]/10', border: 'border-[var(--color-brand-attention)]/20' },
    RESOLVED: { icon: CheckCircle2, color: 'text-[var(--color-brand-good)]', bg: 'bg-[var(--color-brand-good)]/10', border: 'border-[var(--color-brand-good)]/20' },
  };

  const currentConfig = config[alert.severity];

  return (
    <Link href={`/shipments/${alert.shipment_id}`}>
      <div className={cn("p-6 rounded-3xl border transition-all duration-300 flex items-start gap-5 group cursor-pointer glass-panel glass-panel-hover", currentConfig.border)}>
        <div className={cn("p-3 rounded-2xl shrink-0 mt-0.5 shadow-sm", currentConfig.bg, currentConfig.color)}>
          <currentConfig.icon size={24} strokeWidth={2} />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold tracking-tight text-[var(--color-foreground)] group-hover:text-[var(--color-brand-attention)] transition-colors">Shipment #{alert.shipment_id}</h3>
            <span className="text-xs font-semibold tracking-wide text-[var(--color-muted)] bg-[var(--color-surface)] px-2.5 py-1 rounded-md border border-[var(--color-border)]">
              {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-[15px] font-medium text-[var(--color-muted)] leading-relaxed">{alert.message}</p>
        </div>

        <div className="flex items-center self-center w-8 h-8 rounded-full bg-[var(--color-surface)] justify-center text-[var(--color-muted)] group-hover:bg-[var(--color-foreground)] group-hover:text-white transition-all duration-300 shadow-sm border border-[var(--color-border)]">
          <ChevronRight size={18} />
        </div>
      </div>
    </Link>
  );
}
