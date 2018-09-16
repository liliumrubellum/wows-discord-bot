const { Listener } = require('discord-akairo');

class ErrorListener extends Listener {
    constructor() {
        super('error', {
            emitter: 'client',
            eventName: 'error'
        });
    }

    exec(error) {
        console.log('error handler called.');
        console.error(error);
    }
}

module.exports = ErrorListener;