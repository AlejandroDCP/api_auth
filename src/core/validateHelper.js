import { validationResult } from 'express-validator'

const validateResult = (req, res, next) => {
  try {
    validationResult(req).throw()
    next()
  } catch (err) {
    const { errors } = err
    const message = errors.map((currentValue) => {
      return `el campo [${currentValue.param}] no es valido porque "${currentValue.msg}" y el valor es "${currentValue.value}"`
    })
    return res.status(400).json({
      error: false,
      message: `Ocurrio un o varios errores en la validacion de los datos, ${message.join(', ')}`,
      data: { errors: err.errors },
    })
  }
}

module.exports = { validateResult }
