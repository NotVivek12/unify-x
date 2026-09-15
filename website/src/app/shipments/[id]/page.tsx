"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../services/api';
import { Shipment, HistoricalDataPoint } from '../../../types';
import { generateMockHistory, mockShipments } from '../../../data/mockData';
import { useDemoMode } from '../../../context/DemoModeContext';
import { ArrowLeft, Activity, Thermometer, MapPin, AlertTriangle, CheckCircle2, HelpCircle, ChevronDown, ChevronUp, Cpu, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from '../../../utils/cn';

export default function ShipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  
  const { scenario, isDemoMode } = useDemoMode();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [history, setHistory] = useState<HistoricalDataPoint[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showXAI, setShowXAI] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [apiOffline, setApiOffline] = useState(false);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [data, historyData, analysisData] = await Promise.all([
        api.getShipment(id, isDemoMode),
        api.getShipmentHistory(id, isDemoMode),
        api.getShipmentAnalysis(id, isDemoMode)
      ]);
      
      if (data) {
        setShipment(data);
        setHistory(historyData.length ? historyData : generateMockHistory(data.sensors.temperature));
        setAnalysis(analysisData);
        setApiOffline(false);
      } else {
        const mockShipment = mockShipments.find(s => s.shipment_id === id) || mockShipments[0];
        setShipment(mockShipment);
        setHistory(generateMockHistory(mockShipment.sensors.temperature));
        setApiOffline(true);
      }
      setLoading(false);
    };
    loadData();
  }, [id, isDemoMode]);

  // Live Polling
  useEffect(() => {
    if (loading || !shipment) return;
    
    // In demo mode, we still handle scenario changes via the next useEffect
    if (isDemoMode) return;

    const pollInterval = parseInt(process.env.NEXT_PUBLIC_LIVE_POLL_INTERVAL || '3000', 10);
    
    const pollId = setInterval(async () => {
      const liveData = await api.getShipmentLive(id, isDemoMode);
      if (liveData) {
        setShipment(prev => prev ? { ...prev, sensors: liveData } : prev);
        
        // Also update history graph with new point
        setHistory(prev => {
          const newHistory = [...prev.slice(1)];
          newHistory.push({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ...liveData
          });
          return newHistory;
        });
      }
    }, pollInterval);

    return () => clearInterval(pollId);
  }, [id, isDemoMode, loading, shipment?.shipment_id]);

  // Demo Mode overrides
  useEffect(() => {
    if (!isDemoMode || !shipment || (shipment.shipment_id !== 'TEST_LIVE_001' && shipment.shipment_id !== 'UX-1024')) return;
    
    setShipment(prev => {
      if (!prev) return prev;
      let newClassification = prev.status.classification;
      let newConfidence = prev.status.confidence;
      let newSensors = { ...prev.sensors };
      let newTemp = prev.sensors.temperature;
      
      if (scenario === 'GOOD') {
        newClassification = 'GOOD'; newConfidence = 0.92; newTemp = 4.8;
      } else if (scenario === 'ATTENTION') {
        newClassification = 'ATTENTION'; newConfidence = 0.76; newTemp = 8.5;
      } else if (scenario === 'BAD') {
        newClassification = 'BAD'; newConfidence = 0.94; newTemp = 12.0; newSensors.mq135 = 3500;
      } else if (scenario === 'UNCERTAIN') {
        newClassification = 'UNCERTAIN'; newConfidence = 0.56;
      }

      setHistory(prevHistory => {
        if (prevHistory.length === 0) return prevHistory;
        const newHistory = [...prevHistory.slice(1)];
        newHistory.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temperature: newTemp + (Math.random() * 0.5 - 0.25),
          humidity: 71 + (Math.random() * 2),
          mq135: newSensors.mq135 || 1200 + (Math.random() * 50),
          bme_gas: 18200 + (Math.random() * 100)
        });
        return newHistory;
      });

      return {
        ...prev,
        status: { ...prev.status, classification: newClassification as any, confidence: newConfidence },
        sensors: { ...newSensors, temperature: newTemp }
      };
    });
  }, [scenario, isDemoMode]);

  if (loading || !shipment) {
    return <div className="animate-pulse space-y-6 flex-1 h-full flex items-center justify-center">Loading shipment details...</div>;
  }

  const isOffline = (scenario === 'OFFLINE' && isDemoMode) || apiOffline;
  
  const statusConfig = {
    GOOD: { icon: CheckCircle2, color: 'text-[var(--color-brand-good)]' },
    ATTENTION: { icon: AlertTriangle, color: 'text-[var(--color-brand-attention)]' },
    BAD: { icon: AlertTriangle, color: 'text-[var(--color-brand-bad)]' },
    UNCERTAIN: { icon: HelpCircle, color: 'text-[var(--color-brand-neutral)]' },
  };

  const currentConfig = isOffline ? { icon: HelpCircle, color: 'text-[var(--color-muted)]' } : statusConfig[shipment.status.classification];

  const handleStartShipment = async () => {
    setIsActionLoading(true);
    const success = await api.startShipment(id, isDemoMode);
    if (success) {
      // refresh shipment
      const data = await api.getShipment(id, isDemoMode);
      if (data) setShipment(data);
    }
    setIsActionLoading(false);
  };

  const handleStopShipment = async () => {
    setIsActionLoading(true);
    const success = await api.stopShipment(id, isDemoMode);
    if (success) {
      const data = await api.getShipment(id, isDemoMode);
      if (data) setShipment(data);
    }
    setIsActionLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header Navigation */}
      <button 
        onClick={() => router.push('/shipments')}
        className="flex items-center space-x-2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} />
        <span>Back to Shipments</span>
      </button>

      {/* Shipment Header Card */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">{shipment.product.name}</h1>
            <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-foreground)]">
              #{shipment.shipment_id}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[var(--color-muted)] text-sm">
            <MapPin size={16} />
            <span className="font-medium text-[var(--color-foreground)]">{shipment.transport.origin}</span>
            <span>→</span>
            <span className="font-medium text-[var(--color-foreground)]">{shipment.transport.destination}</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 border-t md:border-t-0 md:border-l border-[var(--color-border)] pt-4 md:pt-0 md:pl-8">
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">Current Status</div>
            <div className={cn("flex items-center space-x-2 text-2xl font-bold", currentConfig.color)}>
              <currentConfig.icon size={24} />
              <span>{isOffline ? 'OFFLINE' : shipment.status.classification}</span>
            </div>
            {!isOffline && <div className="text-sm font-medium text-[var(--color-muted)] mt-1">{Math.round(shipment.status.confidence * 100)}% confidence</div>}
          </div>
          
          <div className="flex gap-3 mt-2 md:mt-0">
            {!shipment.is_active && (
              <button 
                onClick={handleStartShipment}
                disabled={isActionLoading || isOffline}
                className="px-4 py-2 bg-[var(--color-brand-good)] text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm shadow-[var(--color-brand-good)]/20"
              >
                Start
              </button>
            )}
            {shipment.is_active && (
              <button 
                onClick={handleStopShipment}
                disabled={isActionLoading || isOffline}
                className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-foreground)] rounded-lg text-sm font-semibold hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Monitoring */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts */}
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center space-x-2">
                <Activity size={20} className="text-[var(--color-brand-attention)]" />
                <span>Live Sensor Monitoring</span>
              </h2>
              <div className="flex items-center space-x-2 bg-[var(--color-surface)] px-3 py-1.5 rounded-full border border-[var(--color-border)] shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isOffline ? "hidden" : "animate-ping bg-[var(--color-brand-good)]")}></span>
                  <span className={cn("relative inline-flex rounded-full h-2 w-2", isOffline ? "bg-[var(--color-muted)]" : "bg-[var(--color-brand-good)]")}></span>
                </span>
                <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">{isOffline ? 'Offline' : 'Live Data'}</span>
              </div>
            </div>

            <div className="space-y-8">
              {/* Temperature Chart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[var(--color-muted)]">Temperature (°C)</h3>
                  <span className="text-lg font-bold text-[var(--color-foreground)]">{isOffline ? '--' : `${shipment.sensors.temperature.toFixed(1)}°C`}</span>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-brand-attention)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--color-brand-attention)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}
                        itemStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="temperature" stroke="var(--color-brand-attention)" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gas Trend Chart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[var(--color-muted)]">Gas Indicators (MQ135)</h3>
                  <span className="text-lg font-bold text-[var(--color-foreground)]">{isOffline ? '--' : shipment.sensors.mq135.toFixed(0)}</span>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} hide />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}
                      />
                      <Line type="monotone" dataKey="mq135" stroke="var(--color-brand-bad)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Explainable AI */}
          <div className="glass-panel p-6 rounded-3xl">
            <button 
              onClick={() => setShowXAI(!showXAI)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center space-x-2">
                <Cpu size={20} className="text-[var(--color-muted)]" />
                <span>Why did UNIFY-X make this decision?</span>
              </h2>
              <div className="bg-[var(--color-surface)] p-1.5 rounded-full border border-[var(--color-border)] shadow-sm">
                {showXAI ? <ChevronUp size={18} className="text-[var(--color-foreground)]" /> : <ChevronDown size={18} className="text-[var(--color-foreground)]" />}
              </div>
            </button>
            
            {showXAI && (
              <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                {analysis?.explanation ? (
                  <div className="text-sm text-[var(--color-muted)] leading-relaxed bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)]">
                    {analysis.explanation}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Factors</h3>
                    <ul className="space-y-2 text-sm text-[var(--color-foreground)]">
                      <li className="flex items-start space-x-2">
                        <CheckCircle2 size={16} className="text-[var(--color-brand-good)] mt-0.5 shrink-0" />
                        <span>Humidity remained stable throughout transit</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        {scenario === 'BAD' ? (
                          <AlertTriangle size={16} className="text-[var(--color-brand-bad)] mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 size={16} className="text-[var(--color-brand-good)] mt-0.5 shrink-0" />
                        )}
                        <span>{scenario === 'BAD' ? 'Gas indicators show abnormal increasing trend' : 'Gas indicators are normal'}</span>
                      </li>
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Model Consensus</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                      <span className="text-xs text-[var(--color-muted)] font-medium">Random Forest</span>
                      <span className="text-[15px] font-bold text-[var(--color-foreground)] mt-2 tracking-tight">{isOffline ? '--' : `${Math.round(shipment.status.confidence * 100)}% ${shipment.status.classification}`}</span>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                      <span className="text-xs text-[var(--color-muted)] font-medium">Extra Trees</span>
                      <span className="text-[15px] font-bold text-[var(--color-foreground)] mt-2 tracking-tight">{isOffline ? '--' : `${Math.max(0, Math.round((shipment.status.confidence - 0.03) * 100))}% ${shipment.status.classification}`}</span>
                    </div>
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                      <span className="text-xs text-[var(--color-muted)] font-medium">Gradient Boosting</span>
                      <span className="text-[15px] font-bold text-[var(--color-foreground)] mt-2 tracking-tight">{isOffline ? '--' : `${Math.max(0, Math.round((shipment.status.confidence - 0.05) * 100))}% ${shipment.status.classification}`}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Cold Chain */}
        <div className="space-y-6">
          {/* Cold Chain Status */}
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-5">Cold-Chain Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
                <span className="text-sm font-medium text-[var(--color-muted)]">Temperature excursions</span>
                <span className="font-semibold text-[var(--color-foreground)]">{shipment.transport_events.temperature_excursions}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
                <span className="text-sm font-medium text-[var(--color-muted)]">Total duration</span>
                <span className="font-semibold text-[var(--color-foreground)]">{Math.round(shipment.transport_events.excursion_duration_seconds / 60)} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[var(--color-muted)]">Max temperature</span>
                <span className="font-semibold text-[var(--color-foreground)]">{shipment.transport_events.max_temperature.toFixed(1)}°C</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-6">Transport Timeline</h2>
            
            <div className="relative border-l border-[var(--color-border-strong)] ml-3 space-y-8">
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-[var(--color-border)] rounded-full -left-[6.5px] top-1.5 ring-4 ring-[var(--color-surface)] shadow-sm" />
                <p className="text-xs text-[var(--color-muted)] mb-1 font-medium">06:20 AM</p>
                <p className="text-[15px] font-semibold tracking-tight text-[var(--color-foreground)]">Shipment Started</p>
              </div>
              
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-[var(--color-brand-good)] rounded-full -left-[6.5px] top-1.5 ring-4 ring-[var(--color-surface)] shadow-sm shadow-[var(--color-brand-good)]/20" />
                <p className="text-xs text-[var(--color-muted)] mb-1 font-medium">07:14 AM</p>
                <p className="text-[15px] font-semibold tracking-tight text-[var(--color-foreground)]">Conditions Normal</p>
              </div>

              {shipment.transport_events.temperature_excursions > 0 && (
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-[var(--color-brand-attention)] rounded-full -left-[6.5px] top-1.5 ring-4 ring-[var(--color-surface)] shadow-sm shadow-[var(--color-brand-attention)]/20" />
                  <p className="text-xs text-[var(--color-muted)] mb-1 font-medium">08:31 AM</p>
                  <p className="text-[15px] font-semibold tracking-tight text-[var(--color-brand-attention)]">Temperature Excursion</p>
                  <p className="text-xs font-medium text-[var(--color-muted)] mt-1">Temperature reached {shipment.transport_events.max_temperature}°C</p>
                </div>
              )}

              <div className="relative pl-6">
                <div className={cn("absolute w-3 h-3 rounded-full -left-[6.5px] top-1.5 ring-4 ring-[var(--color-surface)] shadow-sm", currentConfig.color.replace('text', 'bg'))} />
                <p className="text-xs text-[var(--color-muted)] mb-1 font-medium">Current</p>
                <p className={cn("text-[15px] font-bold tracking-tight", currentConfig.color)}>Status: {isOffline ? 'OFFLINE' : shipment.status.classification}</p>
              </div>
            </div>
          </div>

          {/* Node Status */}
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-5">Hardware Nodes</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-sm text-[var(--color-foreground)] font-medium">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] shadow-sm">
                    <Server size={14} />
                  </div>
                  <span>Raspberry Pi</span>
                </div>
                <div className="flex items-center space-x-2 bg-[var(--color-surface)] px-2.5 py-1 rounded-full border border-[var(--color-border)] shadow-sm">
                  <div className={cn("w-2 h-2 rounded-full", isOffline ? "bg-[var(--color-brand-bad)]" : "bg-[var(--color-brand-good)] shadow-[0_0_6px] shadow-[var(--color-brand-good)]/50")} />
                  <span className="text-[11px] font-bold tracking-wider text-[var(--color-muted)] uppercase">{isOffline ? 'Offline' : 'Online'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-sm text-[var(--color-foreground)] font-medium">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] shadow-sm">
                    <Cpu size={14} />
                  </div>
                  <span>Precision Node</span>
                </div>
                <div className="flex items-center space-x-2 bg-[var(--color-surface)] px-2.5 py-1 rounded-full border border-[var(--color-border)] shadow-sm">
                  <div className={cn("w-2 h-2 rounded-full", isOffline || shipment.nodes.precision_node === 'offline' ? "bg-[var(--color-brand-bad)]" : "bg-[var(--color-brand-good)] shadow-[0_0_6px] shadow-[var(--color-brand-good)]/50")} />
                  <span className="text-[11px] font-bold tracking-wider text-[var(--color-muted)] uppercase">{isOffline || shipment.nodes.precision_node === 'offline' ? 'Offline' : 'Online'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
