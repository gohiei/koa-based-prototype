/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const Inflector = require('inflected');
const { DateTime } = require('luxon');

const basename = path.basename(__filename);

/**
 * @param {string} model放置路徑
 * @param {object} config 單一資料庫連線設定
 * @return {object}
 */
function MySQL(baseDir, config) {
  if (!config.database || !config.username || !config.password) {
    return;
  }

  const db = {};

  const sequelize = new Sequelize(config.database, config.username, config.password, config);

  fs
    .readdirSync(baseDir)
    .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
    .forEach((file) => {
      const {
        name,
        attributes,
        options,
      } = require(path.join(baseDir, file))(sequelize, Sequelize.DataTypes);

      const model = sequelize.define(name, attributes, {
        underscored: true,
        timestamps: false,
        getterMethods: {
          toArray() {
            const old = this.get();
            const obj = {};

            Object.keys(old).forEach((field) => {
              const newField = Inflector.underscore(field);
              const isDate = attributes[field].type instanceof Sequelize.DataTypes.DATE;

              if (isDate) {
                if (!(old[field] instanceof Date)) {
                  obj[newField] = old[field];
                  return;
                }

                obj[newField] = DateTime.fromJSDate(old[field]).toString();
                return;
              }

              obj[newField] = old[field];
            });

            return obj;
          },
        },
        ...options,
      });

      db[model.name] = model;
    });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
}


/**
 * @typedef {import('koa')} Koa
 *
 * @param {Koa} app
 * @param {object} config
 * @param {object} config.project 專案設定
 * @param {object} config.sequelize 全資料庫連線設定
 * @return {object}
 */
module.exports = (app, { project, sequelize: mysqlConfigs }) => {
  const baseDir = project.sequelize_model_dir;

  const db = {};

  Object.keys(mysqlConfigs).forEach((name) => {
    const conn = MySQL(baseDir, mysqlConfigs[name]);

    if (conn) {
      db[name] = conn;
    }
  });

  // eslint-disable-next-line no-param-reassign
  app.context.database = (name = 'default') => {
    if (name in db) {
      return db[name];
    }

    throw new Error(`Non-exists database: ${name}`);
  };
};
