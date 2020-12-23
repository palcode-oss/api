import express from 'express';
import path from 'path';
import sanitize from 'sanitize-filename';
import { getBucket, getLanguageDefaultFile, isValidLanguage } from '../helpers';
import { isRequestedAccessAllowed } from '../common/authentication';
import { ProjectAccessLevel } from '../types';

const router = express.Router();

const ignoredPaths = [
    '__pycache__/',
    'README.md',
    'env/',
    'requirements.old.txt',
    'node_modules/',
    'yarn.lock',
    '.',
];

router.get('/get-file-list', async (req, res) => {
    const projectId = sanitize(req.query.projectId as string || '');
    const schoolId = req.query.schoolId as string;
    const language = req.query.language as string;
    const token = req.query.token as string;
    if (!projectId || !language || !isValidLanguage(language) || !schoolId || !token) {
        res.sendStatus(400);
        return;
    }

    if (!await isRequestedAccessAllowed(token, projectId, ProjectAccessLevel.Read)) {
        res.sendStatus(403);
        return;
    }

    const defaultFile = getLanguageDefaultFile(language);

    let fileList = [];
    try {
        const [rawFiles] = await getBucket(schoolId)
            .getFiles({
                prefix: projectId,
            });
        fileList = rawFiles.map(e => {
            return e.name.substring((projectId + '/').length);
        });
    } catch (e) {
        res.json([defaultFile]);
        return;
    }

    const filteredFiles = fileList.filter(file => {
        return !ignoredPaths.some(e => file.startsWith(e));
    });

    if (!filteredFiles.includes(defaultFile)) {
        filteredFiles.push(defaultFile);
    }

    filteredFiles.sort((a, b) => {
        if (a === defaultFile) {
            return -1;
        } else if (b === defaultFile) {
            return 1;
        }

        try {
            if (a.endsWith('.txt') || !a.includes('.')) {
                return 1;
            }
        } catch (e) {}

        return 0;
    });

    res.json(filteredFiles);
});

router.get('/get-file', async (req, res) => {
    const projectId = sanitize(req.query.projectId as string || '');
    const fileName = sanitize(req.query.fileName as string || '');
    const schoolId = req.query.schoolId as string;
    const token = req.query.token as string;

    if (!projectId || !fileName || !schoolId || !token) {
        res.sendStatus(400);
        return;
    }

    if (!await isRequestedAccessAllowed(token, projectId, ProjectAccessLevel.Read)) {
        res.sendStatus(403);
        return;
    }

    let fileContents = '';
    try {
        const [data] = await getBucket(schoolId)
            .file(
                path.join(projectId, fileName),
            )
            .download();

        fileContents = data.toString('utf8');
    } catch (e) {
        res.sendStatus(404);
        return;
    }

    res.set('Content-Type', 'text/plain');
    res.send(fileContents);
});

export default router;
