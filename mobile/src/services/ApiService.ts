import { Shipment, Alert, SystemStatus, HistoricalDataPoint, SensorData } from '../types';
import { mockShipments, mockAlerts, generateMockHistory } from '../data/mockData';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.58.83.63:5000';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`API Error: ${response.status} on ${endpoint}`);
      return null;
    }

    return await response.json();
  } catch (error: any) {
    const isAbort = error.name === 'AbortError';
    const isFetchFail = error instanceof TypeError && error.message.includes('Failed to fetch');
    
    if (!isAbort && !isFetchFail) {
      console.error(`Fetch failed for ${endpoint}:`, error);
    }
    return null;
  }
}

const mapBackendShipment = (backendData: any): Shipment => {
  return {
    shipment_id: backendData.id || `UX-${Math.floor(Math.random() * 10000)}`,
    product: {
      name: backendData.product_type ? backendData.product_type.charAt(0).toUpperCase() + backendData.product_type.slice(1) : "Unknown",
      rfid: `RFID-${backendData.id || '000'}`
    },
    transport: {
      origin: backendData.origin || "Unknown",
      destination: backendData.destination || "Unknown",
      elapsed_seconds: backendData.started_at ? Math.floor(Date.now() / 1000 - backendData.started_at) : 0
    },
    status: {
      classification: backendData.status === 'completed' ? 'UNCERTAIN' : 'GOOD',
      confidence: 0.90,
      risk_score: 0.10
    },
    is_active: backendData.status === 'active',
    // We mock the sensors and nodes since the backend doesn't provide them in this endpoint yet
    sensors: { temperature: 5.0, humidity: 70.0, mq135: 1200, mq137: 850, bme_gas: 18000, light: 60 },
    transport_events: { temperature_excursions: 0, excursion_duration_seconds: 0, max_temperature: 5.0 },
    nodes: { spoilage_node: "online", precision_node: "online" },
    timestamp: backendData.created_at ? new Date(backendData.created_at * 1000).toISOString() : new Date().toISOString()
  };
};

export const ApiService = {
  getSystemStatus: async (isDemoMode: boolean): Promise<SystemStatus | null> => {
    if (isDemoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            raspberry_pi: 'online',
            nodes: [
              { id: 'node_01', name: 'Precision Node 01', status: 'online', last_seen: new Date().toISOString() },
              { id: 'node_02', name: 'Spoilage Node 02', status: 'online', last_seen: new Date().toISOString() }
            ],
            api: 'online',
            ml_engine: 'online',
            last_sync: new Date().toISOString()
          });
        }, 500);
      });
    }
    const data = await fetchApi<any>('/api/system/status');
    if (!data) return null;
    
    const rawStatus = data.status || data;
    const rawNodes = rawStatus.nodes || [];
    let nodesArray: any[] = [];
    
    if (Array.isArray(rawNodes)) {
      nodesArray = rawNodes;
    } else if (typeof rawNodes === 'object') {
      nodesArray = Object.keys(rawNodes).map(key => ({
        id: key,
        name: rawNodes[key].name || key,
        status: rawNodes[key].status || (typeof rawNodes[key] === 'string' ? rawNodes[key] : 'offline'),
        last_seen: rawNodes[key].last_seen || new Date().toISOString()
      }));
    }
    
    return {
      raspberry_pi: rawStatus.raspberry_pi || 'online',
      nodes: nodesArray.length > 0 ? nodesArray : [
        { id: 'node_01', name: 'Precision Node 01', status: 'online', last_seen: new Date().toISOString() },
        { id: 'node_02', name: 'Spoilage Node 02', status: 'online', last_seen: new Date().toISOString() }
      ],
      api: rawStatus.api || 'online',
      ml_engine: rawStatus.ml_engine || 'online',
      last_sync: rawStatus.last_sync || new Date().toISOString()
    };
  },

  getShipments: async (isDemoMode: boolean): Promise<Shipment[]> => {
    if (isDemoMode) {
      return new Promise((resolve) => setTimeout(() => resolve(mockShipments), 500));
    }
    const data = await fetchApi<any>('/api/shipments');
    let rawShipments: any[] = [];
    if (Array.isArray(data)) rawShipments = data;
    else if (data && Array.isArray(data.shipments)) rawShipments = data.shipments;
    
    return rawShipments.map(mapBackendShipment);
  },

  getShipment: async (id: string, isDemoMode: boolean): Promise<Shipment | null> => {
    if (isDemoMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const shipment = mockShipments.find(s => s.shipment_id === id);
          resolve(shipment || null);
        }, 500);
      });
    }
    const data = await fetchApi<any>(`/api/shipments/${id}`);
    if (!data) return null;
    
    const rawShipment = data.shipment ? data.shipment : data;
    return mapBackendShipment(rawShipment);
  },

  getShipmentLive: async (id: string, isDemoMode: boolean): Promise<SensorData | null> => {
    if (isDemoMode) {
      const shipment = mockShipments.find(s => s.shipment_id === id);
      if (!shipment) return null;
      return {
        ...shipment.sensors,
        temperature: shipment.sensors.temperature + (Math.random() * 0.4 - 0.2),
        humidity: shipment.sensors.humidity + (Math.random() * 2 - 1),
      };
    }
    const data = await fetchApi<any>(`/api/shipments/${id}/live`);
    if (!data) return null;
    
    const rawSensors = data.sensors || data.live_data || data;
    
    return {
      temperature: typeof rawSensors.temperature === 'number' ? rawSensors.temperature : 5.0,
      humidity: typeof rawSensors.humidity === 'number' ? rawSensors.humidity : 70.0,
      mq135: typeof rawSensors.mq135 === 'number' ? rawSensors.mq135 : 1200,
      mq137: typeof rawSensors.mq137 === 'number' ? rawSensors.mq137 : 850,
      bme_gas: typeof rawSensors.bme_gas === 'number' ? rawSensors.bme_gas : 18000,
      light: typeof rawSensors.light === 'number' ? rawSensors.light : 60,
    };
  },

  getShipmentHistory: async (id: string, isDemoMode: boolean): Promise<HistoricalDataPoint[]> => {
    if (isDemoMode) {
      return new Promise((resolve) => {
        const shipment = mockShipments.find(s => s.shipment_id === id);
        setTimeout(() => resolve(generateMockHistory(shipment ? shipment.sensors.temperature : 5.0)), 500);
      });
    }
    const data = await fetchApi<any>(`/api/shipments/${id}/history`);
    if (!data) return [];
    
    let rawHistory: any[] = [];
    if (Array.isArray(data)) {
      rawHistory = data;
    } else if (data && Array.isArray((data as any).history)) {
      rawHistory = (data as any).history;
    } else {
      return [];
    }

    return rawHistory.map(item => {
      if (item.time) return item; // Already mapped
      const date = new Date((item.timestamp || item.created_at || Date.now() / 1000) * 1000);
      const sensors = item.features_json?.sensor_features || item.raw_json?.bme680 || {};
      return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temperature: sensors.bme_temp || sensors.temperature || 5.0,
        humidity: sensors.bme_humidity || sensors.humidity || 70.0,
        mq135: sensors.mics_co_rs_ohm || 1200,
        bme_gas: sensors.bme_gas_ohm || 18000
      };
    });
  },

  getShipmentAnalysis: async (id: string, isDemoMode: boolean): Promise<any> => {
    if (isDemoMode) {
      return new Promise((resolve) => setTimeout(() => resolve({ mock: true }), 500));
    }
    return await fetchApi<any>(`/api/shipments/${id}/analysis`);
  },

  getAlerts: async (isDemoMode: boolean): Promise<Alert[]> => {
    if (isDemoMode) {
      return new Promise((resolve) => setTimeout(() => resolve(mockAlerts), 500));
    }
    const data = await fetchApi<any>('/api/alerts');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.alerts)) return data.alerts;
    return [];
  },

  startShipment: async (id: string, isDemoMode: boolean): Promise<boolean> => {
    if (isDemoMode) {
      return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
    }
    const response = await fetchApi<any>(`/api/shipments/${id}/start`, { method: 'POST' });
    return response !== null;
  },

  stopShipment: async (id: string, isDemoMode: boolean): Promise<boolean> => {
    if (isDemoMode) {
      return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
    }
    const response = await fetchApi<any>(`/api/shipments/${id}/stop`, { method: 'POST' });
    return response !== null;
  }
};
