import mysql from 'mysql2/promise'
import { DATABASES } from '../../env.js'
const { MYSQL } = DATABASES

const getConnection = (key = null) => {
  const existConecion = Object.prototype.hasOwnProperty.call(MYSQL, key)
  if (!existConecion) {
    throw new Error('No hay conexión para esa base de datos')
  }
  const {
    [key]: { HOST: host, USER: user, PASSWORD: password, DATABASE: database },
  } = MYSQL
  return mysql.createPool({ host, user, password, database })
}

const getPoolConnection = async (key = null) => {
  try {
    const pool = getConnection(key)
    return await pool.getConnection()
  } catch (error) {
    return error
  }
}

const onSuccessAsArray = (message404 = 'No se encontraron datos') => {
  return async (connection, rows, message = 'Consulta exitosa') => {
    await connection.release()
    if (rows?.length === 0) {
      return {
        error: false,
        message: message404,
        data: [],
        hasData: false
      };
    };
    return {
      error: false,
      message: message,
      data: rows,
      hasData: true
    };
  };
};

const onSuccessAsObject = (message404 = 'No se encontraron datos') => {
  return async (connection, rows, message = 'Consulta exitosa') => {
    await connection.release();
    if (rows.length === 0) {
      return {
        error: false,
        message: message404,
        data: {},
        hasData: false
      }
    };
    return {
      error: false,
      message: message,
      data: rows[0],
      hasData: true
    };
  };
};

const onSuccessUpdate = (messages = {}) => {
  const {
    updateMessage = 'Se actualizó con éxito',
    noChangedMessage = 'No había nada que actualizar',
    notFound = 'No se encontró nada para actualizar'
  } = messages;

  return async (connection, rows, message) => {
    await connection.release();
    const { affectedRows, changedRows } = rows;
    if (affectedRows === 1) {
      if (changedRows === 1) {
        return {
          error: false,
          message: updateMessage ?? message,
          data: [],
          hasData: true, // se enconto
          hasChanged: true,  // se modifico 
        };
      } else {
        return {
          error: false,
          message: noChangedMessage,
          data: [],
          hasData: true,
          hasChanged: false,
        };
      };
    } else {
      return {
        error: false,
        message: notFound,
        data: [],
        hasData: false,
        hasChanged: false,
      };
    };
  };
};

const onSuccessDelete = (messages = {}) => {

  const {
    DeleteMessage = 'Se eliminó con éxito',
    notFound = 'No se encontró nada para eliminar'
  } = messages;

  return async (connection, rows, message = DeleteMessage) => {
    await connection.release();
    const { affectedRows, changedRows } = rows
    if (affectedRows === 1) {
      if (changedRows === 1) {
        return {
          error: false,
          message,
          data: [],
          hasData: true,
        };
      } else {
        return {
          error: false,
          message: notFound,
          data: [],
          hasData: false,
        };
      };
    } else {
      return {
        error: false,
        message: notFound,
        data: [],
        hasData: false,
      };
    };
  };
};
const onFailedTransaction = async (
  connection,
  error,
  message = 'Error en la consulta, se ha realizado un rollback'
) => {
  await connection.rollback();
  await connection.release();
  await connection.destroy();
  const { code, errno, sqlMessage } = error
  if (!(code, errno, sqlMessage)) {
    return {
      error: true,
      message,
      data: error.toString()
    }
  } else {
    return {
      error: true,
      message,
      data: {
        code,
        errno,
        sqlMessage,
      }
    }
  }
};

const onFailedContinue = async (
  connection,
  error,
  message = 'Error en la consulta, pero se ha continuado con el proceso'
) => {

  await connection.release();

  const { code, errno, sqlMessage } = error
  if (!(code, errno, sqlMessage)) {
    return {
      error: true,
      message,
      data: error.toString()
    }
  } else {
    return {
      error: true,
      message,
      data: {
        code,
        errno,
        sqlMessage,
      }
    }
  }
};

const executeQuery = async (connection, sqlQuery, options = {}) => {
  const {
    onSuccess = async (connection, rows, message = 'Consulta exitosa') => {
      await connection.release()
      return {
        error: false,
        message,
        data: rows,
      }
    },
    onFail = async (
      connection,
      error,
      message = 'Error en la consulta'
    ) => {
      await connection.release();
      await connection.destroy();
      const { code, errno, sqlMessage } = error
      if (!(code, errno, sqlMessage)) {
        return {
          error: true,
          message,
          data: error.toString()
        }
      } else {
        return {
          error: true,
          message,
          data: {
            code,
            errno,
            sqlMessage,
          }
        }
      }
    },
    onSuccessMessage = 'Consulta exitosa',
    onFailmessage = 'Error en la consulta',
    params = [],
  } = options
  try {
    if (params.length > 0) {
      const [rows] = await connection.execute(sqlQuery, params)
      return await onSuccess(connection, rows, onSuccessMessage)
    } else {
      const [rows] = await connection.execute(sqlQuery)
      return await onSuccess(connection, rows, onSuccessMessage)
    }
  } catch (error) {
    console.error(error)
    return await onFail(connection, error, onFailmessage)
  }
}

const releaseConnectionRollback = async ({ connection, data }) => {
  await connection.rollback();
  await connection.release();
  await connection.destroy();
  return data ?? {
    error: true,
    message: 'A ocurrido un error, se ha realizado un rollback',
    data: null
  }
}

module.exports = {
  getPoolConnection,
  getConnection,
  executeQuery,
  onSuccessAsObject,
  onSuccessAsArray,
  onSuccessUpdate,
  onSuccessDelete,
  onFailedTransaction,
  onFailedContinue,
  releaseConnectionRollback
};
