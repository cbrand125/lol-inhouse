const users = require('../models/users.model');

module.exports = async (request, response, next) => {
  const auth = request.headers.authorization;
  if (!auth) return response.end(401);
  const token = auth.split(' ')[1];
  try {
    if (!(await users.verify(token))) {
      response.sendStatus(401);
    } else {
      request.body.cookie = token;
      next();
    }
  } catch (err) {
    response.sendStatus(401);
  }
};