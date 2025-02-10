const sqlGenerator = function (baseRow) {
  this.baseRow = baseRow || {};
  this.row = {};
  this.columns = [];
  this.values = [];
  this.transformers = {};
  this.filter = function (dataObject, options = {}) {
    const { hasAttrAsAlias = false } = options;
    for (const property in dataObject) {
      // si el objeto tiene la propiedad de objeto base
      if (Object.prototype.hasOwnProperty.call(this.baseRow, property)) {   
        if ( hasAttrAsAlias || this.baseRow[property] == null) {
          this.row[property] = dataObject[property];
        } else {
          const newProperty = this.baseRow[property];
          this.row[newProperty] = dataObject[property];
        }
      }
    }
    this.transformAll();
    return this.row;
  };

  this.setFilter = function (filter) {
    this.filter = filter;
  };

  this.isEmpty = function () {
    return Object.keys(this.row).length === 0;
  };

  this.separe = function () {
    this.columns = Object.keys(this.row);
    this.values = Object.values(this.row);
    return [this.columns, this.values];
  };

  this.columnsJoin = function (separator = ", ", prefix = "") {
    this.separe();
    return this.columns.map((col) => `${prefix}${col}`).join(separator);
  };

  this.getValues = function () {
    this.separe();
    return this.values;
  };

  this.getQuestionMarks = function () {
    this.separe();
    return Array(this.columns.length).fill("?").join(", ");
  };

  this.setTransformer = function (prop, transformer) {
    this.transformers[prop] = transformer;
  };

  this.transformAll = function () {
    for (const key in this.transformers) {
      if (Object.prototype.hasOwnProperty.call(this.row, key)) {
        const oldValue = this.row[key];
        const transformer = this.transformers[key];
        const newValue = transformer(oldValue, this.row);
        this.row[key] = newValue;
      }
    }
  };

  this.set = function (pro, value) {
    if (Object.prototype.hasOwnProperty.call(this.baseRow, pro)) {
      if (Object.prototype.hasOwnProperty.call(this.transformers, pro)) {
        const transformer = this.transformers[pro];
        value = transformer(value, this.row);
      }
      return (this.row[pro] = value);
    }
    return value;
  };

  this.rawSet = function (pro, value) {
    if (Object.prototype.hasOwnProperty.call(this.transformers, pro)) {
      const transformer = this.transformers[pro];
      value = transformer(value, this.row);
    }
    return (this.row[pro] = value);
  };

  this.getProxy = function () {
    const handlerProxy = {
      set(obj, prop, value) {
        return obj.set(prop, value);
      },
    };
    return new Proxy(this, handlerProxy);
  };

  this.setRawRow = function (row) {
    this.row = row;
    this.baseRow = row;
  };

  this.genWhere = function (prefix = "", operathor = "=", glue = " AND ") {
    if (this.isEmpty()) {
      return "";
    }
    return this.columnsJoin(` ${operathor} ? ${glue} `, prefix) + " = ?";
  };

  this.genUpdateCol = function (glue = ", ") {
    if (this.isEmpty()) {
      return "";
    }
    return this.columnsJoin(` = ?${glue} `) + " = ?";
  };
};

sqlGenerator.genSelect = (columns = {}, options = {} ) => {
  const {prefix = "", glue = ", ", hasAttrAsAlias = true} = options;
  const selectCols = [];
  for (const col in columns) {
    if (columns[col] !== null) {
      if (hasAttrAsAlias) {
        selectCols.push(`${prefix}${columns[col]} AS ${col}`);
      }else{
        selectCols.push(`${prefix}${col} AS '${columns[col]}'`);
      }
    } else {
      selectCols.push(`${prefix}${col}`);
    }
  }
  return selectCols.join(glue);
};

module.exports = { sqlGenerator };
