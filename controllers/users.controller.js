const users = require('../models/users.model');

/**
 * Create User
 * @param {Object} req
 * @param {Object} res
 */
exports.postUser = async (req, res) => {
  try {
    const cookie = await users.add(req.body);
    return res.status(201).send(cookie);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

/**
 * Create User Authentication
 * @param {Object} req
 * @param {Object} res
 */
exports.postUserAuthentication = async (req, res) => {
  try {
    const cookie = await users.authenticate(req.body);
    return res.status(201).send(cookie);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

/**
 * Delete one user session
 * @param {Object} req
 * @param {Object} res
 */
exports.deleteSession = async (req, res) => {
  try {
    await users.logout(req.body);
    return res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

/**
 * Delete all user sessions
 * @param {Object} req
 * @param {Object} res
 */
exports.deleteAllSessions = async (req, res) => {
  try {
    await users.logoutAll(req.body);
    return res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};