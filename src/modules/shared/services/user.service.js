import { sqlGenerator } from '../../../core/sqlGenerator.util'
import {
  executeQuery,
  onSuccessAsObject
} from '../../../core/dbConnection.service'

const getUsuario = async ({ connection, where, select = {} }) => {
  const baseRow = {
    'u.nombre_usuario': null,
    'u.correo': null,
    'u.eliminado': null,
    'u.id_usuario': null,
    'u.id_intranet': null,
  };
  const weresSql = new sqlGenerator(baseRow)
  weresSql.filter({ ...where, 'u.eliminado': 0 })

  const _select = {
    idUsuario: 'u.id_usuario',
    nombreUsuario: 'u.nombre_usuario',
    nombreCompleto: 'concat_ws(" ", ap.nombre, ap.apellido_paterno, ap.apellido_materno )',
    idIntranet: 'u.id_intranet',
    ...select
  }

  const sql = await connection.format(
    `SELECT
    ${sqlGenerator.genSelect(_select)}
FROM 
  usuarios AS u
 
inner join admon_personal ap
  on u.idadmon_personal = ap.idadmon_personal
  and ap.eliminado = 0
  AND ap.id_estatus_rh =
  (SELECT cpg.parametro_num
  FROM admon_db.cat_parametros_generales cpg
  WHERE cpg.eliminado = 0
          AND cpg.parametro_varchar = 'ESTATUS_RH_LABORANDO')
              
WHERE 
  ${weresSql.genWhere()}
limit 1
`,
    weresSql.getValues()
  )
  return await executeQuery(connection, sql, {
    onSuccess: onSuccessAsObject('Usuario no encontrado'),
    onSuccessMessage: 'Usuario encontrado',
    onFailmessage: 'Ocurrio un error al buscar el usuario',
  })
};

const insertUsuario = async ({ connection, sets, onFail }) => {
  const usuariosSets = {
    id_intranet: null,
    idadmon_personal: null,
    id_sw_antiguo: null,
    id_usuario_comercial: null,
    nombre_usuario: null,
    password: null,
    correo: null,
    extension: null,
  };
  const usuariosSetsSql = new sqlGenerator(usuariosSets);
  usuariosSetsSql.filter(sets);

  const sql = await connection.format(
    `INSERT INTO 
      usuarios
      (${usuariosSetsSql.columnsJoin()})
    VALUES
      (${usuariosSetsSql.getQuestionMarks()});`,
    usuariosSetsSql.getValues()
  );
  return await executeQuery(
    connection,
    sql,
    {
      onFailmessage: 'Ocurrio un error en insertUsuario',
      onSuccessMessage: 'Se inserto el usuario',
      onFail
    }
  );
};


module.exports = {
  getUsuario,
  insertUsuario
}
