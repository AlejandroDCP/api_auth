import Router from 'express';

const router = Router();

const { status } = require("../controllers/main.controller");

router
  .route("/status")
  .get(status);

module.exports = router;
