const { Listener } = require('discord-akairo');
const { Permissions } = require('discord.js');
const { format } = require('util');
const { invokeChannel }  = require('../../bot-util');

const CHANNEL_NAME = 'general';
const USE_TTS = false;

class VoiceStateUpdateListener extends Listener {
    constructor() {
        super('notice-voice-channel', {
            emitter: 'client',
            eventName: 'voiceStateUpdate'
        });
    }

    exec(oldMember, newMember) {
        if (newMember.voiceChannelID && (oldMember.voiceChannelID != newMember.voiceChannelID)) {
            let msg = format('%s さんが %s に参加しました。', newMember.displayName, newMember.voiceChannel.name);
            console.log(msg);            

            invokeChannel(this.client, 'text', CHANNEL_NAME,
                Permissions.FLAGS.SEND_MESSAGES,
                (channel) => {
                    channel
                        .send(msg, { tts: USE_TTS })
                        .catch(console.error);
                });

        } else if (oldMember.voiceChannelID && !newMember.voiceChannelID) {
            console.log('%s さんが %s から退出しました。', oldMember.displayName, oldMember.voiceChannel.name);
        }
    }
}

module.exports = VoiceStateUpdateListener;