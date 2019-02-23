const { Listener } = require('discord-akairo');
const { Permissions } = require('discord.js');
const moment = require('moment');
const { invokeChannel } = require('../../bot-util')

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
    }, (process.env.DELETE_NOTICE_INTERVAL_MINUTES || 5) * 60 * 1000);
  }

  deleteMessages() {
    let delTime = moment().subtract(process.env.DELETE_NOTICE_THRESHOLD_MINUTES || 5, 'm');

    invokeChannel(
      this.client, 'text', process.env.NOTICE_CHANNEL,
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
