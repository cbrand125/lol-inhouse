/**
 * Error object containing user friendly message and HTTP status code
 */
class ClientFriendlyError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

module.exports = ClientFriendlyError;
