/* eslint-disable global-require */
const Koa = require('koa');
const fs = require('fs');

class App {
  constructor(config) {
    this.config = config;
    this.app = new Koa();
    this.modules = new Set();

    this.loadBasic();
  }

  getKoaApp() {
    return this.app;
  }

  use(callback) {
    return this.app.use(callback);
  }

  listen(...args) {
    return this.app.listen(...args);
  }

  emit(...args) {
    return this.app.emit(...args);
  }

  /**
   * 開始執行(支援API)
   */
  start() {
    const { app, config } = this;

    require('./core/request')(app, config);
    require('./controller')(app, config);
  }

  /**
   * Load module
   *
   * @param {string[]} modules Modules (mysql, redis, operation_logger, execution_logger, apidoc)
   */
  loadModules(modules = []) {
    const { app, config } = this;

    if (modules.includes('mysql')) {
      require('./lib/mysql')(app, config);
      this.modules.add('mysql');
    }

    if (modules.includes('redis')) {
      require('./lib/redis')(app, config);
      this.modules.add('redis');
    }

    if (modules.includes('operation_logger')) {
      const md = require('./lib/operation_logger').middleware;
      app.use(md(config));

      this.modules.add('operation_logger');
    }

    if (modules.includes('execution_logger')) {
      const md = require('./lib/execution_logger').middleware;
      app.use(md(config));

      this.modules.add('execution_logger');
    }

    if (modules.includes('apidoc')) {
      const md = require('./lib/apidoc')(config);
      app.use(md);

      this.modules.add('apidoc');
    }
  }

  /**
   * @private
   */
  loadBasic() {
    const { app, config } = this;

    const Logger = require('./core/logger');
    app.context.logger = Logger(app, config);

    const i18n = require('./core/i18n')(config);
    app.use(i18n);

    require('./lib/error_logger')(app, config);

    const al = require('./lib/access_logger')(app, config);
    app.use(al);

    const pl = require('./lib/post_logger')(app, config);
    app.use(pl);

    this.modules.add('logger', 'i18n', 'error_logger', 'access_logger', 'post_logger', 'apidoc');
  }
}

const env = process.env.NODE_ENV || 'development';
const isStandalone = !(module.parent || env === 'test');

/* istanbul ignore if */
if (isStandalone) {
  const config = require('config');
  const app = new App(config);

  const lon = config.listen_on;
  const server = app.listen(lon, () => {
    if ('path' in lon && fs.existsSync(lon.path)) {
      fs.chmodSync(lon.path, 0o777);
    }
  });

  app.emit('server.onCreated', server);

  app.loadModules(['mysql', 'redis', 'operation_logger', 'execution_logger', 'apidoc']);
  app.start();
}

if (!isStandalone) {
  module.exports = (config) => (new App(config)).getKoaApp();
}
