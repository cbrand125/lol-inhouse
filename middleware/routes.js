const express = require('express');
const calculator = require('../controllers/calc.controller');

const router = express.Router();

router.get('/', (request, response, next) => {
  response.send('Welcome to MTG Calculator');
});

router.get('/api', (request, response, next) => {
  response.send('Welcome to the MTG Calculator API!');
});

/* calculator routes */
router.get('/api/calculate', calculator.getCalculation);
router.post('/api/calculate', calculator.calculateForEachColor);

module.exports = router;
