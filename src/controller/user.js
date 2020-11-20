const { DateTime } = require('luxon');

/**
 * @typedef {import('koa-router')} KoaRouter
 *
 * @param {KoaRouter} router
 */
function UserController(router) {
  /**
   * @api PUT /user 編輯使用者
   * @apiGroup User
   * @apiName edit-user
   *
   * @apiParam {integer} domain
   * @apiParam {string} username
   * @apiParam {boolean} enable
   * @apiParam {boolean} bankrupt
   * @apiParam {boolean} locked
   * @apiParam {boolean} tied
   * @apiParam {string} last_login ISO8601
   */
  router.put('/user', async (ctx) => {
    const {
      request,
      operation_logger: operationLogger,
      execution_logger: executionLogger,
    } = ctx.state;
    const domain = request.getInteger('domain');
    const username = request.getString('username');
    const enable = request.getBoolean('enable');
    const bankrupt = request.getBoolean('bankrupt');
    const locked = request.getBoolean('locked');
    const tied = request.getBoolean('tied');
    const lastLogin = request.getDateTime('last_login');

    const db = ctx.database();
    const { User } = db;

    const user = await User.findOne({
      where: { username, domain },
    });

    if (!user) {
      ctx.throw(400, { message: 'No user found', code: '100001' });
    }

    const opLog = operationLogger('user', user.id);
    const exLog = executionLogger('user', user.id, user.username);

    if (request.has('enable') && user.enable !== enable) {
      opLog.addMessage('enable', user.enable, enable);
      exLog.addMessage('user@:ENABLE', user.enable, enable);
      user.enable = !!enable;
    }

    if (request.has('bankrupt') && user.bankrupt !== bankrupt) {
      opLog.addMessage('bankrupt', user.bankrupt, bankrupt);
      exLog.addMessage('user@:BANKRUPT', user.bankrupt, bankrupt);
      user.bankrupt = !!bankrupt;
    }

    if (request.has('locked') && user.locked !== locked) {
      opLog.addMessage('locked', user.locked, locked);
      exLog.addMessage('user@:LOCKED', user.locked, locked);
      user.locked = !!locked;
    }

    if (request.has('tied') && user.tied !== tied) {
      opLog.addMessage('tied', user.tied, tied);
      exLog.addMessage('user@:TIED', user.tied, tied);

      user.tied = !!tied;
      user.tiedAt = tied ? DateTime.local().toString() : null;
    }

    if (request.has('last_login') && user.lastLogin.valueOf() !== lastLogin.valueOf()) {
      opLog.addMessage('last_login', user.lastLogin, lastLogin);
      exLog.addMessage('user@:LAST_LOGIN', user.lastLogin, lastLogin);
      user.lastLogin = lastLogin;
    }

    await user.save();

    if (opLog.hasMessage()) {
      opLog.save();
    }

    if (exLog.hasMessage()) {
      exLog.save();
    }

    ctx.body = {
      result: 'ok',
      ret: user.toArray,
    };
  });

  /**
   * @api GET /users 取得使用者列表
   * @apiGroup User
   * @apiName get-users
   *
   * @apiParam {integer} domain
   * @apiParam {string} username
   * @apiParam {boolean} enable
   * @apiParam {integer} first_result
   * @apiParam {integer} max_results
   */
  router.get('/users', async (ctx) => {
    const { request } = ctx.state;
    const domain = request.getInteger('domain');
    const username = request.get('username');
    const enable = request.getBoolean('enable');
    const firstResult = request.getInteger('first_result', 0);
    const maxResults = request.getInteger('max_results', 20);

    const params = { domain };

    if (request.has('username')) {
      params.username = username;
    }

    if (request.has('enable')) {
      params.enable = enable;
    }

    const db = ctx.database();
    const users = await db.User.findAll({
      where: params,
      offset: firstResult,
      limit: maxResults,
    });

    const ret = users.map((u) => u.toArray);

    ctx.body = {
      result: 'ok',
      ret,
    };
  });
}

module.exports = (router) => UserController(router);
