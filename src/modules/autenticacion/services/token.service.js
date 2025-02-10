import fs from 'fs'
import jwt from 'jsonwebtoken'
import { JWT_KEY_PATH, QRPATH } from '../../../../env.js'
// import QRCode from 'qrcode';
import { executeQuery, onSuccessUpdate } from '../../../core/dbConnection.service.js';
import path from 'path';
// import { saveFile } from '../../../core/files.service.js';

const getToken = async (user) => {
  try {
    const privateKey = fs.readFileSync(JWT_KEY_PATH)
    const token = await jwt.sign({ user }, privateKey, {
      algorithm: 'RS256',
      expiresIn: '9h',
    })
    return { error: false, message: 'Token generado ', data: token }
  } catch (error) {
    console.error(error)
    return { error: true, message: 'Error interno del servidor, en getToken', data: error.toString() }
  }
};

const generateSesionToken = async (foundUser) => {
  if (!foundUser) {
    return {
      error: true,
      message: 'Acceso no autorizado, usuario no encontrado',
      data: null,
    }
  }
  //token
  const tokenData = { ...foundUser, password: null }
  const token = await getToken(tokenData)
  if (token.error) {
    return token
  }
  //Respuesta
  return {
    error: false,
    msg: 'Sesion iniciada correctamente',
    data: {
      token: token.data,
    },
  }
};

const saveTokenQr = async ({ connection, idUsuario, idModulo }) => {
  // const destBucket = 'QR';
  const text2Qr = `${idUsuario}-${new Date().getTime()}`;
  // const SAVEPATH = path.join(__dirname, '../../../../temp');
  const fileName = `${text2Qr}.png`;
  // const fullPath = path.join(SAVEPATH, fileName);
  // try {
  //   await QRCode.toFile(fullPath, text2Qr);
  // } catch (error) {
  //   console.error(error);
  //   return {
  //     error: true,
  //     message: 'Error al generar el QR, en saveTokenQr',
  //     data: error.toString(),
  //   }
  // };

  const destinationPath = path.join(QRPATH, fileName);

  // const savedFile = await saveFile({ filePath: fullPath, destinationPath, destBucket });
  // if (savedFile.error) {
  //   return savedFile;
  // }
  // fs.existsSync(fullPath) && fs.unlinkSync(fullPath);

  const sqlQuery = 'INSERT INTO admon_db.admon_registro_token (id_usuario, token, inicio, id_modulo, ruta_qr) VALUES( ?, ?, NOW(), ?, ? );';
  const params = [
    idUsuario, // id_usuario
    text2Qr, // token
    idModulo, // id_modulo
    destinationPath// ruta_qr
  ];
  const savedQr = await executeQuery(
    connection,
    sqlQuery,
    {
      onSuccessMessage: 'Token guardado correctamente',
      onFailmessage: 'Error al guardar el token, en saveTokenQr',
      params
    }
  );
  if (savedQr.error) { return savedQr; }
  savedQr.data.token = text2Qr;
  return savedQr;
};

const revokeTokenQr = async ({ connection, token }) => {

  const sqlQuery = await connection.format(
    `UPDATE 
  admon_db.admon_registro_token
SET 
  final = NOW()
WHERE
  token = ?
  AND final IS NULL
  ;`,
    [token]
  );

  return await executeQuery(
    connection,
    sqlQuery,
    {
      onSuccess: onSuccessUpdate({
        updateMessage: 'Token revocado correctamente',
        noChangedMessage: 'El token no se revocó, ya estaba revocado',
        notFound: 'El token no se revocó, no se encontró o ya estaba revocado'
      }),
      onSuccessMessage: 'Token revocado correctamente',
      onFailmessage: 'Error al revocar el token, en revokeTokenQr',
    }
  );
};

module.exports = {
  generateSesionToken,
  saveTokenQr,
  revokeTokenQr
}
