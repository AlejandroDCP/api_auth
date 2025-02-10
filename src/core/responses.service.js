import log4js from 'log4js';
const logError = log4js.getLogger("error");

const response500 = (res, error) => {
  logError.error(error);
  return res.status(500).json(error).end();
};
module.exports = {
  response500
};
