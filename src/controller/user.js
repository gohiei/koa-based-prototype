const { DateTime } = require('luxon');

function UserController(router) {
  /**
   * User
   */
  router.put('/user', async (ctx) => {
    const { request } = ctx.state;
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

    if (request.has('enable')) {
      user.enable = !!enable;
    }

    if (request.has('bankrupt')) {
      user.bankrupt = !!bankrupt;
    }

    if (request.has('locked')) {
      user.locked = !!locked;
    }

    if (request.has('tied')) {
      user.tied = !!tied;
      user.tiedAt = tied ? DateTime.local().toString() : null;
    }

    if (request.has('last_login')) {
      user.lastLogin = lastLogin;
      console.log(lastLogin);
    }

    await user.save();

    ctx.body = {
      result: 'ok',
      ret: user.toArray,
    };
  });

  /**
   * Get user list
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
