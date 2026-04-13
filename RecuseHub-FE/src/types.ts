export type View = 'home' | 'alerts' | 'track' | 'request' | 'confirmed';

export interface Alert {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'weather' | 'supply' | 'resolved' | 'maintenance' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  equipment: string[];
}

export interface RescueStatus {
  id: string;
  status: 'pending' | 'verified' | 'assigned' | 'on-the-way' | 'completed';
  eta: string;
  location: string;
}
