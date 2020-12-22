const express = require("express");
const app = express();
const api = require("./api/index");
const bodyParser = require("body-parser");

app.set('trust proxy', true);
app.use(bodyParser.json());

app.use("/api", api);
app.get(['/', '/api/'], (req, res) => {
    res.send('');
});

const server = require("http").createServer(app);

server.listen(process.env.PORT, () => {
    console.log("Ready on port " + process.env.PAL_PORT);
});
