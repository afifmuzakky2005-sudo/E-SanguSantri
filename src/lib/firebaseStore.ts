import { collection, doc, getDocs, setDoc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, User, PendingRegistration } from '../types';
import { INITIAL_SANTRI, INITIAL_TRANSACTIONS, DEFAULT_INSTITUTION_SETTINGS, DEFAULT_FINANCIAL_SETTINGS, DEFAULT_USERS } from '../data/mockData';

export async function getFirebaseData() {
  try {
    const santriSnap = await getDocs(collection(db, 'santri'));
    let santri: Santri[] = [];
    if (!santriSnap.empty) {
      santriSnap.forEach(doc => santri.push(doc.data() as Santri));
    }

    const txSnap = await getDocs(collection(db, 'transactions'));
    let transactions: Transaction[] = [];
    if (!txSnap.empty) {
      txSnap.forEach(doc => transactions.push(doc.data() as Transaction));
    }

    const instDoc = await getDoc(doc(db, 'settings', 'institution'));
    let institution: InstitutionSettings;
    if (instDoc.exists()) {
      institution = instDoc.data() as InstitutionSettings;
      // Merge with defaults for new fields
      institution = { ...DEFAULT_INSTITUTION_SETTINGS, ...institution };
    } else {
      await setDoc(doc(db, 'settings', 'institution'), DEFAULT_INSTITUTION_SETTINGS);
      institution = DEFAULT_INSTITUTION_SETTINGS;
    }

    const finDoc = await getDoc(doc(db, 'settings', 'financial'));
    let financial: FinancialSettings;
    if (finDoc.exists()) {
      financial = finDoc.data() as FinancialSettings;
      financial = { ...DEFAULT_FINANCIAL_SETTINGS, ...financial };
    } else {
      await setDoc(doc(db, 'settings', 'financial'), DEFAULT_FINANCIAL_SETTINGS);
      financial = DEFAULT_FINANCIAL_SETTINGS;
    }

    const usersSnap = await getDocs(collection(db, 'users'));
    let users: User[] = [];
    if (!usersSnap.empty) {
      usersSnap.forEach(doc => users.push(doc.data() as User));
    } else {
      const batch = writeBatch(db);
      DEFAULT_USERS.forEach(u => {
        batch.set(doc(collection(db, 'users'), u.id), u);
      });
      await batch.commit();
      users = DEFAULT_USERS;
    }

    const regSnap = await getDocs(collection(db, 'registrations'));
    let registrations: PendingRegistration[] = [];
    if (!regSnap.empty) {
      regSnap.forEach(doc => registrations.push(doc.data() as PendingRegistration));
    }

    const logsSnap = await getDocs(collection(db, 'activityLogs'));
    let activityLogs: any[] = [];
    if (!logsSnap.empty) {
      logsSnap.forEach(doc => activityLogs.push(doc.data()));
      // Sort logs by timestamp descending
      activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return {
      santri,
      transactions: transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), // sort newest first
      institution,
      financial,
      users,
      registrations,
      activityLogs
    };
  } catch (error) {
    console.error("Error fetching data from Firebase:", error);
    // Fallback to empty/default if offline
    return {
      santri: [],
      transactions: [],
      institution: DEFAULT_INSTITUTION_SETTINGS,
      financial: DEFAULT_FINANCIAL_SETTINGS,
      users: DEFAULT_USERS,
      registrations: [],
      activityLogs: []
    };
  }
}

export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          res[key] = cleanUndefined(val);
        }
      }
    }
    return res;
  }
  return obj;
}

export async function saveFirebaseData(data: {
  santri?: Santri[];
  transactions?: Transaction[];
  institution?: InstitutionSettings;
  financial?: FinancialSettings;
  users?: User[];
  registrations?: PendingRegistration[];
  activityLogs?: any[];
}) {
  try {
    const batch = writeBatch(db);

    if (data.santri) {
      // In a real app we'd only update changed ones, but for this prototype we can just set them
      data.santri.forEach(s => {
        batch.set(doc(collection(db, 'santri'), s.id), cleanUndefined(s));
      });
      // We might need to handle deletions, but the app state handles full replacement.
      // A more robust way is to delete missing ones, but writing all is simpler for now.
    }

    if (data.transactions) {
      data.transactions.forEach(t => {
        batch.set(doc(collection(db, 'transactions'), t.id), cleanUndefined(t));
      });
    }

    if (data.institution) {
      batch.set(doc(db, 'settings', 'institution'), cleanUndefined(data.institution));
    }

    if (data.financial) {
      batch.set(doc(db, 'settings', 'financial'), cleanUndefined(data.financial));
    }

    if (data.users) {
      data.users.forEach(u => {
        batch.set(doc(collection(db, 'users'), u.id), cleanUndefined(u));
      });
    }

    if (data.registrations) {
      data.registrations.forEach(r => {
        batch.set(doc(collection(db, 'registrations'), r.id), cleanUndefined(r));
      });
    }

    if (data.activityLogs) {
      data.activityLogs.forEach(l => {
        batch.set(doc(collection(db, 'activityLogs'), l.id), cleanUndefined(l));
      });
    }

    await batch.commit();
  } catch (error) {
    console.error("Error saving data to Firebase:", error);
  }
}

// Separate functions for singular updates to avoid writing whole collections if not needed
export async function deleteFirebaseDocument(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    // Use dynamic import or writeBatch to delete
    const batch = writeBatch(db);
    batch.delete(docRef);
    await batch.commit();
  } catch (e) {
    console.error("Error deleting doc:", e);
  }
}
