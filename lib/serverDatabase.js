// Server-only: never import this module from a React component.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
export function serverDatabase() {
  const name = 'apex-admin';
  let app = getApps().find(item => item.name === name);
  if (!app) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required');
    const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (account.project_id !== 'cars-d0f1d') throw new Error('Unexpected Firebase project');
    app = initializeApp({ credential: cert(account) }, name);
  }
  return getFirestore(app);
}
