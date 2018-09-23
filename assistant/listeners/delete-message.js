const { Listener } = require('discord-akairo');
const { Permissions } = require('discord.js');
const moment = require('moment');
const { invokeChannel } = require('../../bot-util')

const CHANNEL_NAME = 'general';
const INTERVAL_MINUTES = 5;
const DELETE_MINUTES = 5;
// const INTERVAL_MINUTES = 1/12;
// const DELETE_MINUTES = 1/12;

class DeleteMessageListener extends Listener {
    constructor() {
        super('delete-message', {
            emitter: 'client',
            eventName: 'ready'
        });
    }

    exec() {
        this.client.setInterval(() => {
            try {
                this.deleteMessages();
            } catch (err) {
                console.log(err);
            }
        }, INTERVAL_MINUTES * 60 * 1000);
    }

    deleteMessages() {
        var delTime = moment().subtract(DELETE_MINUTES, 'm');

        invokeChannel(
            this.client, 'text', CHANNEL_NAME,
            Permissions.FLAGS.VIEW_CHANNEL |            // メッセージを読む
            Permissions.FLAGS.READ_MESSAGE_HISTORY,     // メッセージ履歴を読む
            (channel) => {
                channel.fetchMessages()
                .then(messages => {
                    messages.filter(x => x.author.id == this.client.user.id && moment(x.createdTimestamp).isBefore(delTime)).deleteAll();
                })
                .catch(err => console.log(err));
            }
        );
    }
}

module.exports = DeleteMessageListener;
