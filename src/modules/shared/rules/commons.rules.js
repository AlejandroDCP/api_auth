const ifCondition = {
	if: {
		options: (value) => {
			return !(value == "" || value == null);
		}
	}
}

const inQueryOptionals = {
  in: ['query'],
  optional: true
}

const integer = {
  rtrim: { options: [' '] },
  ltrim: { options: [' '] },
  escape: true,
  notEmpty: {
    errorMessage: 'El valor es requerido.'
  },
  isInt: {
    errorMessage: 'Debe ser un número entero.'
  },
  toInt: true
}

const intParameterQueryOptional = {
  ...inQueryOptionals,
  ...integer
}

const idSchema = {
  in: ['params'],
  ...integer
}

const id = {
  id: {
    ...idSchema
  }
}

const isBool = {
  isBoolean: true,
  toBoolean: true,
  errorMessage: 'Debe ser booleano'
}

const isObject = {
  isObject: true,
  errorMessage: 'Debe de ser un objeto'
}

const string = {
  rtrim: { options: [' '] },
  ltrim: { options: [' '] },
  escape: true,
  notEmpty: {
    errorMessage: 'El valor es requerido.'
  },
}

const telefono = {
  ...string,
  isLength: {
    options: {
      min: 10,
      max: 16
    },
    errorMessage: 'El telefono requiere una longitud entre 10 y 16 numeros'
  },
}

const paginacion = {
  limit: {
    ...integer,
    ...inQueryOptionals,
    isIn: {
      options: [[10, 15, 20, 25]],
      errorMessage: 'Debe ser 10, 15, 20 o 25'
    }
  },
  pagina: {
    ...integer,
    ...inQueryOptionals
  },
  busqueda: {
    ...string,
    ...inQueryOptionals
  },
}

const commonsSchema = {
  date: {
    rtrim: { options: [' '] },
    ltrim: { options: [' '] },
    escape: true,
    notEmpty: {
      errorMessage: 'El valor es requerido.'
    },
    isDate: {
      options: {
        format: 'YYYY-MM-DD'
      },
      errorMessage: 'La fecha debe tener el formato YYYY-MM-DD.'
    },
  },
  paginacion,
  string,
  integer,
  idSchema,
  inQueryOptionals,
  intParameterQueryOptional,
  isBool,
  isObject,
  email: {
    rtrim: { options: [' '] },
    ltrim: { options: [' '] },
    escape: true,
    notEmpty: {
      errorMessage: 'El correo no puede estar vacio'
    },
    isEmail: {
      errorMessage: 'El correo no es valido'
    },
  },
  telefono,
  id,
  ifCondition
}

module.exports = commonsSchema
