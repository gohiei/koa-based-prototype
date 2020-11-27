const serve = require('koa-static');
const mount = require('koa-mount');

/**
 * API Documentation
 *
 * @param {object} config
 * @param {object} config.project
 * @param {object} config.project.doc_prefix
 * @param {string} config.project.doc_dir
 * @return {KoaMiddleware}
 */
module.exports = (config) => {
  const { doc_prefix: docPrefix, doc_dir: docDir } = config.project;

  return mount(
    docPrefix,
    serve(docDir),
  );
};
