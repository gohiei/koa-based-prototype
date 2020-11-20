/* eslint-disable quote-props */
const koaBody = require('koa-body');
const qs = require('qs');
const { DateTime } = require('luxon');

/**
 * @typedef HttpRequest
 * @type {object}
 * @property {boolean} has 是否存在
 * @property {number|boolean|string} get 取得值
 * @property {string} getString 取得字串
 * @property {string} str 同 getString
 * @property {number} getNumber 取得數字
 * @property {number} num 同 getNumber
 * @property {integer} getInteger 取得整數
 * @property {integer} getInt 同 getInteger
 * @property {integer} int 同 getInteger
 * @property {boolean} getBoolean 取得布林值
 * @property {boolean} bool 同 getBoolean
 * @property {DateTime} getDateTime 取得日期時間
 * @property {DateTime} datetime 同 getDateTime
 */

/**
 * Request 處理物件
 *
 * @param {import('koa').Context} ctx
 * @return {HttpRequest}
 */
function Request(ctx) {
  const { query, form, files } = ctx.state;

  function get(name, defaultValue) {
    if (files && (name in files)) {
      return files[name];
    }

    if (form && (name in form)) {
      return form[name];
    }

    if (query && (name in query)) {
      return query[name];
    }

    return defaultValue;
  }

  function has(name) {
    return get(name) !== undefined;
  }

  const booleanMap = {
    '0': false,
    '1': true,
    'false': false,
    'true': true,
  };

  function getBoolean(name, defaultValue = false) {
    const value = get(name, defaultValue);

    if (value === undefined || value === null) {
      return Boolean(defaultValue);
    }

    if (typeof value === 'string') {
      return (value in booleanMap) ? booleanMap[value] : true;
    }

    return Boolean(value);
  }

  function getNumber(name, defaultValue = 0) {
    let value = get(name, defaultValue);

    if (value === undefined || value === null) {
      return defaultValue;
    }

    value = Number(value);

    return Number.isNaN(value) ? getNumber(defaultValue) : value;
  }

  function getInteger(name, defaultValue = 0) {
    let value = get(name, defaultValue);

    value = Number.parseInt(value, 10);

    return Number.isNaN(value) ? getNumber(defaultValue) : value;
  }

  function getString(name, defaultValue = '') {
    const value = get(name, defaultValue);

    if (value === undefined || value === null) {
      return String(defaultValue);
    }

    return (typeof value === 'string') ? value : String(value);
  }

  function getDateTime(name, defaultValue) {
    const value = get(name, defaultValue);

    if (value === undefined || value === null) {
      return defaultValue;
    }

    return DateTime.fromISO(value);
  }

  /**
   * @type {HttpRequest}
   */
  return {
    getBoolean,
    getInteger,
    getNumber,
    getString,
    getInt: getInteger,
    getDateTime,
    int: getInteger,
    bool: getBoolean,
    num: getNumber,
    str: getString,
    datetime: getDateTime,
    get,
    has,
  };
}

module.exports = (app) => {
  app.use(koaBody({
    parsedMethods: ['POST', 'PUT', 'GET', 'DELETE'],
    multipart: true,
  }));

  app.use(async (ctx, next) => {
    ctx.state.query = qs.parse(ctx.querystring, { ignoreQueryPrefix: true });
    ctx.state.form = ctx.request.body;
    ctx.state.files = ctx.request.files;

    await next();
  });

  app.use(async (ctx, next) => {
    const req = Request(ctx);

    ctx.state.request = req;
    ctx.state.req = req;

    await next();
  });
};
