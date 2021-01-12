import express from 'express';
import { parseJsonBody } from '../helpers';
import logExamEvent from '../exam/log';

const router = express.Router();

router.post("/projects/:projectId/exam/start", parseJsonBody, async (req, res) => {
    const statusResponse = await logExamEvent('start', {
        req,
    });

    res.sendStatus(statusResponse);
})

router.post("/projects/:projectId/exam/breach", parseJsonBody, async (req, res) => {
    const statusResponse = await logExamEvent('breach', {
        req,
        metadata: {
            breachSource: req.body.breachSource,
        }
    });

    res.sendStatus(statusResponse);
});

export default router;
