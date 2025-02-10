import { response500 } from '../../../core/responses.service.js'
import { decodeToken } from '../services/decodeToken.service.js';
import { DateTime } from 'luxon';
import { createHmac, timingSafeEqual } from 'crypto';
import { secrets } from '../../../../env.js';

const tokenMiddleware = async (req, res, next) => {
  const { headers: { authorization } } = req;

  if (!authorization) {
    return res.status(401).json({
      error: true,
      message: 'No se ha enviado el token',
      data: null
    });
  }

  const token = authorization.substring(7);
  
  const decoded = decodeToken(token);

  if (decoded.error) { return response500(res, decoded); }

  if (!decoded.isValid) { return res.status(401).json(decoded); }
  
  const { data: tokenDecoded } = decoded;

  req.token = tokenDecoded;
  next();
};

const isAnyUndefinedOrEmpty = (array) => {
  return array.some((item) => item == undefined || item == "");
};

const checkHmacAuth = (req, res, next) => {
  const { body } = req;
  const {
    headers: { authorization },
  } = req;

  //Validamos la presencia del header
  if (authorization === undefined) {
    return res
      .status(401)
      .json({ error: true, message: "Se requiere autorización", data: null });
  }

  //Validar el numero de parámetros
  const authorizationParts = authorization.split(" ");
  if (
    authorizationParts.length !== 2 ||
    isAnyUndefinedOrEmpty(authorizationParts)
  ) {
    return res.status(401).json({
      error: true,
      message: "Numero incorrecto de parámetros en autorización",
      data: null,
    });
  }

  //Validamos que el esquema sea correcto
  const [authScheme, authorizationParameters] = authorizationParts;
  if (authScheme.toUpperCase() !== "HMACAUTH") {
    return res
      .status(401)
      .json({ error: true, message: "Esquema no valido", data: null });
  }

  //Validar el numero de parámetros
  const params = authorizationParameters.split(":");
  if (params.length !== 4 || isAnyUndefinedOrEmpty(params)) {
    return res.status(401).json({
      error: true,
      message: "Numero incorrecto de parámetros",
      data: null
    });
  }

  //Destructuramos parámetro de la cabecera
  const [signature, appId, nonce, timestamp] = params;

  //Validas caducidad
  const gracePeriod = DateTime.local().plus({ minutes: 1 });
  const timestampLuxon = DateTime.fromSeconds(parseInt(timestamp));

  if (!timestampLuxon.isValid) {
    return res
      .status(401)
      .json({ error: true, message: "Timestamp no valido", data: null });
  }

  if (timestampLuxon > gracePeriod) {
    return res
      .status(401)
      .json({ error: true, message: "Secreto caducado", data: null });
  }

  //Validamos que el secreto exista
  const secret = secrets[appId];
  if (secret === undefined) {
    return res
      .status(401)
      .json({ error: true, message: "Secreto no disponible", data: null });
  }

  //Generamos el password
  const password = `${secret}${appId}${nonce}${timestamp}`;

  //Generamos la firma
  const bodyString = JSON.stringify(body);
  const hmac = createHmac("sha256", password);
  hmac.update(bodyString);
  const calculatedHmac = hmac.digest("hex");

  //Validamos la firma
  if (!timingSafeEqual(Buffer.from(calculatedHmac), Buffer.from(signature))) {
    return res.status(401).json({
      error: true,
      message: "Sin Autorización, el token no es valido",
      data: null
    });
  }

  //Si todo es correcto pasamos a lo siguiente
  next();
};


module.exports = { 
  tokenMiddleware,
  checkHmacAuth
 }
