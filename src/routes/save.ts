import express from 'express';
import path from 'path';
import sanitize from 'sanitize-filename';
import { getBucket } from '../helpers';
import { cloneProject } from '../common/clone-project';

const router = express.Router();

const prohibitedFiles = [
    '.palcode.lock',
];

router.post('/save', async (req, res) => {
    const projectId = sanitize(req.body.projectId || '');
    const files = req.body.files;
    const schoolId = req.body.schoolId;
    if (!projectId || !files || !files.length || !schoolId) {
        res.sendStatus(400);
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

router.post('/delete-file', async (req, res) => {
    const projectId = sanitize(req.body.projectId || '');
    const fileName = sanitize(req.body.fileName || '');
    const schoolId = req.body.schoolId;

    if (!projectId || !fileName || !schoolId) {
        res.sendStatus(400);
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

router.post('/clone', async (req, res) => {
    const projectId = sanitize(req.body.projectId || '');
    const sourceProjectId = sanitize(req.body.sourceProjectId || '');
    const schoolId = req.body.schoolId;

    if (!projectId || !sourceProjectId) {
        res.sendStatus(400);
        return;
    }

    await cloneProject(schoolId, sourceProjectId, projectId);
    res.sendStatus(200);
});

export default router;
