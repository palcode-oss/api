const express = require("express");
const router = express.Router();
const apiGet = require("./get");
const apiSave = require("./save");
//const apiClone = require("./clone");
const cors = require("cors");

router.use(cors({
    origin: ['https://palcode.dev', 'http://localhost:3000'],
}));

router.use(apiGet);
router.use(apiSave);
//router.use(apiClone);

module.exports = router;
