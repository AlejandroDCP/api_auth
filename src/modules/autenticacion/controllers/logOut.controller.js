import { revokeTokenQr } from '../services/token.service.js';
import { response500 } from '../../../core/responses.service.js';
import { getPoolConnection } from '../../../core/dbConnection.service.js'
import { decodeToken } from '../../shared/services/decodeToken.service.js';

const postlogOut = async (req, res) => { 
  const { body: { token } } = req;

  const connection = await getPoolConnection('ADMONDB')

  if ( connection instanceof Error ) {
    return response500(res, {
      error: true,
      message: 'Error al conectar con la base de datos, en postlogOut',
      data: connection.toString(),
    });
  }

  const decoded = decodeToken(token, false);

  if (decoded.error) { 
    await connection.destroy();
    return response500(res, decoded); 
  }

  const { data: { user: { token: tokenDecoded } } } = decoded;

  const revokeToken = await revokeTokenQr({ connection, token: tokenDecoded });
  if (revokeToken.error) { return response500(res, revokeToken); }

  await connection.destroy();
  return res.status(200).json(revokeToken);
};

module.exports = {postlogOut}
