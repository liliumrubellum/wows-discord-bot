const { Command } = require('discord-akairo');
const Promise = require('bluebird');
const { format } = require('util');
const { getPrevMessage } = require('../../bot-util.js');

class VoteCountCommand extends Command {
  constructor() {
    super('votecount', {
      aliases: ['votecount'],
      args: [
        {
          id: 'limit',
          type: 'integer',
          default: 1
        },
        {
          id: 'message',
          type: 'message'
        }
      ],
      channelRestriction: 'guild',
      description: {
        content: '!votelistで作成した選択肢への投票(リアクション)を集計します。',
        usage: '!votecount [limit] [message]'
      }
    });
  }

  exec(message, args) {
    let channels = (process.env.VOTE_CHANNEL + '').split(',');
    if (channels.indexOf(message.channel.name) < 0) {
      return;
    }

    let reactions = null;

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
      reactions = m.reactions.filter(r => r.me);

      // 最初はreaction.usersが空なので一度fetchする
      return Promise.map(reactions.values(), r => {   // reactionsがCollection(Map)のままだとrは[key,value]になる
        return r.fetchUsers();
      });

    }).then(() => {
      // ユーザーごとに投票結果をまとめdataに格納
      let data = [];
      reactions.forEach(r => {
        r.users
          .filter(u => u.id != this.client.user.id)  // 助手は除外
          .forEach(u => {
            let ur = data.find(x => x.user == u);
            if (ur) {
              ur.reactions.push(r);
            } else {
              // ディスコードに在籍していなかったら無効
              let member = message.guild.members.find(gm => gm.id == u.id);
              let name = member ? member.displayName : u.username;
              let valid = member ? true : false;
              data.push({ user: u, name: name, reactions: [r], valid: valid });
            }
          });
      });

      // 持ち票を超えて投票していたら無効
      data.forEach(d => d.valid = (d.valid && d.reactions.length <= args.limit));

      // メッセージを作成して送信
      let result = '集計結果\n';
      reactions.forEach(r => {
        let count = 0;
        let names = [];
        r.users
          .filter(u => u.id != this.client.user.id)  // 助手は除外
          .forEach(u => {
            let d = data.find(d => d.user == u);
            if (d.valid) count++;
            names.push(d.valid ? d.name : format('~~%s~~', d.name));
          });
        result += format('\n%s%d票 %s', r.emoji, count, names.join(', '));
      });
      message.channel.send(result).catch(console.error);

    }).catch(console.error);
  }
}

module.exports = VoteCountCommand;
