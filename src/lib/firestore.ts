

import { db } from './firebase';
import { collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch, Timestamp, setDoc } from 'firebase/firestore';
import { Child, ActivityEvent, Treatment, Appointment, UserSettings } from './types';

// Helper to convert Firestore Timestamps to Dates in nested objects
const convertTimestamps = (data: any): any => {
    if (data instanceof Timestamp) {
        return data.toDate();
    }
    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }
    if (data && typeof data === 'object') {
        const res: { [key: string]: any } = {};
        for (const key in data) {
            res[key] = convertTimestamps(data[key]);
        }
        return res;
    }
    return data;
};


// Child functions
export const getChildren = async (userId: string): Promise<Child[]> => {
    const childrenCol = collection(db, 'users', userId, 'children');
    const snapshot = await getDocs(childrenCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
};

export const addChild = async (userId: string, child: Omit<Child, 'id'>): Promise<Child> => {
    const childrenCol = collection(db, 'users', userId, 'children');
    const docRef = await addDoc(childrenCol, child);
    return { id: docRef.id, ...child };
};

export const updateChild = async (userId: string, childId: string, child: Partial<Child>) => {
    const childDoc = doc(db, 'users', userId, 'children', childId);
    await updateDoc(childDoc, child);
};

export const deleteChild = async (userId: string, childId: string) => {
    const batch = writeBatch(db);
    const childDocRef = doc(db, 'users', userId, 'children', childId);

    // Delete subcollections
    const activitiesRef = collection(childDocRef, 'activities');
    const treatmentsRef = collection(childDocRef, 'treatments');
    const appointmentsRef = collection(childDocRef, 'appointments');

    const [activitiesSnap, treatmentsSnap, appointmentsSnap] = await Promise.all([
        getDocs(activitiesRef),
        getDocs(treatmentsRef),
        getDocs(appointmentsSnap)
    ]);

    activitiesSnap.forEach(doc => batch.delete(doc.ref));
    treatmentsSnap.forEach(doc => batch.delete(doc.ref));
    appointmentsSnap.forEach(doc => batch.delete(doc.ref));

    // Delete the child document itself
    batch.delete(childDocRef);

    await batch.commit();
};

export const resetChildData = async (userId: string, childId: string): Promise<void> => {
    const batch = writeBatch(db);
    const childDocRef = doc(db, 'users', userId, 'children', childId);

    // Get references to subcollections
    const activitiesRef = collection(childDocRef, 'activities');
    const treatmentsRef = collection(childDocRef, 'treatments');
    const appointmentsRef = collection(childDocRef, 'appointments');

    const [activitiesSnap, treatmentsSnap, appointmentsSnap] = await Promise.all([
        getDocs(activitiesRef),
        getDocs(treatmentsRef),
        getDocs(appointmentsSnap)
    ]);

    activitiesSnap.forEach(doc => batch.delete(doc.ref));
    treatmentsSnap.forEach(doc => batch.delete(doc.ref));
    appointmentsSnap.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
};


// Activity functions
export const getActivities = async (userId: string, childId: string): Promise<ActivityEvent[]> => {
    const activitiesCol = collection(db, 'users', userId, 'children', childId, 'activities');
    const q = query(activitiesCol, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as unknown as ActivityEvent));
    
    // Manual sort by time since Firestore can't do two range filters on different fields without a composite index.
    return activities.sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      if (a.details.time > b.details.time) return -1;
      if (a.details.time < b.details.time) return 1;
      return 0;
    });
};

export const addActivityToDB = async (userId: string, childId: string, activity: Omit<ActivityEvent, 'id'>): Promise<ActivityEvent> => {
    const activitiesCol = collection(db, 'users', userId, 'children', childId, 'activities');
    const docRef = await addDoc(activitiesCol, activity);
    return { id: docRef.id, ...convertTimestamps(activity) } as unknown as ActivityEvent;
};

export const deleteActivityFromDB = async (userId: string, childId: string, activityId: string) => {
    const activityDoc = doc(db, 'users', userId, 'children', childId, 'activities', activityId);
    await deleteDoc(activityDoc);
};


// Treatment functions
export const getTreatments = async (userId: string, childId: string): Promise<Treatment[]> => {
    const treatmentsCol = collection(db, 'users', userId, 'children', childId, 'treatments');
    const snapshot = await getDocs(treatmentsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as unknown as Treatment));
};

export const addTreatmentToDB = async (userId: string, childId: string, treatment: Omit<Treatment, 'id'>): Promise<Treatment> => {
    const treatmentsCol = collection(db, 'users', userId, 'children', childId, 'treatments');
    // Remove undefined values before sending to Firestore
    const cleanedTreatment = Object.fromEntries(Object.entries(treatment).filter(([_, v]) => v !== undefined));
    const docRef = await addDoc(treatmentsCol, cleanedTreatment);
    return { id: docRef.id, ...convertTimestamps(treatment) as Omit<Treatment, 'id'>, history: treatment.history || [] };
};

export const updateTreatmentInDB = async (userId: string, childId: string, treatmentId: string, treatment: Partial<Treatment>) => {
    const treatmentDoc = doc(db, 'users', userId, 'children', childId, 'treatments', treatmentId);
    // Remove undefined values before updating
    const cleanedTreatment = Object.fromEntries(Object.entries(treatment).filter(([_, v]) => v !== undefined));
    await updateDoc(treatmentDoc, cleanedTreatment);
};

export const deleteTreatmentFromDB = async (userId: string, childId: string, treatmentId: string) => {
    const treatmentDoc = doc(db, 'users', userId, 'children', childId, 'treatments', treatmentId);
    await deleteDoc(treatmentDoc);
};

// Appointment functions
export const getAppointments = async (userId: string, childId: string): Promise<Appointment[]> => {
    const appointmentsCol = collection(db, 'users', userId, 'children', childId, 'appointments');
    const snapshot = await getDocs(appointmentsCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as unknown as Appointment));
};

export const addAppointmentToDB = async (userId: string, childId: string, appointment: Omit<Appointment, 'id'>): Promise<Appointment> => {
    const appointmentsCol = collection(db, 'users', userId, 'children', childId, 'appointments');
    const docRef = await addDoc(appointmentsCol, appointment);
    const newDocSnap = await getDoc(docRef);
    return { id: newDocSnap.id, ...convertTimestamps(newDocSnap.data()) } as Appointment;
};

export const updateAppointmentInDB = async (userId: string, childId: string, appointmentId: string, appointment: Partial<Appointment>) => {
    const appointmentDoc = doc(db, 'users', userId, 'children', childId, 'appointments', appointmentId);
    await updateDoc(appointmentDoc, appointment);
};

export const deleteAppointmentFromDB = async (userId: string, childId: string, appointmentId: string) => {
    const appointmentDoc = doc(db, 'users', userId, 'children', childId, 'appointments', appointmentId);
    await deleteDoc(appointmentDoc);
};


// User Settings functions
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'appSettings');
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserSettings;
    }
    return null;
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'appSettings');
    // Use set with merge: true to create the document if it doesn't exist, or update it if it does.
    await setDoc(settingsDocRef, settings, { merge: true });
};
