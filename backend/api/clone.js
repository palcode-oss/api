const {getFirebase, getStorageRoot} = require("../helpers");
const express = require("express");
const router = express.Router();
const sanitize = require("sanitize-filename");
const fs = require("fs-extra");
const path = require("path");
const {defaults, defaultsDeep} = require("lodash");

const admin = getFirebase();
const storageRoot = getStorageRoot();

router.post('/clone-classroom', async (req, res) => {
    const classroomId = sanitize(req.body.classroomId);
    const newClassroomName = sanitize(req.body.classroomName);
    const token = req.body.token;

    if (!classroomId || !newClassroomName || !token) {
        res.sendStatus(400);
        return;
    }

    let uid;
    try {
        const decodedToken = await admin.auth().verifyIdToken(token, true);
        uid = decodedToken.uid;
    } catch (e) {
        res.sendStatus(403);
        return;
    }

    const userDataResponse = await admin.firestore()
        .collection('users')
        .doc(uid)
        .get();

    if (!userDataResponse.exists || userDataResponse.data().perms === 0) {
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

    templateTasksResponse.docs.forEach(doc => {
        const newTask = admin.firestore()
            .collection('tasks')
            .doc();

        try {
            const newProjectPath = path.resolve(storageRoot, newTask.id);
            const sourceProjectPath = path.resolve(storageRoot, doc.id);
            fs.mkdirSync(newProjectPath);
            fs.copySync(sourceProjectPath, newProjectPath);

            batch.set(newTask, defaultsDeep({
                classroomId: newClassroom.id,
                created: admin.firestore.Timestamp.now(),
            }, doc.data()));
        } catch (e) {}
    });

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

module.exports = router;
