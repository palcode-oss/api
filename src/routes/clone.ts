import { getFirebaseSingleton } from '../helpers';
import express from 'express';
import sanitize from 'sanitize-filename';
import { defaults, defaultsDeep } from 'lodash';
import { cloneProject } from '../common/clone-project';
import { checkPerms } from '../common/authentication';

const router = express.Router();

const admin = getFirebaseSingleton();

router.post('/clone-classroom', async (req, res) => {
    const classroomId = sanitize(req.body.classroomId);
    const newClassroomName = sanitize(req.body.classroomName);
    const schoolId = req.body.schoolId as string;
    const token = req.body.token;

    if (!classroomId || !newClassroomName || !token) {
        res.sendStatus(400);
        return;
    }

    if (!(await checkPerms(token, 1))) {
        res.sendStatus(403);
        return;
    }

    const sourceClassroomResponse = await admin.firestore()
        .collection('classrooms')
        .doc(classroomId)
        .get();

    if (!sourceClassroomResponse.exists) {
        res.sendStatus(404);
        return;
    }

    const templateTasksResponse = await admin.firestore()
        .collection('tasks')
        .where('classroomId', '==', classroomId)
        .where('type', '==', 0)
        .get();

    const batch = admin.firestore().batch();
    const newClassroom = admin.firestore()
        .collection('classrooms')
        .doc();

    for (const doc of templateTasksResponse.docs) {
        const newTask = admin.firestore()
            .collection('tasks')
            .doc();

        try {
            await cloneProject(schoolId, doc.id, newTask.id);

            batch.set(newTask, defaultsDeep({
                classroomId: newClassroom.id,
                created: admin.firestore.Timestamp.now(),
            }, doc.data()));
        } catch (e) {}
    }

    // using non-deep defaults for classroom cloning, as members array needs to be cleared
    batch.set(newClassroom, defaults({
        created: admin.firestore.Timestamp.now(),
        members: [],
        name: newClassroomName,
    }, sourceClassroomResponse.data()));

    try {
        await batch.commit();
        res.send(newClassroom.id);
    } catch (e) {
        res.sendStatus(500);
    }
});

export default router;
