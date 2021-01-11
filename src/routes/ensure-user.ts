import express from 'express';
import { getUserData } from '../common/authentication';
import { getFirebaseSingleton } from '../helpers';

const router = express.Router();

interface MicrosoftProfile {
    givenName?: string;
    surname?: string;
}

router.post('/ensure-user', async (req, res) => {
    const admin = getFirebaseSingleton();

    const token = req.body.token;
    const setupToken = req.body.setupToken;
    if (!token) {
        res.status(400).send('No token provided.');
        return;
    }

    const [user, decodedToken] = await getUserData(token);
    if (!decodedToken) {
        res.sendStatus(401);
        return;
    }

    if (user) {
        res.status(200).send('User already exists.');
        return;
    }

    const email = decodedToken.email?.split('@');
    if (!email || email.length !== 2 || !decodedToken.email) {
        res.status(400).send('Token did not contain valid email.');
        return;
    }

    const [username, domain] = email;
    const schoolResponse = await admin.firestore()
        .collection('schools')
        .where('auth.domains', 'array-contains', domain)
        .get();

    if (schoolResponse.docs.length === 0) {
        res.status(404).send('School not found.');
        return;
    }

    const schoolId = schoolResponse.docs[0].id;

    let perms = 0;
    if (setupToken === schoolResponse.docs[0].data().auth?.setupToken) {
        perms = 2;

        await admin.firestore()
            .collection('schools')
            .doc(schoolId)
            .update({
                'auth.setupToken': admin.firestore.FieldValue.delete(),
            });
    }

    let displayName = decodedToken.displayName || '';
    if (decodedToken.additionalUserInfo?.profile) {
        const profile = decodedToken.additionalUserInfo.profile as MicrosoftProfile;
        if (profile.givenName && profile.surname) {
            displayName = profile.givenName + ' ' + profile.surname;
        }
    }

    await admin.firestore()
        .collection('users')
        .doc(decodedToken.uid)
        .set({
            email: decodedToken.email,
            displayName,
            username,
            perms,
            schoolId,
        });

    res.sendStatus(200);
});

export default router;
