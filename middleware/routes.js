const express = require('express');
const stats = require('../controllers/stats.controller');

const router = express.Router();

router.get('/', (request, response, next) => {
  response.send('Welcome to League In-House Tracker');
});

router.get('/api', (request, response, next) => {
  response.send('Welcome to the League In-House Tracker API!');
});

/* routes */
router.get('/api/stats/tournament', stats.getTournamentStats);
router.get('/api/stats/player', stats.getPlayerStats);
router.put('/api/stats/game', stats.putGameData);

module.exports = router;
