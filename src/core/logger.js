const Inflector = require('inflected');
const { DateTime } = require('luxon');
const winston = require('winston');
const path = require('path');
const util = require('util');

/**
 * @param {KoaApp} app
 * @param {object} config
 * @param {object} config.project 專案設定
 * @return {object}
 */
module.exports = function Logger(app, { project }) {
  const loggers = {};

  /**
   * Get a logger by name
   *
   * @param {string} name
   * @return {object}
   */
  const get = (name) => loggers[name];

  /**
   * Create a logger. Return the defined logger if exists.
   *
   * @param {string} name
   * @param {string} filename
   * @return {object}
   */
  const create = (name, filename) => {
    if (name in loggers) {
      return loggers[name];
    }

    const projectName = Inflector.tableize(project.name);
    const finalFilename = path.join(
      project.log_dir,
      util.format('%s_%s_%s', app.env, projectName, filename),
    );

    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.splat(),
        winston.format.simple(),
      ),
      transports: [
        new winston.transports.File({
          filename: finalFilename,
          timestamp: () => DateTime.local().toString(),
        }),
      ],
    });

    loggers[name] = logger;

    return logger;
  };

  return {
    create,
    get,
  };
};
