const GOOGLE = {
    GOOGLE_API_CLIENT_ID: '61513905635-290i1vrot2mtllruhse41ps522hgos9u.apps.googleusercontent.com',
    GOOGLE_API_CLIENT_SECRET: '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',
    GOOGLE_API_REDIRECT: {
      'rh-app': 'http://172.19.2.101:3001/google-oauth?app=rh-app',
      'si-app': 'http://172.19.2.101:3002/google-oauth?app=si-app',
      'tk-app': 'http://172.19.2.101:3003/google-oauth?app=tk-app',
      'lo-app': 'http://172.19.2.101:5004/api/v1/autenticacion/google/oauth2?app=lo-app',
    }
  };
  
  const DATABASES = {
    MYSQL: {
      "ADMONDB": {
        "HOST": '172.19.2.234',
        "USER": 'biventas',
        "PASSWORD": 'C4du#b1v120',
        "DATABASE": 'admon_db'
      },
      "USUARIOS": {
        "HOST": '172.19.2.244',
        "USER": 'root',
        "PASSWORD": 'T00r.249',
        "DATABASE": 'usuarios'
      },
    }
  };
  
  // const JWT_KEY_PATH = '/srv/develop/shared/keys/jwtRS256.key';
  const JWT_KEY_PATH = 'C:\\change_log\\zelda_api/llaves2/jwtRS256.key';
  const JWT_PEM_PATH = 'C:\\change_log\\zelda_api/llaves2/jwtRS256.pem';
  // const JWT_PEM_PATH = '../zelda_api/llaves2/jwtRS256.pem';
  
  const PORT = 5004;
  const BUCKETS = {
    QR: 'C:\\TEMP',
  }
  const QRPATH = '/qr';
  module.exports = {
    GOOGLE,
    DATABASES,
    JWT_KEY_PATH,
    PORT,
    BUCKETS,
    QRPATH,
    JWT_PEM_PATH,
    DEBUG: 0,
    DEBUG_LEVEL: 3
  };
