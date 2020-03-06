const statsData = require('../models/stats.model');

exports.getTournamentStats = async ({ query }, response, next) => {
  try {
    const tournamentStats = await statsData.retrieveTournamentStats(query);
    return response.status(200).send(tournamentStats);
  } catch (err) {
    next(err);
  }
};

exports.getPlayerStats = async ({ query }, response, next) => {
  try {
    const playerStats = await statsData.retrievePlayerStats(query);
    return response.status(200).send(playerStats);
  } catch (err) {
    next(err);
  }
};

exports.putGameData = async ({ query }, response, next) => {
  try {
    await statsData.saveGameData(query);
    return response.status(200);
  } catch (err) {
    next(err);
  }
};