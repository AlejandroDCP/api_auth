# Autenticacion usuario-password
### TODO: 
En el middleware de autenticacion se debe validar que el usuario este activo, para esto se hace una consulta a la base de datos y validad que no tenga fecha de fin
### Estructura de carpetas
```
  .
  .
  .
  modules
  ├───menu
  │   ├───controllers
  │   │   ├───controller.controller.js
  │   ├───rules
  │   │   ├───rules.rules.js
  │   ├───routes
  │   │   ├───routes.routes.js
  │   ├───services
  │   │   └───service.service.js
  │   ├───middlewares
  │   │   └───middleware.middleware.js
  .
  .
  .
```
### Nomenclatura de archivos
  - `*.controller.js`: Archivo que contiene las funciones que se ejecutan en las rutas.
  - `*.rules.js`: Archivo que contiene las reglas de validación de los datos de entrada.
  - `*.routes.js`: Archivo que contiene las rutas de la API.
  - `*.service.js`: Archivo que contiene las funciones que se ejecutan en los controladores.
  - `*.middleware.js`: Archivo que contiene las funciones que se ejecutan en los middlewares.

### Nomenclatura de funciones para endpoints
  - `getEntity`: Función que obtiene datos de la base de datos.
  - `postEntity`: Función que inserta datos en la base de datos.
  - `putEntity`: Función que actualiza datos en la base de datos.
  - `deleteEntity`: Función que elimina datos de la base de datos.

### Nomenclatura de funciones para servicios
  - `getEntity`: Función que obtiene datos de la base de datos.
  - `insertEntity`: Función que inserta datos en la base de datos.
  - `updateEntity`: Función que actualiza datos en la base de datos.
  - `deleteEntity`: Función que elimina datos de la base de datos.

  ### Convención de respuesta
```
{
  error: true,
  message:'Error al obtener los datos',
  data:{}
}
```
### Convención de respuesta de error
```
{
  error: true,
  message:'Error al obtener los datos',
  data:{}
}
```

### ¿Qué es un servicio?
  - Un servicio es una función que se ejecuta en un controlador por ejemplo, obtener datos, insertar datos, actualizar datos, eliminar datos, etc. Estos pueden estar en un archivo aparte dentro services o en el mismo archivo del controlador.
### ¿Cuándo se debe mover servicio a un archivo aparte?
  - Cuando el servicio se va a utilizar en varios controladores o sea una función con demasiadas lineas.
### ¿Qué es un controlador?
  - Un controlador es una función que se ejecuta en una ruta, por ejemplo, obtener datos, insertar datos, actualizar datos, eliminar datos, etc. Estos pueden estar en un archivo aparte dentro controllers o en el mismo archivo de las rutas.
### ¿Qué es una regla?
  - Es objeto que contiene las reglas de validación de los datos de entrada, la validación se realiza con la librería express-validator.
### ¿Qué es una ruta?
  - Es un archivo que contiene las rutas, el método, el controlador y las reglas de validación de los datos de entrada.
### ¿Qué es un middleware?
  - Es una función que se ejecuta antes de que se ejecute el controlador, por ejemplo, autenticación, validación de permisos, etc.

### ¿Qué es un módulo?
  - Es una carpeta que contiene los controladores, reglas, rutas y servicios de un recurso.

## Módulo shared
  Los controladores, reglas y servicios que se encuentran en el modulo shared son los que se pueden utilizar en cualquier módulo de la aplicación, por ejemplo, el middleware de autenticación o reglas de validación de datos de entrada que se pueden utilizar en cualquier módulo.

## Módulo aplicación
  Este módulo informa sobre la version de la API y el estado del servidor.

## Directorio core
  Este directorio contiene funciones base para el funcionamiento del servidor, como la conexión a la base de datos, manejo de errores, etc.
## Archivo index.js
  Este archivo es el que se ejecuta al iniciar el servidor, confugura el servidor express, y las rutas de la API.
## Codigos de respuesta HTTP utilizados
  - 200: OK
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found
  - 500: Internal Server Error

## ¿Cuándo usar código de respuesta 200 o 201?
  - Cuando se obtiene un dato de la base de datos se debe usar el código 200.
  - Cuando se inserta un dato en la base de datos se debe usar el código 201.
## ¿Cuándo usar código de respuesta 400, 401, 403 o 404?
  - Cuando el request no cumple con las reglas de validación se debe usar el código 400 o uando se inserta un dato en la base de datos y ya existe.
  - Cuando el request no tiene el header de autorización se debe usar el codigo 401.
  - Cuando se obtiene un dato de la base de datos y no se encuentra se debe usar el código 404.
## ¿Cuándo usar código de respuesta 500?
  - Cuando se produce un error en el servidor se debe usar el código 500.
### Configuración de variables de entorno
  El proyecto utiliza variables de entorno en archivo js, para configurar las variables de entorno se debe crear un archivo llamado `env.js` en la raíz del proyecto.
## Directorio public
  Este directorio un archivo llamado `index.html` que se utiliza para probar la API.  
## Configuracion de variables de entorno
Crear archivo env.js en la raiz.
### Variables de entorno para google
Se crea y exporta el siguiente objeto:
```javascript
const GOOGLE = {
  GOOGLE_API_CLIENT_ID: '',
  GOOGLE_API_CLIENT_SECRET: '',
  GOOGLE_API_REDIRECT: ''
};
```
Para configurar la aplicacion en google se debe seguir los siguientes pasos:
1. Ingresar a la consola de google developers https://console.developers.google.com/
2. Crear un nuevo proyecto
3. En la seccion de credenciales Configure consent screen
4. Seleccione External y configure el nombre de la aplicacion
5. Agegar el scope .../auth/userinfo.email, .../auth/userinfo.profile
6. En la seccion de credenciales crear credenciales de tipo OAuth client ID
7. Seleccionar Web application
8. Agregar la url de redireccion, por ejemplo GOOGLE_API_REDIRECT
### Variables de entorno para Base de datos
Se crea y exporta el siguiente objeto:
```javascript
const DATABASES = {
  MYSQL:{
    "NOMBRE_CONECCION": {
      "HOST": '',
      "USER": '',
      "PASSWORD": ''
      "DATABASE": ''
    }
  }
};
```
Por cada base de datos que se quiera conectar se debe crear un objeto con el nombre de la conexion y los datos de conexion.
### Variables de entorno para JWT
Parar generar el token se debe crear llaves de privada y publica, estas se deben guardar en la raiz del proyecto con los nombres de jwtRS256.key y jwtRS256.key.pub respectivamente. no se requiere passphrase, se debe dejar en blanco.
```Bash
mkdir keys && cd keys
ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key
ssh-keygen -f jwtRS256.key.pub -e -m pem > jwtRS256.pem
```
Se crea y exporta el siguiente propiedad, que es path del directorio dende esta la llaves:
```javascript
const JWT_KEY_PATH: '';
```
### Puerto de ejecución del servidor
Puede configurar el puerto en el que se ejecuta el servidor, por defecto es 5000
```javascript
const PORT = 5004;
```
### Exportacion de variables
Se exportan todas las variable de 
```javascript
module.exports = {
  GOOGLE,
  DATABASES,
  JWT_KEY_PATH,
  PORTAPI
  ///....
};
```
## Instalacion de dependencias
```Bash
npm install
```
## Ejecucion de la aplicacion
```Bash
npm start
```
## Ejecucion de la aplicacion en modo desarrollo
```Bash
npm run dev
```
## PM2
  Hay scripts para ejecutar la aplicación con pm2, estos scripts se encuentran en el archivo `package.json` y exportan la variable export PM2_HOME=/srv/develop/, es recomendable ejetar la aplicación en modo desarrollo antes de ejecutarla con pm2 para verificar que no existan errores.
### Ejecución de la aplicación con pm2
```Bash
  nmp run pm2:install # Agrega la aplicacion a pm2
  nmp run pm2:start # Inicia la aplicacion o la reinicia si ya esta corriendo 
  nmp run pm2:stop # Detiene la aplicacion
  nmp run pm2:delete # Elimina la aplicacion de pm2
```


