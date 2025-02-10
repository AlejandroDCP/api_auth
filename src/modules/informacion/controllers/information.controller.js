import { createHmac, randomBytes } from 'crypto'
import { apisUrls, secrets } from '../../../../env.js'
import {
  executeQuery,
  getPoolConnection,
  onSuccessAsArray,
  onSuccessAsObject,
} from '../../../core/dbConnection.service.js'
import { response500 } from '../../../core/responses.service.js'
import { decodeToken } from '../../shared/services/decodeToken.service.js'

//DB's
const DB = {
  ADMON: 'ADMONDB',
  USUARIOS: 'USUARIOS',
}

const transformMenus = (rows) => {
  const menu2menusIndex = new Map() //mapeo menu_row a menusIndex
  const menus = [] // array de menus

  for (
    let rowsIndex = 0, menusIndex = 0;
    rowsIndex < rows.length;
    rowsIndex++
  ) {
    const {
      id_modulo,
      modulo,
      carpeta,
      icono,
      id_menu,
      menu: menu_row,
      id_submenu,
      submenu,
      submenu_icon,
      submenu_titulo,
      url,
      submenu_funcion_inicial,
      id_rol,
      submenu_url,
      submenu_path,
      menu_url,
      menu_path,
    } = rows[rowsIndex]

    // mapear el menu_row a menusInex, objeto menu
    if (!menu2menusIndex.has(menu_row)) {
      menu2menusIndex.set(menu_row, menusIndex)
      menus[menusIndex] = {
        menu: menu_row,
        icono: icono,
        id_menu,
        id_modulo,
        modulo,
        id_rol,
        submenus: [],
        menu_url,
        menu_path,
      }
      menusIndex++
    }

    // optenemos el array de los submenus
    const menuInex = menu2menusIndex.get(menu_row)
    const menu = menus[menuInex]
    const { submenus } = menu

    //agregamos el submenu
    submenus.push({
      menu: submenu,
      icono: submenu_icon,
      carpeta,
      id_submenu,
      submenu_titulo,
      url,
      submenu_funcion_inicial,
      submenu_url,
      submenu_path,
    })
  }
  return menus
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

const selectUsuariosRoles = async ({ connection, where }) => {
  const { idUsuario } = where

  const sql = await connection.format(
    `SELECT u.id_usuario idUsuario,
         u.nombre_usuario nombreUsuario,
         concat_ws(" ",
         ap.nombre,
         ap.apellido_paterno,
         ap.apellido_materno) nombreCompleto,
         u.id_intranet idIntranet,
         u.correo correo,
         aru.id_rol idRol,
         ar.id_perfil,
         apf.perfil descPerfil
FROM usuarios AS u
LEFT JOIN admon_personal ap
    ON u.idadmon_personal = ap.idadmon_personal
        AND ap.eliminado = 0
INNER JOIN admon_roles_usuarios aru
    ON u.id_usuario = aru.id_usuario
        AND aru.eliminado = 0
INNER JOIN admon_roles ar
    ON aru.id_rol = idadmon_roles
        AND ar.eliminado = 0
INNER JOIN admon_perfiles apf
    ON ar.id_perfil = apf.idadmon_perfiles
        AND apf.eliminado = 0
WHERE u.id_usuario = ? limit 1`,
    [idUsuario]
  )
  return await executeQuery(connection, sql, {
    onSuccess: onSuccessAsObject('Usuario no encontrado'),
    onSuccessMessage: 'Usuario encontrado',
    onFailmessage:
      'Ocurrio un error al buscar el usuario, en la Fn: selectUsuariosRoles',
  })
}

const selectUsuariosExternosByIdUsuariosExternos = async ({ connection, wheres }) => {
  const { idUsuariosExternos } = wheres;
  const sql = await connection.format(
    `SELECT
      *
    FROM
      admon_db.usuarios_externos
    WHERE
      id_usuarios_externos = ?
    and eliminado = 0
    LIMIT 1
;`,
    [idUsuariosExternos]
  )
  return await executeQuery(
    connection,
    sql,
    {
      onSuccess: onSuccessAsObject('No se encontro el usuario'),
      onSuccessMessage: 'Usuario encontrado',
      onFailmessage: 'Ocurrio un error en Fn: selectUsuariosExternosByNombreUsuario',
    }
  );

};


const getMenusExtranet = async (connection, idUsuarioExterno) => {

  const getRolesUsuarioExterno = async (connection, idUsuario) => {

    const sql = await connection.format(
      `
        SELECT
          aru.id_rol,
          aur.rol

        FROM admon_db.admon_usr_externos_roles_usuarios aru

        INNER JOIN admon_db.admon_usr_externos_roles aur
        ON aru.id_rol = aur.idadmon_roles
        AND aur.eliminado = 0

        WHERE aru.eliminado = 0
        AND aru.id_usuario = ?
      `, [idUsuario]
    );

    return await executeQuery(
      connection,
      sql,
      {
        onSuccess: onSuccessAsArray()
      }
    );

  };

  const getSubmenusUsuarioExterno = async (connection, roles) => {

    const sql = await connection.format(
      `
        SELECT
          auere.id_entidad id_submenu,
          acsmnu.submenu menu,
          acsmnu.id_menu,
          acsmnu.icono,
          acsmnu.url submenu_url,
          acsmnu.path submenu_path

        FROM admon_db.admon_usr_externos_roles_entidades auere

        INNER JOIN admon_db.admon_cat_submenus acsmnu
        ON auere.id_entidad = acsmnu.idadmon_cat_submenus
        AND acsmnu.eliminado = 0

        WHERE auere.eliminado = 0
        AND auere.id_rol in (?)
      `, [roles.map(({ id_rol }) => id_rol)]
    );

    return await executeQuery(
      connection,
      sql,
      {
        onSuccess: onSuccessAsArray()
      }
    );

  };

  const getMenusUsuarioExterno = async (connection, submenus) => {

    const sql = await connection.format(
      `
      SELECT 
      DISTINCT(acs.id_menu) id_menu,
      acm.menu,
      acmod.icono,
      acm.id_modulo,
      acmod.modulo,
      acm.path menu_path,
      acm.url menu_url

      FROM admon_db.admon_cat_submenus acs

      INNER JOIN admon_db.admon_cat_menus acm
      ON acs.id_menu = acm.idadmon_cat_menus
      AND acm.eliminado = 0

      INNER JOIN admon_db.admon_cat_modulos acmod
      ON acm.id_modulo = acmod.idadmon_cat_modulos
      AND acmod.eliminado = 0

      WHERE acs.eliminado = 0
      AND acs.idadmon_cat_submenus IN (?);
      `, [submenus.map(({ id_submenu }) => id_submenu)]
    );

    return await executeQuery(
      connection,
      sql,
      {
        onSuccess: onSuccessAsArray()
      }
    );

  };

  // obtener los roles del usuario
  const obtainedRolesUsuarioExterno = await getRolesUsuarioExterno(connection, idUsuarioExterno);
  if (obtainedRolesUsuarioExterno.error) { return obtainedRolesUsuarioExterno }
  if (!obtainedRolesUsuarioExterno.hasData) {
    return {
      error: false,
      message: 'El usuario no tiene roles asignados',
      data: []
    }
  };

  const roles = obtainedRolesUsuarioExterno.data;
  // console.log("roles: ", roles);

  // obtener lo submenus
  const obtainedSubmenusUsuarioExterno = await getSubmenusUsuarioExterno(connection, roles);
  if (obtainedSubmenusUsuarioExterno.error) { return obtainedSubmenusUsuarioExterno }
  if (!obtainedSubmenusUsuarioExterno.hasData) {
    return {
      error: false,
      message: 'El usuario no tiene submenus asignados',
      data: []
    }
  };

  const submenus = obtainedSubmenusUsuarioExterno.data;
  // console.log("submenus: ", submenus);

  // obtener los menus
  const obtainedMenusUsuarioExterno = await getMenusUsuarioExterno(connection, submenus);
  if (obtainedMenusUsuarioExterno.error) { return obtainedMenusUsuarioExterno }
  if (!obtainedMenusUsuarioExterno.hasData) {
    return {
      error: false,
      message: 'El usuario no tiene menus asignados',
      data: []
    }
  };

  const menus = obtainedMenusUsuarioExterno.data;
  // console.log("menus: ", menus);

  // Crear el arbol de menus
  menus.forEach(menu => {

    menu.submenus = submenus.filter(submenu => submenu.id_menu === menu.id_menu);

    menu.submenus.forEach(submenu => {
      submenu.submenu = submenu.submenu;
    });

  });
  // console.log("menus: ", menus);

  return { error: false, message: 'ok', data: menus };

};



const getAboutMeIntranet = async (req, res) => {
  const {
    token: {
      user: { idUsuario },
    },
    query: { idModulo },
  } = req

  const connection = await getPoolConnection(DB.ADMON)
  if (connection instanceof Error) {
    return response500(res, {
      error: true,
      message: 'Error al conectar con la base de datos, en getAboutMe',
      data: connection.toString(),
    })
  }

  const userFound = await selectUsuariosRoles({
    connection,
    where: { idUsuario },
  })

  if (userFound.error) return response500(res, userFound)
  if (!userFound.hasData) {
    await connection.release()
    await connection.destroy()
    return res.status(404).json(userFound)
  }

  const { data: user } = userFound

  const params = [idUsuario]
  if (idModulo) {
    params.unshift(idModulo)
  }
  // Menus
  const sqlQuery = connection.format(
    `
SELECT 
acmod.idadmon_cat_modulos id_modulo,
acmod.modulo,
acmod.carpeta,
acmod.icono,
acmnu.idadmon_cat_menus id_menu,
acmnu.menu,
acsmnu.idadmon_cat_submenus id_submenu,
acsmnu.submenu,
acsmnu.icono submenu_icon,
acsmnu.aria_label submenu_titulo,
acsmnu.url,
acsmnu.funcion_inicial submenu_funcion_inicial,
arus.id_rol,

acsmnu.url submenu_url, 
acsmnu.path submenu_path,

acmnu.url menu_url, 
acmnu.path menu_path

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
      user: { ...user, externo: false },
      menus: transformMenus(menusData),
    },
  })
};

const getAboutMeExtranet = async (req, res) => {
  const {
    token: {
      user: {
        idUsuario: idUsuariosExternos
      }
    }
  } = req;

  const connection = await getPoolConnection(DB.ADMON);
  if (connection instanceof Error) {
    return response500(res, {
      error: true,
      message: 'Error al conectar con la base de datos, en getAboutMe',
      data: connection.toString(),
    });
  }

  const userFound = await selectUsuariosExternosByIdUsuariosExternos({
    connection,
    wheres: { idUsuariosExternos },
  });
  const { data: user } = userFound;

  const sql = await connection.format(
    `
      SELECT
        idlog_cambio_password_usuario_externo,
        creado_en
      FROM admon_db.log_cambio_password_usuario_externo
      WHERE eliminado = 0
      AND fk_id_usuarios_externos = ?
    `, [idUsuariosExternos]
  );

  const result = await executeQuery(
    connection,
    sql,
    {
      onSuccess: onSuccessAsArray()
    }
  );
  if (result.error) { return response500(res, result) };

  // obtener los menus del usuario externo
  const obtainedMenusExtranet = await getMenusExtranet(connection, idUsuariosExternos);
  if (obtainedMenusExtranet.error) { return response500(res, obtainedMenusExtranet) };

  const data = {
    "user": {
      "idUsuario": user.id_usuarios_externos,
      "nombreUsuario": user.nombre_usuario,
      "nombreCompleto": `${user.nombre} ${user.apellido_paterno ?? ''} ${user.apellido_materno ?? ''}`,
      "idIntranet": null,
      "correo": user.correo,
      "idRol": null,
      "id_perfil": null,
      "descPerfil": null,
      "externo": true,
      "tipoUsuario": user.tipo_usuario,
      "forzarCambioPassword": result.hasData ? false : true,
    },
    "menus": obtainedMenusExtranet.data
  };

  await connection.destroy();

  return res.status(200).json({
    error: false,
    message: 'Información del usuario',
    data
  });

};


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
  getAboutMe: async (req, res) => {
    const {
      token: { user: { externo = false } },
    } = req
    if (externo) {
      return getAboutMeExtranet(req, res)
    }
    return getAboutMeIntranet(req, res)
  },
  //Intranet
  getModulesIntranet: async (req, res) => {
    const {
      query: { idIntranet },
    } = req

    const connection = await getPoolConnection(DB.USUARIOS)
    if (connection instanceof Error) {
      return response500(res, {
        error: true,
        message: `Error en la conexion a la base de datos: ${DB.USUARIOS}`,
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

    const connection = await getPoolConnection(DB.USUARIOS)
    if (connection instanceof Error) {
      return response500(res, {
        error: true,
        message: `Error en la conexión a la base de datos: ${DB.USUARIOS}`,
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

    const connection = await getPoolConnection(DB.USUARIOS)
    if (connection instanceof Error) {
      return response500(res, {
        error: true,
        message: `Error en la ocnexion a la base de datos: ${DB.USUARIOS}`,
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
