import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';

let serviceAccount;
if (process.env.NODE_ENV !== 'production') {
    serviceAccount = require("../serviceAccount.json");
}

admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
    databaseURL: serviceAccount ? `https://${serviceAccount['project_id']}.firebaseio.com` : 'https://palcode-ba70e.firebaseio.com',
});

const storage = new Storage();

export const getLanguageDefaultFile = (language: string): string => {
    switch (language) {
        case 'python': return 'main.py';
        case 'nodejs': return 'index.js';
        case 'bash': return 'main.sh';
        case 'java': return 'Main.java';
        case 'prolog': return 'main.pl';
        case 'go': return 'main.go';
        case 'cpp': return 'main.cpp';
        default: return 'main.txt';
    }
}

export const isValidLanguage = (language: string) => {
    return ['python', 'nodejs', 'bash', 'java', 'prolog', 'go', 'cpp'].includes(language);
}

export const getFirebaseSingleton = () => {
    return admin;
}

export const getBucket = (schoolId: any) => {
    if (!schoolId || typeof schoolId !== 'string') throw new Error("No School ID provided!");
    return storage.bucket('palcode-school-' + schoolId.toLowerCase());
}
