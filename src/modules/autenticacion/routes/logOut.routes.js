import Router from 'express';
const router = Router();

import { postlogOut } from '../controllers/logOut.controller.js';

router
  .route("/logout")
  .post( postlogOut );

module.exports = router;
