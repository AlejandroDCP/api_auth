import Router from 'express';
const router = Router();

import { checkHmacAuth } from '../../shared/middlewares/autenticacion.middleware';
import { posExchange } from '../controllers/validation.controller';

router
  .post('/exchange', checkHmacAuth, posExchange);

module.exports = router;
