import { checkProjectAccess } from '../common/authentication';
import { ProjectAccessLevel } from '../types';
import { getFirebaseSingleton } from '../helpers';
import type { Request } from 'express';

export default async function logExamEvent(
    event: 'start' | 'breach',
    {
        req,
        metadata,
    }: {
        req: Request,
        metadata?: {
            [key: string]: string,
        }
    }
): Promise<number> {
    const token = req.body.token;
    const projectId = req.params.projectId;
    if (!token || !projectId) {
        return 400;
    }

    const accessLevel = await checkProjectAccess(token, projectId);
    if (accessLevel !== ProjectAccessLevel.Write) {
        return 403;
    }

    const admin = getFirebaseSingleton();
    await admin.firestore()
        .collection('tasks')
        .doc(projectId)
        .collection('exam-events')
        .add({
            event,
            createdAt: admin.firestore.Timestamp.now(),
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            ...metadata,
        });

    return 200;
}
