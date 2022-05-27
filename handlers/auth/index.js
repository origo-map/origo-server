const express = require('express');
const authorize = require('./authorize');
const access_token = require('./access_token');
const authRouter = express.Router();

authRouter.get('/authorize', authorize);
authRouter.post('/access_token', access_token);

module.exports = authRouter;
