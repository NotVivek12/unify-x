export type ShipmentStatus = 'GOOD' | 'ATTENTION' | 'BAD' | 'UNCERTAIN';
export type NodeStatus = 'online' | 'offline';

export interface Product {
  name: string;
  rfid: string;
}

export interface Transport {
  origin: string;
  destination: string;
  elapsed_seconds: number;
}

export interface StatusInfo {
  classification: ShipmentStatus;
  confidence: number;
  risk_score: number;
}

export interface SensorData {
  temperature: number;
  humidity: number;
  mq135: number;
  mq137: number;
  bme_gas: number;
  light: number;
}

export interface TransportEvents {
  temperature_excursions: number;
  excursion_duration_seconds: number;
  max_temperature: number;
}

export interface Nodes {
  spoilage_node: NodeStatus;
  precision_node: NodeStatus;
  [key: string]: NodeStatus;
}

export interface Shipment {
  shipment_id: string;
  product: Product;
  transport: Transport;
  status: StatusInfo;
  sensors: SensorData;
  transport_events: TransportEvents;
  nodes: Nodes;
  timestamp: string;
  is_active: boolean;
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'RESOLVED';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  shipment_id: string;
  message: string;
  timestamp: string;
}

export interface SystemStatus {
  raspberry_pi: NodeStatus;
  nodes: { id: string; name: string; status: NodeStatus; last_seen?: string }[];
  api: NodeStatus;
  ml_engine: NodeStatus;
  last_sync: string;
}

export interface HistoricalDataPoint {
  time: string;
  temperature: number;
  humidity: number;
  mq135: number;
  bme_gas: number;
}
