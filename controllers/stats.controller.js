const statsData = require('../models/stats.model');

exports.putGameData = async ({ query, body }, response, next) => {
  try {
    await statsData.saveGameData(query, body.userid);
    return response.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

exports.getTournamentStats = async ({ query }, response, next) => {
  try {
    const results = await statsData.retrieveTournament(query);
    return response.status(200).send(results);
  } catch (err) {
    next(err);
  }
};
