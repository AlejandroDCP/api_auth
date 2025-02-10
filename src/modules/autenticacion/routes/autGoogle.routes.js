import Router from 'express';
const router = Router();

import { 
  generateAuthUrl,
  oauth2Handler
 } from "../controllers/googleAutenticacion.controller";

router
  .route("/google/auth-url")
  .get(generateAuthUrl);

router
  .route("/google/oauth2")
  .get(oauth2Handler);

module.exports = router;
