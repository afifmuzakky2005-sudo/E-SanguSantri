import { collection, doc, getDocs, setDoc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Santri, Transaction, InstitutionSettings, FinancialSettings, User, PendingRegistration } from '../types';
import { INITIAL_SANTRI, INITIAL_TRANSACTIONS, DEFAULT_INSTITUTION_SETTINGS, DEFAULT_FINANCIAL_SETTINGS, DEFAULT_USERS } from '../data/mockData';

export function getLocalStorageData() {
  try {
    const s = localStorage.getItem('esangu_santri');
    const t = localStorage.getItem('esangu_transactions');
    const i = localStorage.getItem('esangu_institution');
    const f = localStorage.getItem('esangu_financial');
    const u = localStorage.getItem('esangu_users');
    const r = localStorage.getItem('esangu_registrations');
    const l = localStorage.getItem('esangu_activityLogs');

    return {
      santri: s ? JSON.parse(s) : [],
      transactions: t ? JSON.parse(t) : [],
      institution: i ? JSON.parse(i) : DEFAULT_INSTITUTION_SETTINGS,
      financial: f ? JSON.parse(f) : DEFAULT_FINANCIAL_SETTINGS,
      users: u ? JSON.parse(u) : DEFAULT_USERS,
      registrations: r ? JSON.parse(r) : [],
      activityLogs: l ? JSON.parse(l) : [],
    };
  } catch {
    return {
      santri: [],
      transactions: [],
      institution: DEFAULT_INSTITUTION_SETTINGS,
      financial: DEFAULT_FINANCIAL_SETTINGS,
      users: DEFAULT_USERS,
      registrations: [],
      activityLogs: [],
    };
  }
}

export async function getFirebaseData() {
  try {
    const santriSnap = await getDocs(collection(db, 'santri'));
    let santri: Santri[] = [];
    if (!santriSnap.empty) {
      santriSnap.forEach(docSnap => {
        const data = docSnap.data() as Santri;
        santri.push({ id: data.id || docSnap.id, ...data });
      });
    }

    const txSnap = await getDocs(collection(db, 'transactions'));
    let transactions: Transaction[] = [];
    if (!txSnap.empty) {
      txSnap.forEach(docSnap => {
        const data = docSnap.data() as Transaction;
        transactions.push({ id: data.id || docSnap.id, ...data });
      });
    }

    const instDoc = await getDoc(doc(db, 'settings', 'institution'));
    let institution: InstitutionSettings;
    if (instDoc.exists()) {
      institution = instDoc.data() as InstitutionSettings;
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
      usersSnap.forEach(docSnap => {
        const data = docSnap.data() as User;
        users.push({ id: data.id || docSnap.id, ...data });
      });
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
      regSnap.forEach(docSnap => {
        const data = docSnap.data() as PendingRegistration;
        registrations.push({ id: data.id || docSnap.id, ...data });
      });
    }

    const logsSnap = await getDocs(collection(db, 'activityLogs'));
    let activityLogs: any[] = [];
    if (!logsSnap.empty) {
      logsSnap.forEach(docSnap => {
        const data = docSnap.data() as any;
        activityLogs.push({ id: data.id || docSnap.id, ...data });
      });
      activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    const result = {
      santri,
      transactions: transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      institution,
      financial,
      users,
      registrations,
      activityLogs
    };

    // Keep localStorage in sync as backup cache
    try {
      localStorage.setItem('esangu_santri', JSON.stringify(result.santri));
      localStorage.setItem('esangu_transactions', JSON.stringify(result.transactions));
      localStorage.setItem('esangu_institution', JSON.stringify(result.institution));
      localStorage.setItem('esangu_financial', JSON.stringify(result.financial));
      localStorage.setItem('esangu_users', JSON.stringify(result.users));
      localStorage.setItem('esangu_registrations', JSON.stringify(result.registrations));
      localStorage.setItem('esangu_activityLogs', JSON.stringify(result.activityLogs));
    } catch {}

    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'all');
    // Seamless fallback to local storage
    return getLocalStorageData();
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
  // Always update localStorage first for instantaneous zero-latency persistence & offline readiness
  try {
    if (data.santri) localStorage.setItem('esangu_santri', JSON.stringify(data.santri));
    if (data.transactions) localStorage.setItem('esangu_transactions', JSON.stringify(data.transactions));
    if (data.institution) localStorage.setItem('esangu_institution', JSON.stringify(data.institution));
    if (data.financial) localStorage.setItem('esangu_financial', JSON.stringify(data.financial));
    if (data.users) localStorage.setItem('esangu_users', JSON.stringify(data.users));
    if (data.registrations) localStorage.setItem('esangu_registrations', JSON.stringify(data.registrations));
    if (data.activityLogs) localStorage.setItem('esangu_activityLogs', JSON.stringify(data.activityLogs));
  } catch (err) {
    console.warn("Local cache save warning:", err);
  }

  // Then synchronize to Cloud Firestore
  try {
    const batch = writeBatch(db);

    if (data.santri) {
      data.santri.forEach(s => {
        batch.set(doc(collection(db, 'santri'), s.id), cleanUndefined(s));
      });
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
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, 'batch');
    // Note: Data is safely stored in local cache, so user work is preserved
  }
}

// Separate functions for singular updates to avoid writing whole collections if not needed
export async function deleteFirebaseDocument(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    const batch = writeBatch(db);
    batch.delete(docRef);
    await batch.commit();
  } catch (e: any) {
    handleFirestoreError(e, OperationType.DELETE, `${collectionName}/${id}`);
  }
}
