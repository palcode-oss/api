import { getFirebaseSingleton } from '../helpers';
import type { firestore } from 'firebase-admin/lib/firestore';

export default async function safelyGetSchool(
    schoolId: string,
    setupToken: string,
): Promise<[number | undefined, firestore.DocumentSnapshot | undefined]> {
    const admin = getFirebaseSingleton();
    const schoolResponse = await admin.firestore()
        .collection('schools')
        .doc(schoolId)
        .get();

    if (!schoolResponse.exists) {
        return [404, undefined];
    }

    if (schoolResponse.data()?.auth.setupToken !== setupToken) {
        return [403, undefined];
    }

    return [undefined, schoolResponse];
}
