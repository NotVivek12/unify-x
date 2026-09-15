"use client";

import React, { useEffect, useState } from 'react';
import { useDemoMode } from '../context/DemoModeContext';
import { api } from '../services/api';
import { Shipment, SensorData } from '../types';
import { Activity, Thermometer, Droplets, Wind, Clock, MapPin, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { mockShipments } from '../data/mockData';

export default function DashboardPage() {
  const { scenario, isDemoMode } = useDemoMode();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiOffline, setApiOffline] = useState(false);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      // Fetch all shipments
      const shipments = await api.getShipments(isDemoMode);
      if (shipments && shipments.length > 0) {
        // Pick the first one. Prefer one that is not "UNCERTAIN" (completed)
        const activeOne = shipments.find(s => s.status.classification !== 'UNCERTAIN') || shipments[0];
        if (activeOne) {
          const liveData = await api.getShipmentLive(activeOne.shipment_id, isDemoMode);
          if (liveData) activeOne.sensors = liveData;
        }
        setShipment(activeOne);
        setApiOffline(false);
      } else {
        setShipment(mockShipments.find(s => s.shipment_id === 'TEST_LIVE_001') || mockShipments.find(s => s.shipment_id === 'UX-1024') || mockShipments[0]);
        setApiOffline(true);
      }
      setLoading(false);
    };
    loadData();
  }, [isDemoMode]);

  // Poll for live data
  useEffect(() => {
    if (!shipment || apiOffline) return;
    
    const interval = process.env.NEXT_PUBLIC_LIVE_POLL_INTERVAL ? parseInt(process.env.NEXT_PUBLIC_LIVE_POLL_INTERVAL) : 3000;
    
    const pollId = setInterval(async () => {
      const liveData = await api.getShipmentLive(shipment.shipment_id, isDemoMode);
      if (liveData) {
        setShipment(prev => prev ? { ...prev, sensors: liveData } : prev);
      }
    }, interval);
    
    return () => clearInterval(pollId);
  }, [shipment?.shipment_id, isDemoMode, apiOffline]);

  // Update shipment based on demo scenario
  useEffect(() => {
    if (!isDemoMode || !shipment) return;
    
    setShipment(prev => {
      if (!prev) return prev;
      
      let newClassification = prev.status.classification;
      let newConfidence = prev.status.confidence;
      let newSensors = { ...prev.sensors };
      
      if (scenario === 'GOOD') {
        newClassification = 'GOOD';
        newConfidence = 0.92;
        newSensors = { temperature: 4.8, humidity: 71.2, mq135: 1200, mq137: 830, bme_gas: 18200, light: 62 };
      } else if (scenario === 'ATTENTION') {
        newClassification = 'ATTENTION';
        newConfidence = 0.76;
        newSensors = { ...newSensors, temperature: 8.5 };
      } else if (scenario === 'BAD') {
        newClassification = 'BAD';
        newConfidence = 0.94;
        newSensors = { ...newSensors, temperature: 12.0, mq135: 3500 };
      } else if (scenario === 'UNCERTAIN') {
        newClassification = 'UNCERTAIN';
        newConfidence = 0.56;
      }

      return {
        ...prev,
        status: { ...prev.status, classification: newClassification as any, confidence: newConfidence },
        sensors: newSensors
      };
    });
  }, [scenario, isDemoMode]);

  if (loading || !shipment) {
    return <div className="animate-pulse space-y-6 flex-1 h-full flex items-center justify-center">Loading dashboard...</div>;
  }

  const isOffline = (scenario === 'OFFLINE' && isDemoMode) || apiOffline;
  
  const statusConfig = {
    GOOD: { icon: CheckCircle2, color: 'text-[var(--color-brand-good)]', glowClass: 'status-glow-good', label: 'Product condition normal' },
    ATTENTION: { icon: AlertTriangle, color: 'text-[var(--color-brand-attention)]', glowClass: 'status-glow-attention', label: 'Temperature excursion detected' },
    BAD: { icon: AlertTriangle, color: 'text-[var(--color-brand-bad)]', glowClass: 'status-glow-bad', label: 'Spoilage indicators detected' },
    UNCERTAIN: { icon: HelpCircle, color: 'text-[var(--color-brand-neutral)]', glowClass: 'glass-panel', label: 'Re-scan advised' },
  };

  const currentConfig = isOffline ? {
    icon: HelpCircle, color: 'text-[var(--color-muted)]', glowClass: 'glass-panel', label: 'System disconnected'
  } : statusConfig[shipment.status.classification];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-foreground)]">Good morning</h1>
          <p className="text-[var(--color-muted)] mt-1.5 text-lg">Here is the status of your active shipment.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm font-medium text-[var(--color-foreground)] glass-panel px-4 py-2 rounded-full shadow-sm">
          <div className={cn("w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]", isOffline ? "bg-[var(--color-muted)]" : "bg-[var(--color-brand-good)] shadow-[var(--color-brand-good)]")} />
          <span>{isOffline ? 'Raspberry Pi Offline' : 'System Online'}</span>
        </div>
      </div>

      {/* Active Shipment Header */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col md:flex-row justify-between md:items-center gap-4 border-[var(--color-border)]">
        <div>
          <div className="flex items-center space-x-3 text-sm font-semibold text-[var(--color-muted)] mb-2">
            <span className="uppercase tracking-widest text-xs">Active Shipment</span>
            <span className="w-1 h-1 rounded-full bg-[var(--color-border-strong)]"></span>
            <span className="font-mono tracking-wider">#{shipment.shipment_id}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-foreground)] tracking-tight">{shipment.product.name}</h2>
        </div>
        
        <div className="flex items-center space-x-4 text-[var(--color-muted)] glass-panel px-5 py-3 rounded-2xl">
          <MapPin size={20} className="text-[var(--color-foreground)] opacity-60" />
          <span className="font-medium text-[var(--color-foreground)]">{shipment.transport.origin}</span>
          <span className="text-[var(--color-border-strong)]">→</span>
          <span className="font-medium text-[var(--color-foreground)]">{shipment.transport.destination}</span>
        </div>
      </div>

      {/* Main Decision Card */}
      <div className={cn("rounded-3xl p-10 md:p-16 transition-all duration-700 relative overflow-hidden", currentConfig.glowClass)}>
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {React.createElement(currentConfig.icon, { 
            size: 72, 
            strokeWidth: 1.5,
            className: cn("mb-6 filter drop-shadow-lg transition-colors duration-500", currentConfig.color) 
          })}
          
          <h2 className={cn("text-6xl md:text-8xl font-extrabold tracking-tighter mb-4 transition-colors duration-500", currentConfig.color)}>
            {isOffline ? 'OFFLINE' : shipment.status.classification}
          </h2>
          
          {!isOffline && (
            <div className="text-xl md:text-3xl font-semibold text-[var(--color-foreground)]/90 mb-6 flex items-center space-x-2 tracking-tight">
              <span>{Math.round(shipment.status.confidence * 100)}% AI Confidence</span>
            </div>
          )}
          
          <p className="text-lg md:text-xl font-medium text-[var(--color-muted)] max-w-md">
            {currentConfig.label}
          </p>
        </div>
      </div>

      {/* Current Conditions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <ConditionCard 
          title="Temperature" 
          value={isOffline ? '--' : `${shipment.sensors.temperature.toFixed(1)}°C`}
          icon={Thermometer}
          status={isOffline ? 'neutral' : (shipment.sensors.temperature > 8 ? 'bad' : 'good')}
        />
        <ConditionCard 
          title="Humidity" 
          value={isOffline ? '--' : `${shipment.sensors.humidity.toFixed(0)}%`}
          icon={Droplets}
          status={isOffline ? 'neutral' : 'good'}
        />
        <ConditionCard 
          title="Transit" 
          value="03h 42m"
          icon={Clock}
          status="neutral"
        />
        <ConditionCard 
          title="Events" 
          value={isOffline ? '--' : shipment.transport_events.temperature_excursions.toString()}
          icon={Activity}
          status={isOffline ? 'neutral' : (shipment.transport_events.temperature_excursions > 0 ? 'attention' : 'good')}
        />
      </div>

    </div>
  );
}

function ConditionCard({ title, value, icon: Icon, status }: { title: string, value: string, icon: any, status: 'good'|'attention'|'bad'|'neutral' }) {
  const colors = {
    good: 'text-[var(--color-brand-good)]',
    attention: 'text-[var(--color-brand-attention)]',
    bad: 'text-[var(--color-brand-bad)]',
    neutral: 'text-[var(--color-muted)]',
  };

  return (
    <div className="glass-panel glass-panel-hover p-6 rounded-3xl flex flex-col justify-between min-h-[140px]">
      <div className="flex items-center space-x-2 text-[var(--color-muted)] mb-4">
        <Icon size={20} strokeWidth={1.5} />
        <span className="text-sm font-medium tracking-wide">{title}</span>
      </div>
      <div className={cn("text-3xl md:text-4xl font-bold tracking-tight", colors[status])}>
        {value}
      </div>
    </div>
  );
}
