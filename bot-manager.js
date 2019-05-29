const { AkairoClient } = require('discord-akairo');

const assistant = new AkairoClient({
  prefix: '!',
  ownerID: process.env.ASSISTANT_OWNER,
  commandDirectory: './assistant/commands/',
  listenerDirectory: './assistant/listeners/'
});

const wows = new AkairoClient({
  prefix: '?',
  ownerID: process.env.WOWS_OWNER,
  commandDirectory: './wows/commands/',
  listenerDirectory: './wows/listeners/'
});

assistant.login(process.env.ASSISTANT_TOKEN);
wows.login(process.env.WOWS_TOKEN);
