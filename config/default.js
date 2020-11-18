const path = require('path');

module.exports = {
  project: {
    name: 'koa-based-prototype',
    api_prefix: '/api/p-based',
    log_dir: path.join(__dirname, '../logs/'),
    sequelize_model_dir: path.join(__dirname, '../src/models/'),
    controller_dir: path.join(__dirname, '../src/controller/'),
    locale_dir: path.join(__dirname, '../src/locale/'),
  },
  listen_on: {
    // port: 3071,
    // host: '0.0.0.0'
    // path: '/tmp/backend.sock'
  },
  // @see https://github.com/axios/axios#request-config
  api_gateway: null,
  redis: {
    default: {
      ioredis: null,
      pool: {
        max: 50,
        min: 5,
        acquireTimeoutMillis: 5000,
        evictionRunIntervalMillis: 30000,
        softIdleTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
      },
    },
  },
  sequelize: {
    default: {
      database: null,
      username: null,
      password: null,
      dialect: 'mysql',
      port: 3306,
      replication: {
        read: [
          { host: '127.0.0.1' },
        ],
        write: { host: '127.0.0.1' },
      },
      pool: {
        max: 20,
        min: 2,
        idle: 30000,
      },
      dialectOptions: {
        useUTC: false, // for reading
        // dateStrings: true,
        // typeCast: true,
      },
      timezone: 'Asia/Taipei', // for writing
      logging: false,
    },
  },

  // @see https://www.i18next.com/overview/configuration-options
  i18next: {
    ns: ['common', 'user'],
    nsSeparator: '@:',
    defaultNS: 'common',
    fallbackLng: 'en',
    lowerCaseLng: true,
    preload: ['zh-tw', 'zh-cn', 'en'],
    lookupCookie: 'lng',
    lookupQuerystring: 'lng',
  },
};
