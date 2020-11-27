const os = require('os');
const { DateTime } = require('luxon');
const axios = require('axios');

/**
 * @typedef {object} OperationLog
 * @property {function} addMessage 新增異動內容
 * @property {function} getMessage 取得異動內容
 * @property {function} hasMessage 是否有異動內容
 * @property {function} save 執行儲存
 */

/**
 * @param {KoaContext} ctx
 * @param {object} gatewayConfig
 * @return {OperationLog}
 */
function OperationLogger(ctx, gatewayConfig) {
  const request = gatewayConfig
    ? axios.create(gatewayConfig)
    : console.log;

  return function Log(tableName, majorKey) {
    const {
      url,
      method,
    } = ctx;

    const log = {
      uri: url,
      method,
      client_ip: ctx.get('x-client-ip') || ctx.ip,
      session_id: ctx.get('session-id') || '',
      domain: ctx.get('domain') || 0,
      server_name: os.hostname(),
      major_key: '',
      message: [],
    };

    log.table_name = tableName;
    log.major_key = typeof majorKey === 'string'
      ? majorKey
      : Object.keys(majorKey).map((key) => `@${key}:${majorKey[key]}`).join(', ');

    /**
     * 新增異動內容
     *
     * @param {string} field 欄位名稱
     * @param {any} oldValue 舊資料
     * @param {any} [newValue] 新資料
     * @return {OperationLog}
     */
    function addMessage(field, ...values) {
      let [oldValue, newValue = null] = values;

      if (typeof oldValue === 'boolean') {
        oldValue = oldValue.toString();
      }

      if (typeof newValue === 'boolean') {
        newValue = newValue.toString();
      }

      if (oldValue instanceof DateTime) {
        oldValue = oldValue.toString();
      }

      if (newValue instanceof DateTime) {
        newValue = newValue.toString();
      }

      if (typeof oldValue === 'object') {
        oldValue = JSON.stringify(oldValue);
      }

      if (typeof newValue === 'object') {
        newValue = JSON.stringify(newValue);
      }

      const message = values.length === 1
        ? `${field}:${oldValue}`
        : `${field}:${oldValue}=>${newValue}`;

      log.message.push(message);

      return log;
    }

    /**
     * 取得異動內容
     *
     * @return {string}
     */
    function getMessage() {
      return log.message.join(', ');
    }

    /**
     * 是否有異動內容
     *
     * @return {boolean}
     */
    function hasMessage() {
      return log.message.length > 0;
    }

    /**
     * 攤平
     *
     * @return {object}
     */
    function toObject() {
      return {
        ...log,
        message: getMessage(),
      };
    }

    /**
     * 執行儲存
     */
    async function save() {
      const run = async () => {
        await request({
          url: '/api/kafka/producer',
          method: 'post',
          data: {
            topic: 'log.queue.operation_log',
            message: JSON.stringify(toObject()),
          },
        });
      };

      setTimeout(run, 0);
    }

    return {
      addMessage,
      getMessage,
      hasMessage,
      save,
    };
  };
}

module.exports = OperationLogger;

/**
 * @param {object} config
 * @param {object} config.api_gateway
 * @return {KoaMiddleware}
 */
module.exports.middleware = function Logger({ api_gateway: gwConfig }) {
  return async (ctx, next) => {
    ctx.state.operation_logger = OperationLogger(ctx, gwConfig);

    await next();
  };
};
