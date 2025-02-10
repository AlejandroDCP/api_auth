import {
  string,
  integer,
  ifCondition,
  isBool
} from "../../shared/rules/commons.rules";

const passwordAutenticacionSchema = {
  pass: {
    ...string,
    notEmpty: {
      errorMessage: "El password es requerido"
    }
  },
  user: {
    ...string,
    notEmpty: {
      errorMessage: "El usuario es requerido"
    }
  },
  id_modulo: {
    ...ifCondition,
    ...integer
  },
  externo: {
    ...ifCondition,
    ...string
  }
};

const schemaUpdatePassword = {
  currentPassword: {
    ...string
  },
  newPassword: {
    ...string
  },
  confirmNewPassword: {
    ...string
  },
  externo: {
    ...isBool,
    optional: true
  }
};


module.exports = {
  passwordAutenticacionSchema,
  schemaUpdatePassword,
};
