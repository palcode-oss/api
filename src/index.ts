import express from 'express';
import bodyParser from 'body-parser';
import get from './routes/get';
import save from './routes/save';

const app = express();
app.set('trust proxy', true);
app.use(bodyParser.json());

app.use(get);
app.use(save);

const server = require("http").createServer(app);

server.listen(process.env.PORT, () => {
    console.log("Ready on port " + process.env.PORT);
});
