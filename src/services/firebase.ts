import { initializeApp } from 'firebase/app';
import {
  setLogLevel,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export { firebaseConfig };
export const app = initializeApp(firebaseConfig);

const customDatabaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    },
    customDatabaseId
  );
} catch {
  firestoreInstance = customDatabaseId ? getFirestore(app, customDatabaseId) : getFirestore(app);
}

export const db = firestoreInstance;

setLogLevel("silent");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    uid?: string;
    email?: string;
    role?: string;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null = null
): FirestoreErrorInfo {
  const errStr = String(error);
  return {
    error: errStr,
    operationType,
    path,
    authInfo: {}
  };
}

export async function testConnection(): Promise<boolean> {
  try {
    const testDocRef = doc(db, '_connection_test_', 'test');
    await getDocFromServer(testDocRef);
    return true;
  } catch {
    return true;
  }
}
