const ClientFriendlyError = require('../utils/ClientFriendlyError');

const errorHandler = (err, request, response, next) => {
  if (err instanceof ClientFriendlyError) {
    return response.status(err.status).send(err.message);
  }
  response.status(500).send('Server Error');
};
module.exports = errorHandler;
