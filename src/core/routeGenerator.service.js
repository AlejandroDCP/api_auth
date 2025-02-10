import { readdirSync, existsSync } from 'fs'
import path from 'path'

const routeGenerator = (directory, baseUrl = '') => {
  const modules = readdirSync(directory)
  const routes = []
  modules.forEach((module) => {
    const routesDirectory = path.join(directory, module, 'routes')
    if (existsSync(routesDirectory)) {
      const files = readdirSync(routesDirectory)
      files.forEach((file) => {
        if (file.match(/.*\.routes\.js/)) {
          routes.push({
            module: `${baseUrl}/${module}`,
            path: path.join(routesDirectory, file),
          })
        }
      })
    }
  })
  return routes
}

module.exports = { routeGenerator }
