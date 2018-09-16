const { Listener } = require('discord-akairo');

class MessageListener extends Listener {
    constructor() {
        super('delete-pin-message', {
            emitter: 'client',
            eventName: 'message'
        });
    }

    exec(message) {
        if (message.type == 'PINS_ADD') {
            message.delete().catch(console.error);
        }
    }
}

module.exports = MessageListener;