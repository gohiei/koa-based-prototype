const { DateTime } = require('luxon');

/**
 * Access Logger
 *
 * @param {object} app Koa's Application
 */
module.exports = (app) => {
  const { create } = app.context.logger;
  const logger = create(
    'access_logger',
    'access.log',
  );

  app.use(async (ctx, next) => {
    const startAt = DateTime.local().toString();
    const start = new Date();
    await next();
    const time = new Date() - start;

    const {
      req,
      method,
      status,
      length,
    } = ctx;

    const ip = req.headers['x-real-ip']
      || (req.connection && req.connection.remoteAddress)
      || '-';
    const url = req.originalUrl || req.url;
    const httpVersion = `${req.httpVersionMajor}.${req.httpVersionMinor}`;
    const userAgent = req.headers['user-agent'] || req.headers.user_agent || '-';
    const xForwardedFor = req.headers['x-forwarded-for'] || req.headers.x_forwarded_for || '-';
    const domain = req.headers.domain || '-';
    const requestId = req.headers.requestid || '-';

    setTimeout(() => {
      const format = '%s %s "%s %s HTTP/%s" "%s" "%s" %s %s %s %s %s';

      logger.info(
        format,
        startAt,
        ip,
        method,
        url,
        httpVersion,
        userAgent,
        xForwardedFor,
        status,
        length,
        time,
        domain,
        requestId,
      );
    }, 0);
  });
};
