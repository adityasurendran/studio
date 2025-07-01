import { getFunctions, type Functions } from 'firebase/functions';
import { app } from './firebase-app';

const functions: Functions = getFunctions(app);
export { functions }; 