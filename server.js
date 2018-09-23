//const bots = require('./bot-manager.js');
// var moment = require('moment');
// var http = require('http');
// var express = require('express');
// var app = express();

// app.get('/', function(request, response) {
//   console.log(moment().format('YYYY/MM/DD HH:mm:ss') + ' Ping Received');
//   response.sendStatus(200);
// });

// var listener = app.listen(process.env.PORT, function() {
//   console.log('Your app is listening on port ' + listener.address().port);
// });

// setInterval(() => {
//   let url = new URL(process.env.URL);
//   url.port = process.env.PORT;
//   http.get(url);
// }, 280000);


const { callApi } = require('./bot-util.js');

callApi('clans/list', { search: 'lily', page_no: 1 })
.then(res => {
  console.log('then');
  console.log(res);
})
.catch(console.error)
