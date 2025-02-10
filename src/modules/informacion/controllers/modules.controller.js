import { createHmac, randomBytes } from 'crypto'
import {
  getPoolConnection,
  executeQuery,
  onSuccessAsObject,
  onSuccessAsArray,
} from '../../../core/dbConnection.service.js'
import { response500 } from '../../../core/responses.service.js'
import { getUsuario } from '../../shared/services/user.service.js'
import { secrets, apisUrls } from '../../../../env.js'
import { decodeToken } from '../../shared/services/decodeToken.service.js'

//DB's
const ADMON_DB = 'ADMONDB'
const USUARIOS_DB = 'USUARIOS'

const transformMenus = (rows) => {
  // const resultRows = rows.reduce((acc, row) => {

  //   const { id_modulo, modulo, path_modulo } = row;

  //   if (!acc.has(id_modulo)) {

  //     const item = {
  //       id_modulo,
  //       modulo,
  //       path_modulo,
  //       menus: new Array()
  //     };

  //     acc.set(id_modulo, item);
  //   };

  //   const { menus } = acc.get(id_modulo);
  //   menus.push(row);

  //   // const a = menus.reduce((acu, element) => {

  //   //   const { id_menu, menu, path_menu } = element;

  //   //   if (!acu.has(id_menu)) {
  //   //     const item = {
  //   //       id_menu,
  //   //       menu,
  //   //       path_menu,
  //   //       submenus: new Array()
  //   //     };

  //   //     acu.set(id_menu, item);
  //   //   };

  //   //   const { submenus } = acu.get(id_menu);
  //   //   submenus.push(element);

  //   //   const b = submenus.reduce((acum, elem) => {
  //   //     console.log("elem: ", elem);
  //   //     let { id_submenu, submenu, path_submenu } = elem;

  //   //     if (!acum.has(id_submenu)) {
  //   //       const item = {
  //   //         id_submenu,
  //   //         submenu,
  //   //         path_submenu
  //   //       };

  //   //       acum.set(id_submenu, item);
  //   //     };

  //   //     return acum;

  //   //   }, new Map());

  //   //   const nestedSubmenus = Array.from(b.values());

  //   //   acu.set(id_menu, { ...acu.get(id_menu), submenus: nestedSubmenus });

  //   //   return acu;

  //   // }, new Map());

  //   // const nestedMenus = Array.from(a.values());

  //   // acc.set(id_modulo, { ...acc.get(id_modulo), menus: nestedMenus });

  //   return acc;

  // }, new Map());

  const resultModules = rows.reduce((acc, row) => {
    const { id_modulo, modulo, path_modulo } = row

    if (!acc.has(id_modulo)) {
      const item = {
        id_modulo,
        modulo,
        path_modulo,
        menus: new Array(),
      }

      acc.set(id_modulo, item)
    }

    const { menus } = acc.get(id_modulo)
    menus.push(row)
    return acc
  }, new Map())

  const modules = Array.from(resultModules.values())

  for (let i = 0; i < modules.length; i++) {
    const currentModule = modules[i]

    const resultMenus = currentModule.menus.reduce((acu, row) => {
      const { id_menu, menu, path_menu } = row

      if (!acu.has(id_menu)) {
        const item = {
          id_menu,
          menu,
          path_menu,
          submenus: new Array(),
        }

        acu.set(id_menu, item)
      }

      const { submenus } = acu.get(id_menu)
      submenus.push(row)

      return acu
    }, new Map())

    const menus = Array.from(resultMenus.values())
    currentModule.menus = menus
  }

  for (let i = 0; i < modules.length; i++) {
    const currentModule = modules[i]

    for (let j = 0; j < currentModule.menus.length; j++) {
      const currentMenu = currentModule.menus[j]

      const resultSubmenus = currentMenu.submenus.reduce((acum, row) => {
        const { id_submenu, submenu, path_submenu } = row

        if (!acum.has(id_submenu)) {
          const item = {
            id_submenu,
            submenu,
            path_submenu,
          }

          acum.set(id_submenu, item)
        }

        return acum
      }, new Map())

      const submenus = Array.from(resultSubmenus.values())
      currentMenu.submenus = submenus
    }
  }

  return modules
}

const findNivelUser = async (connection, id_user) => {
  const sql = await connection.format(
    `SELECT nivel FROM usuarios.login WHERE id_user = ?`,
    [id_user]
  )

  const result = await executeQuery(connection, sql, {
    onSuccess: onSuccessAsObject(),
  })
  return result
}

//modules
const findModulesIds = async (connection, nivel) => {
  const sql = await connection.format(
    `
    select 
      modulos_acceso as id
    from nivel_menu
    where nivel = ?
    group by modulos_acceso`,
    [nivel]
  )

  const result = await executeQuery(connection, sql, {
    onSuccess: onSuccessAsArray(),
  })

  return result
}
const searchModulesById = async (connection, ids) => {
  const sql = await connection.format(
    `SELECT 
      id,
      nombre AS modulo
    FROM usuarios.modulo
    WHERE id IN(${ids})
    ORDER BY nombre ASC`
  )

  const result = await executeQuery(connection, sql, {
    onSuccess: onSuccessAsArray(),
  })
  return result
}

//empmenus
const findMenusById = async (connection, nivel, modulo) => {
  const sql = await connection.format(
    `
    select 
      menu AS id
    from nivel_menu
    where nivel = ?
      and modulos_acceso = ?
    group by menu
    `,
    [nivel, modulo]
  )

  const result = await executeQuery(connection, sql, {
    onSuccess: onSuccessAsArray(),
  })
  return result
}
const searchMenusById = async (connection, ids) => {
  const sql = await connection.format(
    `SELECT
      id,
      nombre AS empresaMenu
    FROM usuarios.menu
    WHERE id IN(${ids})
    ORDER BY nombre ASC`
  )
  const result = await executeQuery(connection, sql, {
    onSuccess: onSuccessAsArray(),
  })
  return result
}

//menusub
const findSubmenusById = async (connection, nivel, modulo, menu) => {
  const sql = await connection.format(
    `
    select 
      submenu as id
    from nivel_menu
    where nivel = ?
      and modulos_acceso = ?
      and menu = ?
    `,
    [nivel, modulo, menu]
  )

  const result = await executeQuery(connection, sql, {
    onSuccess: onSuccessAsArray(),
  })
  return result
}
const searchSubmenusById = async (connection, ids) => {
  const sql = await connection.format(
    `
    select
      id,
      nombre as menusub
    from submenu
    where id IN(${ids})
    `
  )

  const result = await executeQuery(connection, sql, {
    onSuccess: onSuccessAsArray(),
  })
  return result
}

const genRandomBase64UrlSafe = () => {
  const randomData = randomBytes(9)
  const randomDataBase64 = randomData.toString('base64')
  return randomDataBase64.replace(/\+/g, '-').replace(/\//g, '_')
}

const singHmac = ({ appId = '', pyload = '' }) => {
  const privateSecretApiKey = secrets[appId]
  if (!privateSecretApiKey) {
    return {
      error: true,
      message: `No se encontro el secret para la appId: ${appId}`,
      data: null,
    }
  }
  try {
    const nonce = genRandomBase64UrlSafe()
    const timestamp = Math.floor(new Date().getTime() / 1000)
    const secret = `${privateSecretApiKey}${appId}${nonce}${timestamp}`

    console.log({
      privateSecretApiKey,
      appId,
      nonce,
      timestamp,
      secret,
    })

    const pyloadStringify = JSON.stringify(pyload)
    const hmac = createHmac('sha256', secret)
    hmac.update(pyloadStringify)
    const signature = hmac.digest('hex')
    return {
      error: false,
      message: `Firma creada correctamente`,
      data: `${signature}:${appId}:${nonce}:${timestamp}`,
    }
  } catch (error) {
    return {
      error: true,
      message: `Error al crear la firma`,
      data: error.toString,
    }
  }
}

module.exports = {
  getIsTokenValid: async (req, res) => {
    const {
      headers: { authorization },
    } = req
    if (!authorization) {
      return res.status(200).json({
        error: false,
        message: 'El token no es valido, no se encontro el token',
        data: false,
      })
    }
    const token = authorization.substring(7)
    const decoded = decodeToken(token)
    if (decoded.error) {
      return res.status(200).json({
        error: false,
        message: 'El token no es valido, error al decodificar el token',
        data: false,
      })
    }
    if (!decoded.isValid) {
      return res.status(200).json({
        error: false,
        message: 'El token no es valido',
        data: false,
      })
    }
    return res.status(200).json({
      error: false,
      message: 'El token es valido',
      data: true,
    })
  },
  getTree: async (req, res) => {
    const {
      token: { user: _user },
      query: { idModulo },
    } = req

    const connection = await getPoolConnection(ADMON_DB)
    if (connection instanceof Error) {
      return response500(res, {
        error: true,
        message: 'Error al conectar con la base de datos, en getAbautMe',
        data: connection.toString(),
      })
    }

    const userFound = await getUsuario({
      connection,
      where: { 'u.id_usuario': _user.idUsuario },
      select: { correo: 'u.correo' },
    })

    if (userFound.error) return response500(res, userFound)
    if (!userFound.hasData) {
      await connection.destroy()
      return res.status(404).json(userFound)
    }

    const { data: user } = userFound

    // if (!idModulo) {
    //   await connection.destroy()
    //   return res.status(200).json({
    //     error: false,
    //     message: 'Información del usuario',
    //     data: {
    //       user,
    //     },
    //   })
    // }

    const params = [user.idUsuario]
    if (idModulo) {
      params.unshift(idModulo)
    }

    const sqlQuery = connection.format(
      `
SELECT 
  acmod.idadmon_cat_modulos id_modulo,
  acmod.modulo,
  acmod.path as path_modulo,
  acmod.carpeta,
  acmod.icono,
  acmnu.idadmon_cat_menus id_menu,
  acmnu.menu,
  acmnu.path as path_menu,
  acsmnu.idadmon_cat_submenus id_submenu,
  acsmnu.submenu,
  acsmnu.path as path_submenu,  
  acsmnu.icono submenu_icon,
  acsmnu.aria_label submenu_titulo,
  acsmnu.url,
  acsmnu.funcion_inicial submenu_funcion_inicial,
  arus.id_rol
FROM admon_cat_submenus acsmnu

INNER JOIN admon_cat_menus acmnu
    ON acsmnu.id_menu = acmnu.idadmon_cat_menus
        AND acmnu.eliminado = 0
        ${idModulo ? 'AND acmnu.id_modulo = ?' : ''}

INNER JOIN admon_cat_modulos acmod
    ON acmnu.id_modulo = acmod.idadmon_cat_modulos
        AND acmod.eliminado = 0

INNER JOIN admon_roles_entidades aren
    ON acsmnu.idadmon_cat_submenus = aren.id_entidad
        AND aren.eliminado = 0

INNER JOIN admon_roles_usuarios arus

    ON aren.id_rol = arus.id_rol
    AND arus.id_usuario = ?
WHERE 
  acsmnu.eliminado = 0
ORDER BY acmod.modulo, acmnu.menu, acsmnu.submenu
  `,
      params
    )

    const menus = await executeQuery(connection, sqlQuery, {
      onSuccessMessage: 'Menus del usuario obtenidos exitosamente',
      onFailmessage: 'Error en la consulta, en getAbautMe',
    })

    if (menus.error) {
      return response500(res, menus)
    }
    const { data: menusData } = menus

    await connection.destroy()
    return res.status(200).send({
      error: false,
      message: 'Información del usuario',
      data: {
        user,
        modulos: transformMenus(menusData),
      },
    })
  },
  //Intranet
  getModulesIntranet: async (req, res) => {
    const {
      query: { idIntranet },
    } = req

    const connection = await getPoolConnection(USUARIOS_DB)
    if (connection instanceof Error) {
      return response500(res, {
        error: true,
        message: `Error en la conexion a la base de datos: ${USUARIOS_DB}`,
        data: connection,
      })
    }

    const foundNivelUser = await findNivelUser(connection, idIntranet)
    if (foundNivelUser.error) return response500(res, foundNivelUser)

    const { nivel } = foundNivelUser.data

    const foundModules = await findModulesIds(connection, nivel)
    if (foundModules.error) return response500(res, foundModules)

    if (!foundModules.hasData) {
      await connection.destroy()
      return res.status(200).json({
        error: false,
        message: 'No se encontraron modulos',
        data: [],
        hasData: false,
      })
    }

    const ids = []
    for (let i = 0; i < foundModules.data.length; i++) {
      const current = foundModules.data[i]
      ids.push(current.id)
    }

    const modulos = await searchModulesById(connection, ids)
    if (modulos.error) return response500(res, modulos)

    await connection.destroy()

    return res.status(200).json(modulos)
  },
  getEmpMenuIntranet: async (req, res) => {
    const {
      query: { idIntranet, modulo },
    } = req

    const connection = await getPoolConnection(USUARIOS_DB)
    if (connection instanceof Error) {
      return response500(res, {
        error: true,
        message: `Error en la conexión a la base de datos: ${USUARIOS_DB}`,
        data: connection,
      })
    }

    const foundNivelUser = await findNivelUser(connection, idIntranet)
    if (foundNivelUser.error) response500(res, foundNivelUser)

    const { nivel } = foundNivelUser.data

    const foundMenus = await findMenusById(connection, nivel, modulo)
    if (foundMenus.error) response500(res, foundMenus)

    if (!foundMenus.hasData) {
      await connection.destroy()
      return res.status(200).json({
        error: false,
        message: 'No se encontro ningun menu',
        data: [],
        hasData: false,
      })
    }

    const ids = []
    for (let i = 0; i < foundMenus.data.length; i++) {
      const current = foundMenus.data[i]
      ids.push(current.id)
    }

    const menus = await searchMenusById(connection, ids)
    if (menus.error) response500(res, menus)

    await connection.destroy()

    return res.status(200).json(menus)
  },
  getMenusubIntranet: async (req, res) => {
    const {
      query: { idIntranet, modulo, menu },
    } = req

    const connection = await getPoolConnection(USUARIOS_DB)
    if (connection instanceof Error) {
      return response500(res, {
        error: true,
        message: `Error en la ocnexion a la base de datos: ${USUARIOS_DB}`,
        data: connection,
      })
    }

    const foundNivelUser = await findNivelUser(connection, idIntranet)
    if (foundNivelUser.error) return response500(res, foundNivelUser)

    const { nivel } = foundNivelUser.data

    const foundSubmenus = await findSubmenusById(
      connection,
      nivel,
      modulo,
      menu
    )
    if (foundSubmenus.error) return response500(res, foundSubmenus)

    if (!foundSubmenus.hasData) {
      await connection.destroy()
      return res.status(200).json({
        error: false,
        message: 'No se encontro ningun submenu',
        data: [],
        hasData: false,
      })
    }

    const ids = []
    for (let i = 0; i < foundSubmenus.data.length; i++) {
      const current = foundSubmenus.data[i]
      ids.push(current.id)
    }

    const submenus = await searchSubmenusById(connection, ids)
    if (submenus.error) return response500(res, submenus)

    await connection.destroy()

    return res.status(200).json(submenus)
  },
  //Cadusuite
  postAppAcces: async (req, res) => {
    const {
      token: {
        user: { token },
      },
      body: { appId },
    } = req
    // validar que el usuario tenga acceso a la aplicacion
    const signature = singHmac({
      appId,
      pyload: token,
    })
    if (signature.error) {
      return response500(res, signature)
    }

    return res.status(200).json({
      error: false,
      message: 'Acceso concedido',
      data: `${apisUrls[appId]}?token=${token}&signature=${signature.data}`,
    })
  },
}
