import { google } from 'googleapis'
import { getUsuario } from '../../shared/services/user.service.js'
import { getPoolConnection } from '../../../core/dbConnection.service.js'
import { generateSesionToken, saveTokenQr} from '../services/token.service.js'
import { GOOGLE } from '../../../../env.js'
import { response500 } from '../../../core/responses.service.js'

const getOAuth2Client = (app) => {
  const {
    GOOGLE_API_CLIENT_ID,
    GOOGLE_API_CLIENT_SECRET,
    GOOGLE_API_REDIRECT,
  } = GOOGLE
  
  return new google.auth.OAuth2(
    GOOGLE_API_CLIENT_ID,
    GOOGLE_API_CLIENT_SECRET,
    GOOGLE_API_REDIRECT[app] ?? 'http://localhost:5004/api/v1/autenticacion/google/oauth2?app=lo-app'
  )
}

const generateAuthUrl = async (req, res) => {
  const { query: { app } } = req

  const oAuth2Client = getOAuth2Client(app)

  const generatedUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  })

  return res.status(200).json({
    error: false,
    message: 'URL generada correctamente',
    data: generatedUrl,
  })
}

const getUserInfoGoogle = async (code, app) => {
  const oAuth2Client = getOAuth2Client(app)
  try {
    const { tokens } = await oAuth2Client.getToken(code)
    oAuth2Client.setCredentials(tokens)
    const oAuth2 = google.oauth2('v2')
    const { data } = await oAuth2.userinfo.get({
      auth: oAuth2Client,
    })
    return {
      error: false,
      message: 'Datos obtenidos correctamente',
      data,
    }
  } catch (error) {
    return {
      error: true,
      message: 'Error al generar el token, Error de Google',
      data: error.response.data,
    }
  }
}

const oauth2Handler = async (req, res) => {
  const {
    query: { code, app },
  } = req

  const userInfoGoogle = await getUserInfoGoogle(code, app)
  if (userInfoGoogle.error) { return response500(res, userInfoGoogle); }

  const {
    data: { email },
  } = userInfoGoogle

  const connection = await getPoolConnection('ADMONDB')
  if (connection instanceof Error) {
    return response500(res, {
      error: true,
      message: 'Error al conectar con la base de datos, en oauth2Handler',
      data: connection.toString()
    });
  }
  // buscar usuario por correo
  const foundUser = await getUsuario({ connection, where: { 'u.correo': email } })
  if (foundUser.error) { return response500(res, foundUser) } 
  if (!foundUser.hasData) { return res.status(403).json(foundUser) }
  const { data: { idUsuario } } = foundUser;

  // guardar token qr
  const savedQr = await saveTokenQr ({connection, idUsuario, idModulo: -1});
  if (savedQr.error) { return response500(res, savedQr); }
  const { data: { insertId, token } } = savedQr;

  // agregar token a usuario
  foundUser.data.token = token;

  // generar token de sesion
  const sesionToken = await generateSesionToken(foundUser.data)
  if (sesionToken.error) { return response500(res, sesionToken) }
  if (sesionToken.data === null) { 
    await connection.destroy();
    return res.status(403).json(sesionToken) 
  }

  // agregar el id del token qr al token de sesion
  sesionToken.data.idToken = insertId;
  sesionToken.data.timeStamp = token;

  await connection.destroy();
  return res.status(200).json(sesionToken)
}

module.exports = {
  generateAuthUrl,
  oauth2Handler
}
