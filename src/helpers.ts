import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import { languageData, SupportedLanguage } from 'palcode-types';

let serviceAccount;
if (process.env.NODE_ENV !== 'production') {
    serviceAccount = require("../serviceAccount.json");
}

admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
    databaseURL: serviceAccount ? `https://${serviceAccount['project_id']}.firebaseio.com` : 'https://palcode-ba70e.firebaseio.com',
});

const storage = new Storage();

export const getLanguageDefaultFile = (languageName: SupportedLanguage): string => {
    const language = languageData.find(e => e.names.code === languageName);
    if (!language) {
        return 'main.txt';
    }

    return language.entrypoint;
}

export const getFirebaseSingleton = () => {
    return admin;
}

export const getBucket = (schoolId: any) => {
    if (!schoolId || typeof schoolId !== 'string') throw new Error("No School ID provided!");
    return storage.bucket('palcode-school-' + schoolId.toLowerCase());
}
