const { Command } = require('discord-akairo');
const Promise = require('bluebird');
const { emojis } = require('../../bot-util.js');
const alphabets = 'abcdefghijklmnopqrstuvwxyz';

class VoteListCommand extends Command {
  constructor() {
    super('votelist', {
      aliases: ['votelist'],
      args: [
        {
          id: 'num',
          type: 'integer'
        }
      ],
      channelRestriction: 'guild'
    });
  }

  exec(message, args) {
    if (message.channel.name != 'vote') {
      return;
    }
    if (!args.num || args.num < 1 || args.num > alphabets.length) {
      return;
    }

    message.channel.fetchMessages()
      .then(messages => {
        let targetMessage = messages
          // 自分の投稿したコマンド以外のメッセージ
          .filter(m => m.author.id == message.author.id && !m.content.startsWith('!'))
          // 投稿日降順でソートされている前提で1つ前のメッセージを取得
          .find(m => m.createdAt < message.createdAt);

        if (targetMessage) {
          Promise.each(alphabets, (c, i) => {
            if (i < args.num) {
              return targetMessage.react(emojis[c]);
            }
          }).catch(console.error);
        }
      })
      .catch(console.error);
  }
}

module.exports = VoteListCommand;
