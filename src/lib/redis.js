const { DateTime } = require('luxon');
const Redis = require('ioredis');
const GenericPool = require('generic-pool');

/**
 * @param {object} config 單一資料庫連線設定
 * @param {function} errorHandler 錯誤處理函式
 */
function MyRedis(config, errorHandler) {
  const { ioredis: ioredisOptions, pool: poolOptions } = config;

  if (!ioredisOptions || !poolOptions) {
    return;
  }

  const factory = {
    create: () => {
      const redis = new Redis(ioredisOptions);

      redis.on('error', errorHandler);

      return redis;
    },
    destroy: (client) => client.quit(),
  };

  const pool = GenericPool.createPool(factory, poolOptions);

  const isAlive = () => !!pool;
  const acquire = () => pool.acquire;
  const release = (client) => pool.release(client);
  const close = () => pool.drain().then(() => pool.clear());

  return {
    isAlive,
    acquire,
    release,
    close,
  };
}

/**
 * @typedef {import('koa')} Koa
 *
 * @param {Koa} app
 * @param {object} config
 * @param {object} config.redis 全部Redis連線設定
 * @return {object}
 */
module.exports = (app, { redis: redisConfigs }) => {
  const { create } = app.context.logger;
  const logger = create(
    'error_logger',
    'error.log',
  );

  const redis = {};

  Object.keys(redisConfigs).forEach((name) => {
    const errorHandler = (err) => {
      logger.error(
        '%s [Redis][%s] %s %s',
        DateTime.local().toString(),
        name,
        err.toString(),
        err.stack,
      );
    };

    const conn = MyRedis(redisConfigs[name], errorHandler);

    if (conn) {
      redis[name] = conn;
    }
  });

  // eslint-disable-next-line no-param-reassign
  app.context.redis = (name = 'default') => {
    if (name in redis) {
      return redis[name];
    }

    throw new Error(`Non-exists redis: ${name}`);
  };
};
