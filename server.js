const moment = require('moment');
const http = require('http');
const express = require('express');
const app = express();
const bots = require('./bot-manager.js');

app.get('/', function(request, response) {
  console.log(moment().utcOffset(9).format('YYYY/MM/DD HH:mm:ss') + ' Ping Received');
  response.sendStatus(200);
});

const port = process.env.PORT || 3000;
var listener = app.listen(port, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

const url = new URL(process.env.URL);
url.port = port;
setInterval(() => {
  http.get(url);
}, 280000);
