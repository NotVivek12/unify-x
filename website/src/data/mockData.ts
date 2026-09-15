import { Shipment, Alert, HistoricalDataPoint } from '../types';

export const mockShipments: Shipment[] = [
  {
    shipment_id: "UX-1024",
    product: { name: "Fresh Fish", rfid: "FISH001" },
    transport: { origin: "Mangalore", destination: "Bengaluru", elapsed_seconds: 15720 },
    status: { classification: "GOOD", confidence: 0.92, risk_score: 0.08 },
    sensors: { temperature: 4.8, humidity: 71.2, mq135: 1200, mq137: 830, bme_gas: 18200, light: 62 },
    transport_events: { temperature_excursions: 1, excursion_duration_seconds: 1020, max_temperature: 8.2 },
    nodes: { spoilage_node: "online", precision_node: "online" },
    timestamp: "2026-09-10T10:42:31",
    is_active: true
  },
  {
    shipment_id: "UX-1025",
    product: { name: "Apples", rfid: "APP002" },
    transport: { origin: "Mysuru", destination: "Bengaluru", elapsed_seconds: 7200 },
    status: { classification: "ATTENTION", confidence: 0.76, risk_score: 0.24 },
    sensors: { temperature: 6.5, humidity: 80.1, mq135: 1500, mq137: 900, bme_gas: 19500, light: 50 },
    transport_events: { temperature_excursions: 2, excursion_duration_seconds: 1800, max_temperature: 9.1 },
    nodes: { spoilage_node: "online", precision_node: "offline" },
    timestamp: "2026-09-10T09:15:00",
    is_active: true
  },
  {
    shipment_id: "UX-1026",
    product: { name: "Vegetables", rfid: "VEG003" },
    transport: { origin: "Hassan", destination: "Bengaluru", elapsed_seconds: 20000 },
    status: { classification: "BAD", confidence: 0.94, risk_score: 0.89 },
    sensors: { temperature: 12.0, humidity: 88.0, mq135: 3500, mq137: 1800, bme_gas: 25000, light: 80 },
    transport_events: { temperature_excursions: 3, excursion_duration_seconds: 5400, max_temperature: 15.2 },
    nodes: { spoilage_node: "online", precision_node: "online" },
    timestamp: "2026-09-10T11:00:00",
    is_active: true
  },
  {
    shipment_id: "UX-1027",
    product: { name: "Berries", rfid: "BER004" },
    transport: { origin: "Ooty", destination: "Bengaluru", elapsed_seconds: 12000 },
    status: { classification: "UNCERTAIN", confidence: 0.56, risk_score: 0.50 },
    sensors: { temperature: 5.5, humidity: 75.0, mq135: 1400, mq137: 850, bme_gas: 18500, light: 55 },
    transport_events: { temperature_excursions: 0, excursion_duration_seconds: 0, max_temperature: 5.5 },
    nodes: { spoilage_node: "offline", precision_node: "online" },
    timestamp: "2026-09-10T10:30:00",
    is_active: false
  }
];

export const mockAlerts: Alert[] = [
  {
    id: "ALT-001",
    severity: "CRITICAL",
    shipment_id: "UX-1026",
    message: "Product condition classified as BAD. Spoilage indicators detected.",
    timestamp: "2026-09-10T11:00:00"
  },
  {
    id: "ALT-002",
    severity: "WARNING",
    shipment_id: "UX-1025",
    message: "Temperature exceeded configured range (9.1°C)",
    timestamp: "2026-09-10T08:45:00"
  },
  {
    id: "ALT-003",
    severity: "RESOLVED",
    shipment_id: "UX-1024",
    message: "Temperature returned to normal",
    timestamp: "2026-09-10T08:48:00"
  }
];

export const generateMockHistory = (baseTemp: number, length: number = 30): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const now = new Date();
  
  for (let i = length; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000); // 1 minute intervals
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: baseTemp + (Math.random() * 1.5 - 0.5),
      humidity: 70 + (Math.random() * 5),
      mq135: 1200 + (Math.random() * 100),
      bme_gas: 18000 + (Math.random() * 500)
    });
  }
  
  return data;
};
