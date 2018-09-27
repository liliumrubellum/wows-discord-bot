const { Command } = require('discord-akairo');
const Promise = require('bluebird');
const { format } = require('util');

class VoteCountCommand extends Command {
  constructor() {
    super('votecount', {
      aliases: ['votecount'],
      args: [
        {
          id: 'message',
          type: 'message'
        },
        {
          id: 'limit',
          type: 'integer',
          default: 1
        }
      ],
      channelRestriction: 'guild',
      description: {
        content: '!votelistで作成した選択肢への投票(リアクション)を集計します。',
        usage: '!votecount message [limit]'
      }
    });
  }

  exec(message, args) {
    if (message.channel.name != 'vote') {
      return;
    }
    if (!args.message) {
      return;
    }

    // 助手が投稿済みのリアクションのみ集計対象
    let reactions = args.message.reactions.filter(r => r.me);
    let data = [];

    Promise.map(reactions.values(), r => {    // reactionsがCollection(Map)のままだとrは[key,value]になる
      return r.fetchUsers();                  // 一度fetchしてからでないとreaction.usersが空

    }).then(() => {
      // ユーザーごとに投票結果をまとめdataに格納
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
