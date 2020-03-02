const fs = require('fs').promises;
const moment = require('moment');

function logger(request, response, next) {
  fs.appendFile(
    `./logs/${moment().format('DDMMMYYYY')}.txt`,
    `${request.url} was requested at ${moment()}\n`
  ).catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
  });

  next();
}

module.exports = logger;
