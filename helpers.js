const admin = require("firebase-admin");
const {Storage} = require('@google-cloud/storage');

let serviceAccount;
if (process.env.NODE_ENV !== 'production') {
    serviceAccount = require("../serviceAccount.json");
}

admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
    databaseURL: serviceAccount ? `https://${serviceAccount['project_id']}.firebaseio.com` : 'https://palcode-ba70e.firebaseio.com',
});

const storage = new Storage();

module.exports = {
    getLanguageDefaultFile(language) {
        switch (language) {
            case 'python': return 'main.py';
            case 'nodejs': return 'index.js';
            case 'bash': return 'main.sh';
            case 'java': return 'Main.java';
            case 'prolog': return 'main.pl';
        }
    },
    isValidLanguage(language) {
        return ['python', 'nodejs', 'bash', 'java', 'prolog'].includes(language);
    },
    getStorageRoot() {
        return process.env.PAL_STORAGE_ROOT;
    },
    getFirebase() {
        return admin;
    },
    getBucket(schoolId) {
        if (!schoolId || typeof schoolId !== 'string') throw new Error("No School ID provided!");
        return storage.bucket('palcode-school-' + schoolId.toLowerCase());
    }
}
