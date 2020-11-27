const i18next = require('i18next');
const backend = require('i18next-fs-backend');

/**
 * @param {object} config
 * @return {KoaMiddleware}
 */
module.exports = (config) => {
  const {
    project: { locale_dir: baseDir0 },
    i18next: i18nextConfig,
  } = config;

  const baseDir = baseDir0.substr(-1) === '/' ? baseDir0.substr(0, baseDir0.length - 1) : baseDir0;

  i18next
    .use(backend)
    .init({
      ...i18nextConfig,
      backend: {
        loadPath: `${baseDir}/{{lng}}/{{ns}}.yaml`,
        addPath: `${baseDir}/{{lng}}/{{ns}}.missing.yaml`,
      },
    });

  const detect = (ctx) => {
    if (i18nextConfig.lookupQuerystring in ctx.query) {
      return ctx.query[i18nextConfig.lookupQuerystring];
    }

    if (ctx.cookies.get(i18nextConfig.lookupCookie)) {
      return ctx.cookies.get(i18nextConfig.lookupCookie);
    }

    const { fallbackLng } = i18nextConfig;

    if (typeof fallbackLng === 'string') {
      return fallbackLng;
    }

    if (Array.isArray(fallbackLng)) {
      return fallbackLng[0];
    }

    if (fallbackLng.default && Array.isArray(fallbackLng.default)) {
      return fallbackLng.default[0];
    }

    return undefined;
  };

  return async (ctx, next) => {
    let lng = ctx.state.language;

    const i18n = i18next.cloneInstance({ initImmediate: false });

    if (!lng) {
      lng = detect(ctx);
    }

    ctx.state.language = lng;

    const t = i18n.t.bind(i18n);

    ctx.state.i18n = i18n;
    ctx.state.t = (...args) => {
      if (args.length === 1) {
        args.push({});
      }

      args
        .filter((value) => (typeof value === 'object' && !Array.isArray(value)))
        .forEach((value) => {
          // eslint-disable-next-line no-param-reassign
          value.lng = lng;
        });

      return t(...args);
    };

    await next();
  };
};
