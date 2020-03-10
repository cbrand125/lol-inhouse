const statsData = require('../models/stats.model');

exports.putGameData = async ({ query }, response, next) => {
  try {
    await statsData.saveGameData(query);
    return response.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

exports.getTournamentStats = async ({ query }, response, next) => {
  try {
    console.log( 'getting' );
    const results = await statsData.retrieveTournament(query);
    return response.status(200).send(results);
  } catch (err) {
    next(err);
  }
};
