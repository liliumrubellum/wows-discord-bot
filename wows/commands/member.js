const { Command } = require('discord-akairo');
const db = require('../../db-manager.js');

class MemberCommand extends Command {
  constructor() {
    super('member', {
      aliases: ['member'],
      args: [
        {
          id: 'list',
          match: 'flag',
          prefix: '-l'
        },
        {
          id: 'update',
          match: 'flag',
          prefix: '-u'
        },
        {
          id: 'account_id',
          type: 'integer',
          default: -1
        },
        {
          id: 'account_name',
          type: 'string',
          default: null
        },
        {
          id: 'status',
          type: 'integer',
          default: 0
        },
        {
          id: 'achivement_enabled',
          type: 'integer',
          default: 1
        },
        {
          id: 'rank_enabled',
          type: 'integer',
          default: 1
        },
        {
          id: 'discord_user',
          type: 'user',
          default: null
        },

      ],
      //ownerOnly: true,
      channelRestriction: 'dm',
      description: {
        content: 'memberテーブルを管理します。',
        usage: '?member -l [account_id]\n?member -u account_id [account_name] [status] [achivement_enabled] [rank_enabled] [discord_id]'
      }
    });
  }

  exec(message, args) {
    //console.dir(args);

    if (args.list) {
      // リスト表示
      db.getMember(args.account_id).then(members => {
        //message.reply(JSON.stringify(members), { split: { char: '},', append: '},' } });
        if (args.account_id) {
          message.reply('```json\n' + JSON.stringify(members) + '```')
        } else {
          message.reply({
            files: [{
              attachment: Buffer.from(JSON.stringify(members)),
              name: 'members.json'
            }]
          });
        }
      }).catch(console.error);

    } else if (args.update) {
      // アップデート
      if (args.account_id <= 0) {
        message.reply('有効な account_id が指定されていません。');
        return;
      }
      db.updateMember([{
        account_id: args.account_id,
        account_name: args.account_name,
        status: args.status,
        achivement_enabled: args.achivement_enabled,
        rank_enabled: args.rank_enabled,
        discord_id: args.discord_user ? args.discord_user.id : null,
      }],
        message.author.username,
        ['account_name', 'status', 'achivement_enabled', 'rank_enabled', 'discord_id']
      ).then(() => {
        return db.getMember(args.account_id);
      }).then(member => {
        message.reply('更新結果\n```json\n' + JSON.stringify(member) + '```');
      }).catch(console.error);

    } else {
      // モード指定なし
      message.reply(this.description.usage);
    }
  }
}

module.exports = MemberCommand;
