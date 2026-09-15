"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../services/api';
import { Shipment } from '../../types';
import { useDemoMode } from '../../context/DemoModeContext';
import { MapPin, CheckCircle2, AlertTriangle, HelpCircle, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { scenario, isDemoMode } = useDemoMode();

  useEffect(() => {
    const loadData = async () => {
      const data = await api.getShipments(isDemoMode);
      setShipments(data);
      setLoading(false);
    };
    loadData();
  }, [isDemoMode]);

  if (loading) {
    return <div className="animate-pulse space-y-6 flex-1 h-full flex items-center justify-center">Loading shipments...</div>;
  }

  // Active shipments are those that are not completed (which we mapped to 'UNCERTAIN')
  const activeShipments = shipments.filter(s => s.status.classification !== 'UNCERTAIN');
  const completedShipments = shipments.filter(s => s.status.classification === 'UNCERTAIN');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">Shipments</h1>
        <p className="text-[var(--color-muted)] mt-1">Manage and monitor all your transport operations.</p>
      </div>

      {activeShipments.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Active Shipments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeShipments.map(shipment => (
              <ShipmentCard key={shipment.shipment_id} shipment={shipment} />
            ))}
          </div>
        </section>
      )}

      {completedShipments.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">Completed Shipments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedShipments.map(shipment => (
              <ShipmentCard key={shipment.shipment_id} shipment={shipment} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const statusConfig = {
    GOOD: { icon: CheckCircle2, color: 'text-[var(--color-brand-good)]' },
    ATTENTION: { icon: AlertTriangle, color: 'text-[var(--color-brand-attention)]' },
    BAD: { icon: AlertTriangle, color: 'text-[var(--color-brand-bad)]' },
    UNCERTAIN: { icon: HelpCircle, color: 'text-[var(--color-brand-neutral)]' },
  };

  const currentConfig = statusConfig[shipment.status.classification];

  return (
    <Link href={`/shipments/${shipment.shipment_id}`}>
      <div className="glass-panel glass-panel-hover p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between h-full group cursor-pointer">
        <div>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[var(--color-foreground)] group-hover:text-[var(--color-brand-attention)] transition-colors">{shipment.product.name}</h3>
              <div className="font-mono text-sm text-[var(--color-muted)] tracking-wider mt-1">#{shipment.shipment_id}</div>
            </div>
            <div className="flex flex-col items-end">
              <div className={cn("flex items-center space-x-1.5 font-bold bg-[var(--color-surface)] px-3 py-1.5 rounded-full shadow-sm border border-[var(--color-border)]", currentConfig.color)}>
                <currentConfig.icon size={16} strokeWidth={2.5} />
                <span className="text-sm">{shipment.status.classification}</span>
              </div>
              <span className="text-xs font-semibold text-[var(--color-muted)] mt-2 tracking-wide">{Math.round(shipment.status.confidence * 100)}% Confidence</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-sm font-medium text-[var(--color-muted)] mb-4 bg-[var(--color-surface)] p-3 rounded-2xl border border-[var(--color-border)]">
            <MapPin size={16} className="text-[var(--color-foreground)] opacity-50" />
            <span className="text-[var(--color-foreground)]">{shipment.transport.origin}</span>
            <span className="text-[var(--color-border-strong)]">→</span>
            <span className="text-[var(--color-foreground)]">{shipment.transport.destination}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--color-border)]">
          <div className="text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">
            Started: {new Date(shipment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-muted)] group-hover:bg-[var(--color-foreground)] group-hover:text-white transition-all duration-300 shadow-sm border border-[var(--color-border)]">
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
}
