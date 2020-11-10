const os = require('os');

function OperationLog(ctx) {
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

    function addMessage(field, ...values) {
      let [oldValue, newValue = null] = values;

      if (typeof oldValue === 'boolean') {
        oldValue = oldValue.toString();
      }
    }

    return {
      create,
    };
  };
}

module.exports = (app, config) => {
  app.use(async (ctx, next) => {
    ctx.state.operation_logger = OperationLog(ctx);
  });
  app.context.operation_logger = OperationLog();
};
