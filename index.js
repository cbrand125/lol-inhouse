const express = require('express');
const cors = require('cors');
require('dotenv').config();
const logger = require('./middleware/logger');
const router = require('./middleware/routes');
const errorHandler = require('./middleware/errorhandler');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(logger);
app.use(router);
app.use(errorHandler);

app.listen(process.env.PORT || port);
