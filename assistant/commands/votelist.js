const { Command } = require('discord-akairo');
const Promise = require('bluebird');
const { getPrevMessage, emojis } = require('../../bot-util.js');
const alphabets = 'abcdefghijklmnopqrstuvwxyz';

class VoteListCommand extends Command {
  constructor() {
    super('votelist', {
      aliases: ['votelist'],
      args: [
        {
          id: 'length',
          type: 'integer',
        },
        {
          id: 'message',
          type: 'message',
        }
      ],
      channelRestriction: 'guild',
      description: {
        content: '投票の選択肢(リアクション)を追加します。',
        usage: '!votelist [length] [message]'
      }
    });
  }

  exec(message, args) {
    let channels = (process.env.VOTE_CHANNEL + '').split(',');
    if (channels.indexOf(message.channel.name) < 0) {
      return;
    }
    if (args.length > alphabets.length) {
      args.length = alphabets.length;
    }

    Promise.resolve().then(() => {
      if (args.message) {
        return args.message;
      }
      return getPrevMessage(message);

    }).then(m => {
      if (!m) {
        let err = '対象のメッセージが存在しません。';
        message.reply(err);
        throw err;
      }

      return Promise.each(alphabets, (c, i) => {
        let react = false;
        if (args.length <= 0) {
          // 選択肢の数が指定されていない場合
          // 対象メッセージに同じ絵文字が含まれていたらリアクションする
          react = m.content.includes(emojis[c])
        } else {
          // 選択肢の数が指定されている場合
          react = i < args.length;
        }
        if (react) {
          return m.react(emojis[c]);
        }
      });

    }).catch(console.error);
  }
}

module.exports = VoteListCommand;
