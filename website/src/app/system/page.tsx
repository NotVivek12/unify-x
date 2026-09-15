"use client";

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { SystemStatus } from '../../types';
import { useDemoMode } from '../../context/DemoModeContext';
import { Server, Cpu, Database, Activity, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function SystemPage() {
  const { scenario, isDemoMode } = useDemoMode();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await api.getSystemStatus(isDemoMode);
      setStatus(data);
      setLoading(false);
    };
    loadData();
  }, [isDemoMode]);

  if (loading || !status) {
    return <div className="animate-pulse space-y-6 flex-1 h-full flex items-center justify-center">Loading system status...</div>;
  }

  const isOffline = scenario === 'OFFLINE' && isDemoMode;
  
  // Overwrite mock data if offline in demo mode
  const displayStatus = {
    ...status,
    raspberry_pi: isOffline ? 'offline' : status.raspberry_pi,
    nodes: status.nodes.map(n => ({ ...n, status: isOffline ? 'offline' : n.status }))
  } as SystemStatus;

  const StatusIndicator = ({ isOnline }: { isOnline: boolean }) => (
    <div className="flex items-center space-x-2">
      <div className={cn("w-2.5 h-2.5 rounded-full", isOnline ? "bg-[var(--color-brand-good)]" : "bg-[var(--color-brand-bad)]")} />
      <span className="text-sm font-medium text-[var(--color-foreground)]">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">System Status</h1>
          <p className="text-[var(--color-muted)] mt-1">Monitor connectivity and hardware nodes.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-[var(--color-muted)]">
          <RefreshCw size={14} className={cn(!isOffline && "animate-spin-slow")} />
          <span>Last sync: {new Date(displayStatus.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-foreground)]">
              <Server size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-foreground)] text-lg">Raspberry Pi Core</h3>
              <p className="text-sm text-[var(--color-muted)]">Central Edge-AI Unit</p>
            </div>
          </div>
          <StatusIndicator isOnline={displayStatus.raspberry_pi === 'online'} />
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-foreground)]">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-foreground)] text-lg">ML Engine</h3>
              <p className="text-sm text-[var(--color-muted)]">Inference Processor</p>
            </div>
          </div>
          <StatusIndicator isOnline={displayStatus.ml_engine === 'online'} />
        </div>
        
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-foreground)]">
              <Database size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-foreground)] text-lg">Backend API</h3>
              <p className="text-sm text-[var(--color-muted)]">Data Synchronization</p>
            </div>
          </div>
          <StatusIndicator isOnline={displayStatus.api === 'online'} />
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-6">Connected Nodes</h2>
        <div className="space-y-4">
          {displayStatus.nodes.map(node => (
            <div key={node.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center space-x-4">
                <div className="text-[var(--color-muted)]">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--color-foreground)]">{node.name}</h3>
                  <p className="text-xs text-[var(--color-muted)]">ID: {node.id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <StatusIndicator isOnline={node.status === 'online'} />
                {node.last_seen && node.status === 'offline' && (
                  <span className="text-xs text-[var(--color-muted)] mt-1">Last seen: {new Date(node.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
