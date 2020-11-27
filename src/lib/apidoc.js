const serve = require('koa-static');
const path = require('path');
const mount = require('koa-mount');

/**
 * API Documentation
 *
 * @return {KoaMiddleware}
 */
module.exports = () => mount(
  '/docs',
  serve(path.join(__dirname, '../../doc')),
);
