import Router from 'express'
const router = Router()

import {
  getAboutMe,
  getModulesIntranet,
  getEmpMenuIntranet,
  getMenusubIntranet,
  postAppAcces,
  getIsTokenValid,
} from '../controllers/information.controller.js'

import { getTree } from '../controllers/modules.controller.js'

import {
  informationSchema,
  schemaModulos,
  schemaMenus,
  schemaSubmenus,
} from '../rules/information.rules.js'

import { tokenMiddleware } from '../../shared/middlewares/autenticacion.middleware.js'
import { checkSchema } from 'express-validator'
import { validateResult } from '../../../core/validateHelper'

router.route('/sobre-mi')
  .get(tokenMiddleware, checkSchema(informationSchema), validateResult, getAboutMe)

router.route('/modulos')
  .get(tokenMiddleware, checkSchema(schemaModulos), validateResult, getModulesIntranet)

router.route('/menus')
  .get(tokenMiddleware, checkSchema(schemaMenus), validateResult, getEmpMenuIntranet)

router.route('/submenus')
  .get(tokenMiddleware, checkSchema(schemaSubmenus), validateResult, getMenusubIntranet)

router.route('/app-access')
  .post(tokenMiddleware, postAppAcces)

router.route('/token-valido')
  .get(getIsTokenValid)

router.route('/arbol')
  .get(tokenMiddleware, validateResult, getTree)

module.exports = router
