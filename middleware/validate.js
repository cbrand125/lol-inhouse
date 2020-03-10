const users = require('../models/users.model');

module.exports = async (request, response, next) => {
  const auth = request.headers.authorization;
  if (!auth) return response.end(401);
  const token = auth.split(' ')[1];
  try {
    const id = await users.verify(token);
    if (!id) {
      response.sendStatus(401);
    } else {
      request.body.cookie = token;
      request.body.userid = id;
      next();
    }
  } catch (err) {
    response.sendStatus(401);
  }
};