import { checkProjectAccess } from '../common/authentication';
import { ProjectAccessLevel } from '../types';
import { getFirebaseSingleton } from '../helpers';
import type { Request } from 'express';
import { ExamEvent, ExamEventName } from 'palcode-types';

export default async function logExamEvent(
    event: ExamEventName,
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
    const eventObject = {
        event,
        createdAt: admin.firestore.Timestamp.now(),
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    } as ExamEvent;

    if (metadata) {
        eventObject.metadata = metadata;
    }

    await admin.firestore()
        .collection('tasks')
        .doc(projectId)
        .collection('examEvents')
        .add(eventObject);

    return 200;
}
