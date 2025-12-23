
export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isAi?: boolean;
  distance: number; // Simulated distance in meters
}

export interface UserProfile {
  nickname: string;
  lastLoginDate: string; // ISO date YYYY-MM-DD
  color: string;
}

export interface ProximityZone {
  id: string;
  name: string;
  description: string;
  activeUsers: number;
}

export enum AppState {
  SETUP = 'SETUP',
  SCANNING = 'SCANNING',
  CHAT = 'CHAT'
}
