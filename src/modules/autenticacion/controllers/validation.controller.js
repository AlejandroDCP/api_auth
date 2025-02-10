import { 
  getPoolConnection,
  executeQuery,
  onSuccessAsObject
} from '../../../core/dbConnection.service'
import { response500 } from '../../../core/responses.service.js'
import { sqlGenerator } from '../../../core/sqlGenerator.util.js'
import { getUsuario } from '../../shared/services/user.service.js'
import { generateSesionToken} from '../services/token.service.js'

const getAdmonRegistroToken = async ({connection, wheres, select}) => {
  const _select = select ?? {
    'id_reg_token': null,
    'id_usuario': null,
    'token': null,
    'inicio': null,
    'final': null,
    'id_modulo': null,
    'qr': null,
    'ruta_qr': null,
  }
   
  const admonRegistroTokenWheres = {
    'id_reg_token': null,
    'id_usuario': null,
    'token': null,
    'inicio': null,
    'final': null,
    'id_modulo': null,
    'qr': null,
    'ruta_qr': null,
  };
  const admonRegistroTokenWheresSql = new sqlGenerator(admonRegistroTokenWheres);
  admonRegistroTokenWheresSql.filter(wheres);

  const sql = connection.format(
    `SELECT
      ${sqlGenerator.genSelect(_select)}
    FROM
      admon_registro_token
    WHERE
      ${admonRegistroTokenWheresSql.genWhere()}
      AND final IS NULL
    `,
    admonRegistroTokenWheresSql.getValues()
  );

  return await executeQuery(
    connection, 
    sql,
    {
      onSuccessMessage: 'Consulta exitosa, se obtuvo el token',
      onFailmessage: 'Error en la consulta, no se obtuvo el token',
      onSuccess: onSuccessAsObject('No se encontro el token')
    }
  );
};

module.exports = {
  posExchange: async (req, res) => {
    const { body: { token} } = req;
    // conectar a la base de datos
    const connection = await getPoolConnection('ADMONDB');
    if ( connection instanceof Error ) {
      return response500(res, {
        error: true,
        message: 'Error al conectar con la base de datos, en posExchange',
        data: connection.toString(),
      });
    }

    // buscar token
    const admonRegistroToken = await getAdmonRegistroToken({
      connection,
      wheres: {
        token
        // final: null, 
      },
    });

    if ( admonRegistroToken.error ){ return response500(res, admonRegistroToken); }
    if ( !admonRegistroToken.hasData ){ return res.status(404).json(admonRegistroToken); }
    const { data: { id_usuario, id_reg_token } } = admonRegistroToken;

    // buscar usuario
    const foundUser = await getUsuario({ connection, where: { 'u.id_usuario': id_usuario } })
    if ( foundUser.error ){ return response500(res, foundUser); }
    if ( !foundUser.hasData ){ return res.status(404).json(foundUser); }
    
    // generar token
    const sesionToken = await generateSesionToken(foundUser.data);
    if (sesionToken.error) { return response500(res, sesionToken); }
    if (sesionToken.data === null) { 
      await connection.destroy();
      return res.status(403).json(sesionToken)
    }

    // agregar el id del token qr al token de sesion
    sesionToken.data.idToken = id_reg_token;
    sesionToken.data.timeStamp = token;

    await connection.destroy()
    return res.status(200).json(sesionToken)

  }
}
