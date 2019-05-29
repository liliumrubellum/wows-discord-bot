const { AkairoClient } = require('discord-akairo');

const assistant = new AkairoClient({
  prefix: '!',
  commandDirectory: './assistant/commands/',
  listenerDirectory: './assistant/listeners/'
});

const wows = new AkairoClient({
  prefix: '?',
  commandDirectory: './wows/commands/',
  listenerDirectory: './wows/listeners/'
});

assistant.login(process.env.ASSISTANT_TOKEN);
wows.login(process.env.WOWS_TOKEN);
