/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require('fs');
const path = require('path');
const Router = require('koa-router');
const util = require('util');
const { DateTime } = require('luxon');

const basename = path.basename(__filename);

/**
 * @typedef {import('koa')} Koa
 * @param {Koa} app
 * @param {object} config
 * @param {object} config.project
 */
module.exports = (app, { project }) => {
  const logger = app.context.logger.get('error_logger');

  const baseDir = project.controller_dir;

  if (!baseDir) {
    throw new Error('Please setup the project.controller_dir');
  }

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.body = {
        result: 'error',
        msg: err.message,
        code: err.code,
      };

      logger.error(
        '%s [Controller] "%s %s" "%s" %s "%s"',
        DateTime.local().toString(),
        ctx.method,
        ctx.url,
        err.message,
        err.code,
        err.stack,
      );
    }
  });

  const router = new Router({ prefix: project.api_prefix });

  fs
    .readdirSync(baseDir)
    .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
    .forEach((file) => {
      require(path.join(baseDir, file))(router);
    });

  app
    .use(router.routes())
    .use(router.allowedMethods());
};
