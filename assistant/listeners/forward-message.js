const { Listener } = require('discord-akairo');
const Discord = require('discord.js');

class ForwardMessageListener extends Listener {
  constructor() {
    super('forward-message', {
      emitter: 'client',
      eventName: 'message'
    });

    this.setting = eval(process.env.FORWARD_MESSAGES);
  }

  exec(message) {
    this.setting.forEach(s => {
      if (message.channel.name == s[0] && message.content.match(s[2])) {
        let channel = message.guild.channels.find(c => c.name == s[1] && c.type == 'text');
        if (channel) {
          let e = new Discord.RichEmbed()
            //.setTitle('たいとる')
            .setAuthor(message.member.displayName, message.author.avatarURL)
            //.setColor(0x008888)
            .setDescription(message.content)
            .setFooter(`#${s[0]} に投稿されました。`)
            .setTimestamp();
          channel.send(e).catch(console.error);
        }
      }
    });
  }
}

module.exports = ForwardMessageListener;
