import { getFirestore, type Firestore } from 'firebase/firestore';
import { app } from './firebase-app';

const db: Firestore = getFirestore(app);
export { db }; 