import express from 'express';
import path from 'path';
import sanitize from 'sanitize-filename';
import { getBucket, parseJsonBody } from '../helpers';
import { cloneProject } from '../common/clone-project';
import { isRequestedAccessAllowed } from '../common/authentication';
import { ProjectAccessLevel } from '../types';

const router = express.Router();

const prohibitedFiles = [
    '.palcode.lock',
];

router.post('/save',  parseJsonBody, async (req, res) => {
    const projectId = sanitize(req.body.projectId || '');
    const files = req.body.files as {
        name: string;
        content: string;
    }[];
    const schoolId = req.body.schoolId as string;
    const token = req.body.token as string;
    if (!projectId || !files || !files.length || !schoolId || !token) {
        res.sendStatus(400);
        return;
    }

    if (!await isRequestedAccessAllowed(token, projectId, ProjectAccessLevel.Write)) {
        res.sendStatus(403);
        return;
    }

    for (const file of files) {
        const fileName = sanitize(file.name);
        const fileContent = file.content;

        if (!fileName || prohibitedFiles.includes(fileName)) {
            continue;
        }

        try {
            await getBucket(schoolId)
                .file(
                    path.join(projectId, fileName)
                )
                .save(fileContent);
        } catch (e) {
            console.log(e.code, Date.now());
            res.sendStatus(500);
            return;
        }
    }

    res.sendStatus(200);
});

router.post('/delete-file', parseJsonBody, async (req, res) => {
    const projectId = sanitize(req.body.projectId || '');
    const fileName = sanitize(req.body.fileName || '');
    const schoolId = req.body.schoolId as string;
    const token = req.body.token as string;

    if (!projectId || !fileName || !schoolId || !token) {
        res.sendStatus(400);
        return;
    }

    if (!await isRequestedAccessAllowed(token, projectId, ProjectAccessLevel.Write)) {
        res.sendStatus(403);
        return;
    }

    const filePath = path.join(projectId, fileName);

    try {
        await getBucket(schoolId)
            .file(filePath)
            .delete();
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(404);
    }
});

router.post('/clone', parseJsonBody, async (req, res) => {
    const projectId = sanitize(req.body.projectId || '');
    const sourceProjectId = sanitize(req.body.sourceProjectId || '');
    const schoolId = req.body.schoolId as string;
    const token = req.body.token as string;

    if (!projectId || !sourceProjectId || !token) {
        res.sendStatus(400);
        return;
    }

    if (!await isRequestedAccessAllowed(token, projectId, ProjectAccessLevel.Write)) {
        res.sendStatus(403);
        return;
    }

    await cloneProject(schoolId, sourceProjectId, projectId);
    res.sendStatus(200);
});

export default router;
