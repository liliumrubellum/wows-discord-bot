const moment = require('moment');
const http = require('http');
const express = require('express');
const app = express();
const bots = require('./bot-manager.js');

app.get('/', function (request, response) {
  console.log(moment().utcOffset(Number(process.env.LOCAL_TIME_OFFSET)).format('YYYY/MM/DD HH:mm:ss') + ' Ping Received');
  response.sendStatus(200);
});

const port = process.env.PORT || 3000;
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

//const url = new URL(process.env.URL);
//url.port = port;
setInterval(() => {
  http.get(process.env.URL);
}, 280000);
