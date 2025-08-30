
import { DailyData, WeeklyData, Treatment, Appointment } from "./types";
import { formatISO, addDays, subDays } from 'date-fns';

export const MOCK_CHART_DATA = {
  daily: [
    { name: "0h", diapers: 0, feeding: 0, sleep: 0 },
    { name: "3h", diapers: 0, feeding: 0, sleep: 0 },
    { name: "6h", diapers: 0, feeding: 0, sleep: 0 },
    { name: "9h", diapers: 0, feeding: 0, sleep: 0 },
    { name: "12h", diapers: 0, feeding: 0, sleep: 0 },
    { name: "15h", diapers: 0, feeding: 0, sleep: 0 },
    { name: "18h", diapers: 0, feeding: 0, sleep: 0 },
    { name: "21h", diapers: 0, feeding: 0, sleep: 0 },
  ],
  weekly: [
    { name: "Lun", diapers: 0, feeding: 0, sleep: 0 },
    { name: "Mar", diapers: 0, feeding: 0, sleep: 0 },
    { name: "Mer", diapers: 0, feeding: 0, sleep: 0 },
    { name: "Jeu", diapers: 0, feeding: 0, sleep: 0 },
    { name: "Ven", diapers: 0, feeding: 0, sleep: 0 },
    { name: "Sam", diapers: 0, feeding: 0, sleep: 0 },
    { name: "Dim", diapers: 0, feeding: 0, sleep: 0 },
  ]
};

// More detailed data for chart interactions
export const MOCK_CHART_DATA_V2: { daily: DailyData[], weekly: WeeklyData[] } = {
  daily: [],
  weekly: [],
};

export const initialTreatments: Treatment[] = [];

export const getInitialAppointments = (): Appointment[] => {
    return [];
};
