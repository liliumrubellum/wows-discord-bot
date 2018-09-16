const { Command } = require('discord-akairo');
const rp = require('request-promise');

class VoteCommand extends Command {
  constructor() {
    super('vote', {
      aliases: ['vote'],
      args: [
        {
          id: 'voteId',
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
    if (!args.voteId) {
      return;
    }

    let opt = {
      uri: process.env.VOTE_API_URL,
      method: 'PUT',
      body: {
        voteId: args.voteId,
        discordId: message.member.id,
        name: message.member.displayName
      },
      json: true
    };

    rp(opt)
      .then(res => {
        message.reply('投票を受け付けました。')
          .catch(console.error);
      })
      .catch(err => {
        console.error(err);
        message.reply('エラーが発生しました。' + err.message)
          .catch(console.error);
      });
  }
}

module.exports = VoteCommand;
