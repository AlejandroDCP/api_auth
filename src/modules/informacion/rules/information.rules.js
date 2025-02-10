import { integer, inQueryOptionals } from '../../shared/rules/commons.rules'

const informationSchema = {
  idModulo: {
    ...integer,
    ...inQueryOptionals,
  },
}

module.exports = {
  informationSchema,
  schemaModulos: {
    idIntranet: {
      in: ['query'],
      ...integer,
    },
  },
  schemaMenus: {
    idIntranet: {
      in: ['query'],
      ...integer,
    },
    modulo: {
      in: ['query'],
      ...integer,
    },
  },
  schemaSubmenus: {
    idIntranet: {
      in: ['query'],
      ...integer,
    },
    modulo: {
      in: ['query'],
      ...integer,
    },
    menu: {
      in: ['query'],
      ...integer,
    },
  },
}
