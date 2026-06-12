const express = require("express");
const sportController = require("./controller/sport.controller");

const router = express.Router();

router.get("/", sportController.getSports);
router.get("/:sportId", sportController.getSportById);

module.exports = router;
