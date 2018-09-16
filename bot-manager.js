const { AkairoClient } = require('discord-akairo');

const assistant = new AkairoClient({
  prefix: '!',
  commandDirectory: './assistant/commands/',
  listenerDirectory: './assistant/listeners/'
});

assistant.login(process.env.ASSISTANT_TOKEN);