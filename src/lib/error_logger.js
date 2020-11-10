const { DateTime } = require('luxon');

/**
 * Error Logger
 *
 * @param {object} app Koa's Application
 */
module.exports = (app) => {
  const { create } = app.context.logger;
  const logger = create(
    'error_logger',
    'error.log',
  );

  app.on('error', (err) => {
    setTimeout(() => {
      logger.error(
        '%s [%s] %s %s',
        DateTime.local().toString(),
        'App',
        err.toString(),
        err.stack,
      );
    }, 0);
  });
};
