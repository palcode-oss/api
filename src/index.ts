import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import get from './routes/get';
import save from './routes/save';
import clone from './routes/clone';
import ensureUser from './routes/ensure-user';
import cloudSignup from './routes/cloud-signup';
import cloudBilling from './routes/cloud-billing';
import cloudWebhooks from './routes/cloud-webhooks';

const app = express();
app.set('trust proxy', true);

app.use(cors({
    origin: ['https://palcode.dev', 'https://app.palcode.dev', 'http://localhost:3000'],
    credentials: true,
}));

app.use(cloudWebhooks); // used without JSON parsing for compatibility with Stripe

const primaryRouter = express.Router();
primaryRouter.use(bodyParser.json());
primaryRouter.use(get);
primaryRouter.use(save);
primaryRouter.use(clone);
primaryRouter.use(ensureUser);
primaryRouter.use(cloudSignup);
primaryRouter.use(cloudBilling);
app.use(primaryRouter);

const server = require("http").createServer(app);

server.listen(process.env.PORT, () => {
    console.log("Ready on port " + process.env.PORT);
});
