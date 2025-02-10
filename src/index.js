import hpp from 'hpp'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import express from 'express'
import { PORT, DEBUG, DEBUG_LEVEL } from './../env.js'
import { routeGenerator } from './core/routeGenerator.service'

const app = express()
/** CONFIG SERVER */
app.set('port', PORT || 5004)
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))
app.use(express.urlencoded({ extended: false }))

//Security
app.use(cors())
app.use(hpp())
app.use(helmet())
app.disable('x-powered-by')

if (DEBUG ?? process.env.DEBUG == 1) {
  console.log('🔊 DEBUG MODE ON');
  app.use(morgan('dev'))
  const _DEBUG_LEVEL = DEBUG_LEVEL ?? process.env.DEBUG_LEVEL ?? 1;
  const vervoseLog = (json) => {
    console.log(json);
    //console.log( JSON.stringify(json, null, 2) );
  };
  app.use((req, res, next) => {
    if (_DEBUG_LEVEL == 1) {// request 
      console.log('💬>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      const { query, params, body } = req;
      vervoseLog({ query, params, body });
      console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<💬');

    } else if (_DEBUG_LEVEL == 2) {// response
      console.log('💬>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      const resJson = res.json;
      res.json = function (json) {
        vervoseLog(json);
        const result = resJson.apply(res, arguments);
        console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<💬');
        return result;
      };

    } else if (_DEBUG_LEVEL == 3) {// request, response
      console.log('💬>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      const { query, params, body } = req;
      vervoseLog({ query, params, body });
      const resJson = res.json;
      res.json = function (json) {
        vervoseLog(json);
        const result = resJson.apply(res, arguments);
        console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<💬');
        return result;
      };

    } else { // no valido
      vervoseLog(`DEBUG_LEVEL: ${_DEBUG_LEVEL} no es valido`);
    }
    next();
  });
} else {
  app.use(morgan('combined'))
}

/** ROUTES */
const apiVersion = '/api/v1'
const routes = routeGenerator(path.join(__dirname, 'modules'), apiVersion)

routes.forEach(({ module, path }) => {
  app.use(module, require(path))
})

app.all('*', function (req, res) {
  return res.status(404).json({
    error: true,
    messsage:
      "🖐️ These Aren't the 🤖Droids You're Looking For, La ruta no existe",
    data: { method: req.method, url: req.originalUrl, api: 'aut-api' },
  })
})

app.listen(app.get('port'), () =>
  console.log(`Server on port ${app.get('port')}`)
)
