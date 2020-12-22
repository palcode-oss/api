const express = require("express");
const router = express.Router();
const path = require("path");
const sanitize = require("sanitize-filename");
const { getLanguageDefaultFile, isValidLanguage, getBucket } = require("../helpers");

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
    const projectId = sanitize(req.query.projectId || '');
    const schoolId = req.query.schoolId;
    const language = req.query.language;
    if (!projectId || !language || !isValidLanguage(language) || !schoolId) {
        res.sendStatus(400);
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
    const projectId = sanitize(req.query.projectId || '');
    const fileName = sanitize(req.query.fileName || '');
    const schoolId = req.query.schoolId;

    if (!projectId || !fileName || !schoolId) {
        res.sendStatus(400);
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

module.exports = router;
