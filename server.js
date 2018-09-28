const moment = require('moment');
const http = require('http');
const express = require('express');
const app = express();
const bots = require('./bot-manager.js');

app.get('/', function(request, response) {
  console.log(moment().format('YYYY/MM/DD HH:mm:ss') + ' Ping Received');
  response.sendStatus(200);
});

var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

const url = new URL(process.env.URL);
url.port = process.env.PORT;
setInterval(() => {
  http.get(url);
}, 280000);
