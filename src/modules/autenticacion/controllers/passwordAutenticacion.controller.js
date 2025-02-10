import {
  getPoolConnection,
  executeQuery,
  onSuccessAsObject,
  onFailedTransaction,
  onSuccessUpdate,
} from '../../../core/dbConnection.service'
import { generateSesionToken, saveTokenQr } from '../services/token.service.js'
import {
  getUsuario,
  insertUsuario,
} from '../../shared/services/user.service.js'
import { response500 } from '../../../core/responses.service.js'
import bcrypt from 'bcryptjs'
import { sqlGenerator } from '../../../core/sqlGenerator.util'

// const getUsuarioLegacy = async ({ connection, where }) => {
//   const loginWhere = {
//     usuario: null,
//     estatus_user: null,
//   }

//   const loginWhereSql = new sqlGenerator(loginWhere)
//   loginWhereSql.filter(where)

//   const sql = await connection.format(
//     `SELECT
//       *
//     FROM
//       login
//     WHERE
//       ${loginWhereSql.genWhere()}
//     LIMIT 1`,
//     loginWhereSql.getValues()
//   )

//   return await executeQuery(connection, sql, {
//     onSuccessMessage: 'Usuario encontrado',
//     onFailmessage: 'Ocurrio un error al buscar el usuario en legacy',
//     onSuccess: onSuccessAsObject('Usuario no encontrado'),
//   })
// }

// // selectionar base de datos, plaza y tipo de empresa
// const selectDb = async ({ connection, origenRh }) => {
//   const sql = await connection.format(
//     `
//   SELECT 
//     dciudad,
//     bd as bd_raw,
//     CONCAT(
//       dciudad,
//       '_', 
//       bd
//     ) bd,
//     id_sar AS id_plaza, 
//     SUBSTRING_INDEX(descripcion, ' ', 1) AS id_tipo_empresa
//   FROM bd
//   INNER JOIN ciudades AS cdad
//       ON bd.idciudad = cdad.id
//   WHERE idbd = ?
//   limit 1
//     `,
//     [origenRh]
//   )
//   return await executeQuery(connection, sql, {
//     onSuccess: onSuccessAsObject('Base de datos no encontrada'),
//     onSuccessMessage: 'Base de datos encontrada',
//     onFailmessage: 'Ocurrio un error en selectDb',
//   })
// }
// // Informacion de usuario en legacy
// const getUserInfoLegacy = async ({ connection, idEmpleado, dataBase }) => {
//   const sql = await connection.format(
//     `SELECT 
//       nombre nombres,
//       id_depto,
//       curp,
//       ape_paterno,
//       ape_materno,
//       p_pnal.id_estatus
//     FROM ${dataBase}.pro_personal AS p_pnal
//     WHERE id_conse = ?;`,
//     [idEmpleado]
//   )
//   return await executeQuery(connection, sql, {
//     onSuccess: onSuccessAsObject('Informacion de usuario no encontrada'),
//     onFailmessage: 'Ocurrio un error en getUserInfoLegacy',
//     onSuccessMessage: 'Informacion de usuario encontrada',
//   })
// }
// Informacion de usuario en admondb
const insertAdmonPersonal = async ({ connection, sets }) => {
  const admonPersonalSets = {
    nombre: null,
    apellido_paterno: null,
    apellido_materno: null,
    curp: null,
    id_rh_antiguo: null,
    id_plaza: null,
    id_tipo_empresa: null,
    id_estatus_rh: null,
    creado_por: null,
  }

  const admonPersonalSetsSql = new sqlGenerator(admonPersonalSets)
  admonPersonalSetsSql.filter(sets)

  const sql = await connection.format(
    `INSERT INTO 
      admon_personal
      (${admonPersonalSetsSql.columnsJoin()})
    VALUES
      (${admonPersonalSetsSql.getQuestionMarks()});`,
    admonPersonalSetsSql.getValues()
  )

  return await executeQuery(connection, sql, {
    onFailmessage: 'Ocurrio un error en insertAdmonPersonal',
    onSuccessMessage: 'Se inserto el usuario en admondb',
    onFail: onFailedTransaction,
  })
}

// const getAllDataLegacyUser = async ({ user }) => {
//   const connection = await getPoolConnection('USUARIOS')
//   if (connection instanceof Error) {
//     return {
//       error: true,
//       message: 'Error al conectar con la base de datos, en getUsuario',
//       data: connection.toString(),
//     }
//   }

//   // buscar usuario por usuario
//   const foundUserLegacy = await getUsuarioLegacy({
//     connection,
//     where: {
//       usuario: user,
//       estatus_user: 'ACTIVO',
//     },
//   })
//   if (foundUserLegacy.error) {
//     return foundUserLegacy
//   }
//   if (!foundUserLegacy.hasData) {
//     return foundUserLegacy
//   }
//   const {
//     data: { origen_rh: origenRh, id_empleado: idEmpleado },
//   } = foundUserLegacy

//   // seleccionar base de datos
//   const selectedDb = await selectDb({
//     connection,
//     origenRh,
//   })
//   if (selectedDb.error) {
//     return selectedDb
//   }
//   if (!selectedDb.hasData) {
//     return selectedDb
//   }
//   const {
//     data: { bd_raw: dataBase },
//   } = selectedDb

//   // obtener info de usuario en legacy
//   const userInfoLegacy = await getUserInfoLegacy({
//     connection,
//     idEmpleado,
//     dataBase,
//   })
//   if (userInfoLegacy.error) {
//     return userInfoLegacy
//   }
//   if (!userInfoLegacy.hasData) {
//     return userInfoLegacy
//   }

//   await connection.destroy()
//   return {
//     error: false,
//     message: 'Informacion de usuario encontrada',
//     data: {
//       login: foundUserLegacy.data,
//       info: userInfoLegacy.data,
//       dataBase: selectedDb.data,
//     },
//     hasData: true,
//   }
// }

const legacyToAdmondb = async ({ connection, legacyData }) => {
  await connection.beginTransaction()
  const {
    login: {
      id_empleado: id_rh_antiguo,
      usuario: nombre_usuario,
      password,
      email: correo,
      id_user: id_intranet,
    },
    info: {
      nombres: nombre,
      ape_paterno: apellido_paterno,
      ape_materno: apellido_materno,
      curp,
    },
    dataBase: { id_plaza, id_tipo_empresa },
  } = legacyData
  const insertededAdmonPersonal = await insertAdmonPersonal({
    connection,
    sets: {
      nombre,
      apellido_paterno,
      apellido_materno,
      curp,
      id_rh_antiguo,
      id_plaza,
      id_tipo_empresa,
      id_estatus_rh: 52,
    },
  })
  if (insertededAdmonPersonal.error) {
    return insertededAdmonPersonal
  }
  const {
    data: { insertId: idadmon_personal },
  } = insertededAdmonPersonal

  const insertedUsuario = await insertUsuario({
    connection,
    sets: {
      id_intranet,
      idadmon_personal,
      nombre_usuario,
      password,
      correo,
    },
    onFail: onFailedTransaction,
  })
  if (insertedUsuario.error) {
    return insertedUsuario
  }

  await connection.commit()
  return insertedUsuario
}
const selectUsuariosExternosByNombreUsuario = async ({ connection, wheres }) => {
  const { nombreUsuario } = wheres;
  const sql = await connection.format(
    `SELECT
      *
    FROM
      admon_db.usuarios_externos
    WHERE
      nombre_usuario = ?
      AND eliminado = 0
    LIMIT 1
;`,
    [nombreUsuario]
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
const updateUsuarioExternoUltimoAcceso = async ({ connection, wheres }) => {
  const { idUsuario } = wheres;
  const sql = await connection.format(
    `UPDATE admon_db.usuarios_externos
    SET ultimo_acceso = NOW()
    WHERE id_usuarios_externos = ?
  ;`,
    [idUsuario]
  )
  return await executeQuery(
    connection,
    sql,
    {
      onFailmessage: 'Ocurrio un error en Fn: updateUsuarioExternoUltimoAcceso',
    }
  );
};
const autenticacionByPasswordExtranet = async (req, res) => {

  const {
    body: { user, pass },

  } = req

  const connection = await getPoolConnection('ADMONDB')
  if (connection instanceof Error) {
    return response500(res, {
      error: true,
      message:
        'Error al conectar con la base de datos, en autenticacionByPassword',
      data: connection.toString(),
    })
  }

  const foundUser = await selectUsuariosExternosByNombreUsuario({ connection, wheres: { nombreUsuario: user } });
  if (foundUser.error) { return response500(res, foundUser); }
  if (!foundUser.hasData) {
    await connection.release();
    await connection.destroy();
    return res.status(403).json({
      error: false,
      message: 'El usuario no existe o contraseña incorrecta',
      data: null,
    });
  }
  const {
    data: {
      password,
      modulos: modulosJson
    }
  } = foundUser;
  const isSamePassword = await bcrypt.compare(pass, password)
  if (!isSamePassword) {
    await connection.destroy()
    return res.status(403).json({
      error: false,
      message: 'El usuario no existe o contraseña incorrecta',
      data: null,
    })
  }

  // generar token de sesion
  const sesionToken = await generateSesionToken({
    idUsuario: foundUser?.data?.id_usuarios_externos,
    nombreUsuario: 'proveedormaquinariademo',
    nombreCompleto: `${foundUser?.data?.apellido_paterno} ${foundUser?.data?.apellido_materno}`,
    idIntranet: null,
    password: null,
    token: null,
    externo: true,
  })
  if (sesionToken.error) {
    return response500(res, sesionToken)
  }
  if (sesionToken.data === null) {
    await connection.destroy()
    return res.status(403).json(sesionToken)
  }

  // agregar el id del token qr al token de sesion
  sesionToken.data.idToken = null
  sesionToken.data.timeStamp = null
  await updateUsuarioExternoUltimoAcceso({ connection, wheres: { idUsuario: foundUser.data.id_usuarios_externos } });
  await connection.destroy()
  return res.status(200).json(sesionToken)
};
const autenticacionByPasswordIntranet = async (req, res) => {
  const {
    body: { user, pass, id_modulo: idModulo },
  } = req

  const connection = await getPoolConnection('ADMONDB')
  if (connection instanceof Error) {
    return response500(res, {
      error: true,
      message:
        'Error al conectar con la base de datos, en autenticacionByPassword',
      data: connection.toString(),
    })
  }

  // buscar usuario por usuario
  let foundUser = await getUsuario({
    connection,
    where: { 'u.nombre_usuario': user },
    select: { password: 'u.password' },
  })
  if (foundUser.error) {
    return response500(res, foundUser)
  }

  // no se encontró el usuario en admondb
  if (!foundUser.hasData) {
    await connection.release();
    await connection.destroy();
    return res.status(403).json({
      error: false,
      message: 'El usuario no existe o contraseña incorrecta',
      data: null,
    })
    // Se desactiva la sincronizacion de usuarios de legacy a admondb por el momento
    // sincronizar usuario de legacy a admondb
    // const legacyData = await getAllDataLegacyUser({ user })
    // if (legacyData.error) {
    //   return response500(res, legacyData)
    // }
    // if (!legacyData.hasData) {
    //   await connection.destroy()
    //   return res.status(403).json(legacyData)
    // }

    // const result = await legacyToAdmondb({
    //   connection,
    //   legacyData: legacyData.data,
    // })
    // if (result.error) {
    //   return response500(res, result)
    // }

    // foundUser = await getUsuario({
    //   connection,
    //   where: { 'u.nombre_usuario': user },
    //   select: { password: 'u.password' },
    // })
  }

  const {
    data: { password },
  } = foundUser
  // comparar contraseñas
  const isSamePassword = await bcrypt.compare(pass, password)
  if (!isSamePassword) {
    await connection.destroy()
    return res.status(403).json({
      error: false,
      message: 'El usuario no existe o contraseña incorrecta',
      data: null,
    })
  }
  const {
    data: { idUsuario },
  } = foundUser

  // guardar token qr
  const savedQr = await saveTokenQr({
    connection,
    idUsuario,
    idModulo: idModulo ?? -1,
  })
  if (savedQr.error) {
    return response500(res, savedQr)
  }
  const {
    data: { insertId, token },
  } = savedQr

  // agregar token a usuario
  foundUser.data.token = token

  // generar token de sesion
  const sesionToken = await generateSesionToken({ ...foundUser.data, externo: false })
  if (sesionToken.error) {
    return response500(res, sesionToken)
  }
  if (sesionToken.data === null) {
    await connection.destroy()
    return res.status(403).json(sesionToken)
  }

  // agregar el id del token qr al token de sesion
  sesionToken.data.idToken = insertId
  sesionToken.data.timeStamp = token

  await connection.destroy()
  return res.status(200).json(sesionToken)
}
const autenticacionByPassword = async (req, res) => {
  const { body: { externo: _externo } } = req

  let externo = _externo;
  if (typeof _externo === 'string') {
    externo = _externo === '1' || /^true$/i.test(_externo);
  } else {
    externo = Boolean(_externo);
  }

  req.externo = externo;

  if (externo) return await autenticacionByPasswordExtranet(req, res);
  return await autenticacionByPasswordIntranet(req, res);
};

const changePasswordUsuarioExterno = async (req, res) => {// Endpoint para que el usuario externo pueda cambiar su contraseña

  const comparePasswordUsuarioExterno = async (connection, idUsuario, currentPassword) => {// Funcion para comparar la contraseña actual del usuario externo

    const sql = await connection.format(
      `
        SELECT password
        FROM admon_db.usuarios_externos
        WHERE eliminado = 0 
        AND id_usuarios_externos = ?
      `, [idUsuario]
    );

    const result = await executeQuery(
      connection,
      sql,
      {
        onSuccess: onSuccessAsObject()
      }
    );
    if (result.error) return result;
    if (!result.hasData) {
      await connection.destroy();
      return {
        error: true,
        message: 'No se encontró el usuario',
        data: {}
      }
    };

    const { data: { password } } = result;

    const isValid = await bcrypt.compare(currentPassword, password);

    if (isValid) {
      return {
        error: false,
        message: 'ok',
        data: {}
      }
    } else {
      await connection.destroy();
      return {
        error: true,
        message: 'La contraseña actual es incorrecta',
        data: {}
      }
    }

  };

  const comparePasswordUsuarioInterno = async (connection, idUsuario, currentPassword) => {// Funcion para comparar la contraseña actual del usuario interno

    const sql = await connection.format(
      `
        SELECT ifnull(password, '') password
        FROM admon_db.usuarios
        WHERE eliminado = 0 
        AND id_usuario = ?
      `, [idUsuario]
    );

    const result = await executeQuery(
      connection,
      sql,
      {
        onSuccess: onSuccessAsObject()
      }
    );
    console.log("result: ", result);
    if (result.error) return result;
    if (!result.hasData) {
      await connection.destroy();
      return {
        error: true,
        message: 'No se encontró el usuario',
        data: {}
      }
    };

    const { data: { password } } = result;

    const isValid = await bcrypt.compare(currentPassword, password);

    if (isValid) {
      return {
        error: false,
        message: 'ok',
        data: {}
      }
    } else {
      await connection.destroy();
      return {
        error: true,
        message: 'La contraseña actual es incorrecta',
        data: {}
      }
    }

  };

  const updateAdmonDbPassword = async (connection, idUsuario, hashedPassword) => {// Funcion para actualizar la contraseña en la base de datos admondb de usuarios internos

    const sql = await connection.format(
      `
        UPDATE admon_db.usuarios
        SET
          password = ?,
          editado_por = ?
        WHERE eliminado = 0
        AND id_usuario = ?
      `, [
      hashedPassword,
      idUsuario,
      idUsuario
    ]
    );

    return await executeQuery(
      connection,
      sql,
      {
        onSuccess: onSuccessUpdate(),
        onFail: onFailedTransaction
      }
    );

  };

  const getIdIntranet = async (connection, idUsuario) => {// Funcion para obtener el id_intranet del usuario interno

    const sql = await connection.format(
      `
        SELECT
          id_intranet
        FROM admon_db.usuarios
        WHERE eliminado = 0
        AND id_usuario = ?
      `, [idUsuario]
    );

    return await executeQuery(
      connection,
      sql,
      {
        onSuccess: onSuccessAsObject(),
        onFail: onFailedTransaction
      }
    );

  };

  const updateLegacyPaswword = async (connection, idIntranet, hashedPassword) => {// Funcion para actualizar la contraseña en la base de datos legacy de usuarios internos

    const sql = await connection.format(
      `
        UPDATE usuarios.login
        SET
          password = ?
        WHERE id_user = ?
        AND estatus_user = 'ACTIVO'
      `, [
      hashedPassword,
      idIntranet
    ]
    );

    return await executeQuery(
      connection,
      sql,
      {
        onSuccess: onSuccessUpdate(),
        onFail: onFailedTransaction
      }
    )
  };


  const {
    body: {
      currentPassword,
      newPassword,
      confirmNewPassword,
    },
    token: { user: { idUsuario, externo } }
  } = req;

  if (newPassword !== confirmNewPassword) {// Validar que las contrasñas coincidanF
    return res.status(400).json({
      error: true,
      message: 'Las contraseñas no coinciden',
      data: {}
    });
  };

  if (externo) {// Cambio de password usuarios externos

    const connection = await getPoolConnection('ADMONDB');
    if (connection instanceof Error) {
      return response500(res, {
        error: true,
        message: `Error en la conexión a la base de datos 'ADMONDB' en la fn: changePassword`,
        data: connection.toString()
      })
    };

    // validar que la contraseña antigua sea correcta
    const isValidPassword = await comparePasswordUsuarioExterno(connection, idUsuario, currentPassword);
    if (isValidPassword.error) {
      await connection.destroy();
      return res.status(400).json({
        error: true,
        message: 'La contraseña actual es incorrecta',
        data: {}
      });
    };

    // hashear contraseña y actualizar la nueva contraseña
    const salt = await bcrypt.genSalt(7);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await connection.beginTransaction();

    const sql = await connection.format(
      `
        UPDATE admon_db.usuarios_externos
        SET
          password = ?,
          editado_por = ?
        WHERE eliminado = 0
        AND id_usuarios_externos = ?
      `, [
      hashedPassword,
      idUsuario,
      idUsuario
    ]
    );

    const result = await executeQuery(
      connection,
      sql,
      {
        onSuccess: onSuccessUpdate(),
        onFail: onFailedTransaction
      }
    );
    if (result.error) return response500(res, result);

    const sqlLog = await connection.format(
      `
        INSERT INTO admon_db.log_cambio_password_usuario_externo(
          fk_id_usuarios_externos,
          creado_por
        )VALUES(?,?)
      `, [idUsuario, idUsuario]
    );

    const resultLog = await executeQuery(
      connection,
      sqlLog,
      {
        onFail: onFailedTransaction
      }
    );
    if (resultLog.error) return response500(res, resultLog);

    await connection.commit();
    await connection.destroy();

  } else {// Cambio de password usuarios internos

    const connectionA = await getPoolConnection('ADMONDB');
    if (connectionA instanceof Error) {
      return response500(res, {
        error: true,
        message: `Error en la conexión a la base de datos 'ADMONDB' en la fn: changePassword`,
        data: connectionA.toString()
      })
    };

    // validar que la contraseña antigua sea correcta
    const isValidPassword = await comparePasswordUsuarioInterno(connectionA, idUsuario, currentPassword);
    if (isValidPassword.error) { return response500(res, isValidPassword) };

    // hashear contraseña y actualizar la nueva contraseña
    const salt = await bcrypt.genSalt(7);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // actualizar en admondb
    await connectionA.beginTransaction();

    const updatedAdmonPassword = await updateAdmonDbPassword(connectionA, idUsuario, hashedPassword);
    if (updatedAdmonPassword.error) return response500(res, updatedAdmonPassword);

    // actualizar en legacy
    const obtainedIdIntranet = await getIdIntranet(connectionA, idUsuario);
    if (obtainedIdIntranet.error) return response500(res, obtainedIdIntranet);
    if (!obtainedIdIntranet.hasData) {
      await connectionA.rollback();
      await connectionA.destroy();
      return response500(res, {
        error: true,
        message: 'No se encontró el id_intranet del usuario',
        data: {}
      })
    };

    const { id_intranet } = obtainedIdIntranet.data;

    const connectionL = await getPoolConnection('USUARIOS');
    if (connectionL instanceof Error) {
      await connectionA.rollback();
      await connectionA.destroy();
      return response500(res, {
        error: true,
        message: `Error en la conexión a la base de datos 'USUARIOS' en la fn: changePassword`,
        data: connectionL.toString()
      })
    };

    await connectionL.beginTransaction();

    const updatedLegacyPassword = await updateLegacyPaswword(connectionL, id_intranet, hashedPassword);
    if (updatedLegacyPassword.error) {
      await connectionA.rollback();
      await connectionA.destroy();
      return response500(res, updatedLegacyPassword);
    };

    await connectionA.commit();
    await connectionA.destroy();

    await connectionL.commit();
    await connectionL.destroy();

  };

  return res.status(200).json({
    error: false,
    message: 'Se actualizó la contraseña correctamente',
    data: {}
  });

};

module.exports = {
  autenticacionByPassword,
  changePasswordUsuarioExterno
};
