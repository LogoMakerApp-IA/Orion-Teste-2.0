export enum Sender {
  User = 'user',
  Orion = 'orion'
}

export enum OrionState {
  Idle = 'idle',
  Listening = 'listening',
  Thinking = 'thinking',
  Responding = 'responding',
  Error = 'error'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  attachments?: string[]; // Base64 strings for images
}

export interface DeviceContext {
  batteryLevel: number | null;
  isCharging: boolean;
  isOnline: boolean;
  platform: string;
  currentTime: string;
  geolocation?: {
    lat: number;
    lng: number;
  };
}

export interface OrionSettings {
  personality: 'professional' | 'friendly' | 'direct';
  visualIntensity: 'minimal' | 'balanced' | 'immersive';
  voiceEnabled: boolean;
}
