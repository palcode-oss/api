const express = require("express");
const router = express.Router();
const path = require("path");
const sanitize = require("sanitize-filename");
const {getBucket} = require("../helpers");

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

    const sourceProjectPath = path.join(sourceProjectId);
    const bucket = getBucket(schoolId);
    const [files] = await bucket.getFiles({
        prefix: sourceProjectPath,
    });

    if (files.length === 0) {
        res.sendStatus(404);
        return;
    }

    for (const file of files) {
        const strippedFileName = file.name.substring(
            sourceProjectPath.length,
        );

        try {
            await file.copy(
                path.join(projectId, strippedFileName),
            );
        } catch (e) {}
    }

    res.sendStatus(200);
});

module.exports = router;
