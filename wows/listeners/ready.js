const { Listener } = require('discord-akairo');
const service = require('../wows-service.js');

class ReadyListener extends Listener {

  constructor() {
    super('ready', {
      emitter: 'client',
      eventName: 'ready'
    });
  }

  async exec() {
    console.log('Wows is ready.');
    service.start(this.client);
  }
}

module.exports = ReadyListener;
