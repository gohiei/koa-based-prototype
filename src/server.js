/* eslint-disable global-require */
const Koa = require('koa');
const fs = require('fs');

function initialApp(config) {
  const app = new Koa();

  require('./core/logger')(app, config);
  require('./lib/error_logger')(app, config);
  require('./lib/access_logger')(app, config);
  require('./lib/post_logger')(app, config);
  require('./lib/mysql')(app, config);
  require('./lib/redis')(app, config);
  require('./core/request')(app, config);
  require('./lib/operation_logger')(app, config);
  require('./controller')(app, config);

  return app;
}

const env = process.env.NODE_ENV || 'development';
const isStandalone = !(module.parent || env === 'test');

/* istanbul ignore if */
if (isStandalone) {
  const config = require('config');
  const app = initialApp(config);

  const lon = config.listen_on;
  const server = app.listen(lon, () => {
    if ('path' in lon && fs.existsSync(lon.path)) {
      fs.chmodSync(lon.path, 0o777);
    }
  });

  app.emit('server.onCreated', server);
}

if (!isStandalone) {
  module.exports = (config) => initialApp(config);
}
