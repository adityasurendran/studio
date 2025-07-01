import { getAuth, type Auth } from 'firebase/auth';
import { app } from './firebase-app';

const auth: Auth = getAuth(app);
export { auth }; 