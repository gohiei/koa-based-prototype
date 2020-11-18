const { DateTime } = require('luxon');
const axios = require('axios');
const util = require('util');
const { inet_pton } = require('inet_xtoy');

/**
 * @typedef {object} ExecutionLog
 * @property {function} addMessage 新增異動內容
 * @property {function} getMessage 取得異動內容
 * @property {function} hasMessage 是否有異動內容
 * @property {function} save 執行儲存
 */

/**
 * @typedef {import('koa').Context} KoaContext
 */

/**
 * @type {ExecutionLog}
 * @param {KoaContext} ctx
 * @param {object} gatewayConfig
 */
function ExecutionLog(ctx, gatewayConfig) {
  const request = gatewayConfig
    ? axios.create(gatewayConfig)
    : console.log;

  /**
   * 執行紀錄
   *
   * @param {string} tableName
   * @param {integer} majorKey
   */
  return function Log(tableName, majorKey, majorName) {
    const { t } = ctx.state;

    const domain = ctx.get('domain') || ctx.get('hosterid') || 0;
    const method = (ctx.get('method') || ctx.method).toUpperCase();
    const itemId = ctx.get('itemid') || 0;
    const ip = ctx.get('x-client-ip') || '0.0.0.0';
    const operator = (ctx.get('operator') || '').trim();

    const prefix = util.format(
      '%s%s [%s]',
      t(`common@:${method}`),
      t(`common@:ITEM_${itemId}`),
      majorName,
    );

    const log = {
      table_name: tableName,
      major_key: majorKey,
      entranced_id: domain,
      method,
      item_id: itemId,
      ip,
      operator,
      country: '',
      city: '',
      city_id: 0,
      message: [],
    };

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
        oldValue = t(`common@:IS_${oldValue.toString()}`);
      }

      if (typeof newValue === 'boolean') {
        newValue = t(`common@:IS_${newValue.toString()}`);
      }

      if (oldValue instanceof Date) {
        oldValue = DateTime.fromJSDate(oldValue);
      }

      if (oldValue instanceof DateTime) {
        oldValue = oldValue.setZone('Etc/GMT+4').toFormat('yyyy-MM-dd HH:mm:ss');
      }

      if (newValue instanceof Date) {
        newValue = DateTime.fromJSDate(newValue);
      }

      if (newValue instanceof DateTime) {
        newValue = newValue.setZone('Etc/GMT+4').toFormat('yyyy-MM-dd HH:mm:ss');
      }

      if (['', null, undefined].includes(oldValue) || (Array.isArray(oldValue) && oldValue.length === 0)) {
        oldValue = t('common@:EMPTY');
      }

      if (['', null, undefined].includes(newValue) || (Array.isArray(newValue) && newValue.length === 0)) {
        newValue = t('common@:EMPTY');
      }

      if (typeof oldValue === 'object') {
        oldValue = JSON.stringify(oldValue);
      }

      if (typeof newValue === 'object') {
        newValue = JSON.stringify(newValue);
      }

      const convField = t(field);

      const message = values.length === 1
        ? convField
        : t('common@:CHANGE_TO', { field: convField, old: oldValue, new: newValue });

      log.message.push(message);

      return log;
    }

    /**
     * 取得異動內容
     *
     * @return {string}
     */
    function getMessage() {
      return `${prefix} ${log.message.join(', ')}`;
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
        ip: Buffer.from(inet_pton(log.ip)).toString('base64'),
      };
    }

    /**
     * 執行儲存
     */
    async function save() {
      const run = async () => {
        const out = await request({
          url: '/api/geoip',
          method,
          params: { ip: log.ip },
        });

        if (out && out.result === 'ok' && out.ret) {
          const geoipData = out.ret;

          log.country = geoipData.country || '';
          log.city = geoipData.city || '';
          log.city_id = geoipData.city_id || 0;
        }

        await request({
          url: '/api/kafka/producer',
          method: 'post',
          data: {
            topic: 'log.queue.execution_log',
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

module.exports = (app, { api_gateway: gwConfig }) => {
  app.use(async (ctx, next) => {
    ctx.state.execution_logger = ExecutionLog(ctx, gwConfig);

    await next();
  });
};
