const { calculate, calculateMultipleColors } = require('../models/calc.model');

exports.getCalculation = async ({ query }, response, next) => {
  try {
    const calculation = await calculate(query);
    return response.status(200).send(calculation);
  } catch (err) {
    next(err);
  }
};

exports.calculateForEachColor = async ({ body }, response, next) => {
  try {
    const calculation = await calculateMultipleColors(body);
    return response.status(200).send(calculation);
  } catch (err) {
    next(err);
  }
};
