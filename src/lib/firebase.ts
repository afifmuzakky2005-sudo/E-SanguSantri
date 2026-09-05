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
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Gentle connection probe
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Client is offline or caching locally, which is completely fine in PWA mode
  }
}
testConnection();

