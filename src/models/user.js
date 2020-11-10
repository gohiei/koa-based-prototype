// eslint-disable-next-line camelcase
const { inet_pton, inet_ntop } = require('inet_xtoy');

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 */
/**
 * @param {Sequelize} sequelize
 * @param {DataTypes} DataTypes
 */
module.exports = (sequelize, DataTypes) => {
  const name = 'User';
  const options = {
    tableName: 'user',
    comment: '使用者',
  };
  const attributes = {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '編號',
    },

    parentId: {
      type: DataTypes.BIGINT.UNSIGNED,
      comment: '代理編號',
    },

    upperId: {
      type: DataTypes.BIGINT.UNSIGNED,
      comment: '直屬好友編號',
    },

    username: {
      type: DataTypes.STRING(30),
      comment: '帳號',
    },

    domain: {
      type: DataTypes.INTEGER,
      comment: '廳',
    },

    name: {
      type: DataTypes.STRING(100),
      comment: '姓名',
    },

    role: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      comment: '角色(1會員, 2代理, 3客服, 4廳主)',
    },

    enable: {
      type: DataTypes.BOOLEAN,
      comment: '啟用',
    },

    default: {
      type: DataTypes.BOOLEAN,
      comment: '預設',
      field: 'is_default',
    },

    bankrupt: {
      type: DataTypes.BOOLEAN,
      comment: '停權',
    },

    locked: {
      type: DataTypes.BOOLEAN,
      comment: '凍結',
    },

    tied: {
      type: DataTypes.BOOLEAN,
      comment: '鎖定',
    },

    checked: {
      type: DataTypes.BOOLEAN,
      comment: '已校驗',
    },

    failed: {
      type: DataTypes.BOOLEAN,
      comment: '校驗失敗',
    },

    modifiedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
      comment: '最後異動時間',
    },

    blacklistModifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '黑名單最後異動時間',
    },

    tiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '鎖定時間',
    },

    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最後登入時間',
    },

    lastIp: {
      type: DataTypes.STRING(16).BINARY,
      allowNull: true,
      comment: '最後登入IP',
      set(value) {
        this.setDataValue('lastIp', inet_pton(value));
      },
      get() {
        return inet_ntop(this.getDataValue('lastIp'));
      },
    },

    lastCountry: {
      type: DataTypes.STRING(40),
      allowNull: true,
      comment: '最後登入來源國家',
    },

    lastCityId: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: '最後登入來源城市編號',
    },

    lastOnline: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最後在線時間',
    },
  };

  return { name, attributes, options };
};
