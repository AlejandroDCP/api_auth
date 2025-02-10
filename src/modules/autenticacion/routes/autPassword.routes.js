import Router from 'express';
const router = Router();
import {
  autenticacionByPassword,
  changePasswordUsuarioExterno,
} from '../controllers/passwordAutenticacion.controller.js';
import {
  passwordAutenticacionSchema,
  schemaUpdatePassword,
} from '../rules/passwordAutenticacion.rules.js';
import { checkSchema } from 'express-validator';
import { validateResult } from '../../../core/validateHelper';
import { validateJsonHeader } from '../../../core/headersValidator.middleware';
import { tokenMiddleware } from '../../shared/middlewares/autenticacion.middleware.js'

const errorHanlders = [
  validateJsonHeader,
  validateResult,
];

router.route("/password")
  .post(checkSchema(passwordAutenticacionSchema), errorHanlders, autenticacionByPassword)
  .put(tokenMiddleware, checkSchema(schemaUpdatePassword), errorHanlders, changePasswordUsuarioExterno);

module.exports = router;
