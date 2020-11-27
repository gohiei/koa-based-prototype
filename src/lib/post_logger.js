const { DateTime } = require('luxon');

/**
 * Post Logger
 *
 * @param {object} app Koa's Application
 */
module.exports = (app) => {
  const { create } = app.context.logger;
  const logger = create(
    'post_logger',
    'post.log',
  );

  return async (ctx, next) => {
    const startAt = DateTime.local().toString();
    await next();

    const {
      req,
      method,
    } = ctx;

    if (method.toUpperCase() === 'GET') {
      return;
    }

    const reqData = JSON.parse(JSON.stringify(ctx.state.form || {}));

    if (typeof reqData === 'object') {
      Object.keys(reqData)
        .filter((field) => field.endsWith('password'))
        .forEach((field) => {
          const old = (reqData[field] || '').toString();
          reqData[field] = `${old.substr(0, 1)}***${old.substr(-2)}`;
        });
    }

    const resData = JSON.parse(JSON.stringify(ctx.body || {}));

    const url = req.originalUrl || req.url;
    const domain = req.headers.domain || '-';
    const requestId = req.headers.requestid || '-';

    setTimeout(() => {
      const format = '%s "%s %s" %s %s %s';

      logger.info(
        format,
        startAt,
        method,
        url,
        JSON.stringify({ req: reqData, res: resData }),
        domain,
        requestId,
      );
    }, 0);
  };
};
