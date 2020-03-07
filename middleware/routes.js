const express = require('express');
const stats = require('../controllers/stats.controller');
const users = require('../controllers/users.controller');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', (request, response, next) => {
  response.send('Welcome to League In-House Tracker');
});

router.get('/api', (request, response, next) => {
  response.send('Welcome to the League In-House Tracker API!');
});

/* routes */
router.put('/api/stats/game', validate, stats.putGameData);
router.get('/api/stats/tournament', stats.getTournamentStats);

router.post('/api/users/signup', users.postUser);
router.post('/api/users/login', users.postUserAuthentication);
router.delete('/api/users/logout', validate, users.deleteSession);
router.delete('/api/users/logout/all', validate, users.deleteAllSessions);

module.exports = router;
