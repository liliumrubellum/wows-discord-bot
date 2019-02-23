const { Listener } = require('discord-akairo');
const { format } = require('util');

class VoiceStateUpdateListener extends Listener {
  constructor() {
    super('notice-voice-channel', {
      emitter: 'client',
      eventName: 'voiceStateUpdate'
    });
  }

  exec(oldMember, newMember) {
    if (newMember.voiceChannelID && (oldMember.voiceChannelID != newMember.voiceChannelID)) {
      let msg = format('%s さんが %s に参加しました。',
        newMember.displayName, newMember.voiceChannel.name);
      console.log(msg);

      let channel = newMember.guild.channels
        .find(x => x.type == 'text' && x.name == process.env.NOTICE_CHANNEL);
      if (channel) {
        channel.send(msg).catch(console.error);
      }

    } else if (oldMember.voiceChannelID && !newMember.voiceChannelID) {
      console.log('%s さんが %s から退出しました。',
        oldMember.displayName, oldMember.voiceChannel.name);
    }
  }
}

module.exports = VoiceStateUpdateListener;
