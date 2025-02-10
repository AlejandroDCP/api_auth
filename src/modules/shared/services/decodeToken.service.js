import jwt from 'jsonwebtoken';
import fs from 'fs';
import { JWT_PEM_PATH } from '../../../../env.js';

const decodeToken = (token, validate=true) => { 
  try {
    const publicKey = fs.readFileSync(JWT_PEM_PATH);
    let decoded;
    if ( !validate ){
      decoded = jwt.decode(token, publicKey, { algorithms: ['RS256'] });
    }else{
      decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    }
    return {
      error: false,
      message: 'Token decodificado',
      data: decoded,
      isValid: true 
    }
  } catch (error) {
    const { name: error_type } = error;
    const errorsResponses = new Map([
      ['TokenExpiredError', { error: false, message: 'Token expirado', data: null }],
      ['JsonWebTokenError', { error: false, message: 'Token no valido', data: null }],
    ]);
    if (errorsResponses.has(error_type)) {
      return {
        ...errorsResponses.get(error_type), 
        isValid: false 
      };
    }else{
      console.error(error.toString());
      return {
        error: true,
        message: 'Error interno del servidor', 
        data: error.toString(), 
      };
    }
  }
};


module.exports = { decodeToken }
  