

export interface ActivityLog {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  time: string;
}

export interface ActivityDetails {
    time: string;
    diaperType?: 'wet' | 'dirty' | 'both';
    amount?: number; // For bottle feeding (ml)
    duration?: number; // For sleep (hours) or breastfeeding (minutes)
    note?: string;
}

export interface ActivityEvent {
    id: string; // Firestore ID is a string
    type: 'diapers' | 'feeding' | 'sleep';
    date: string; // "YYYY-MM-DD"
    details: ActivityDetails;
}

export interface DailyData {
    name: string; // "0h", "3h", etc.
    activities: ActivityEvent[];
}

export interface WeeklyData {
    name: string; // "Lun", "Mar", etc.
    date: string; // "YYYY-MM-DD"
    activities: ActivityEvent[];
}

export interface Treatment {
  id: string; // Firestore ID is a string
  medication: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  active: boolean;
  notes?: string;
  history: { date: string; time: string }[];
}

export interface Child {
  id: string;
  name: string;
}

export interface Appointment {
  id:string; // Firestore ID is a string
  title: string;
  date: Date;
  time: string;
  completed: boolean;
  important: boolean;
  note?: string;
}

export type Period = 'daily' | 'weekly';


export interface UserSettings {
  id?: string;
  theme?: 'light' | 'dark' | 'system';
  charts?: {
    dailyDropThreshold?: number;
    weeklyDropThreshold?: number;
  };
  notifications?: {
    enabled?: boolean;
  };
}
