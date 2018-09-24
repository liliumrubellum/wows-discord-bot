// const rp = require('request-promise');
const Promise = require('bluebird');
// const url = require('url');

// const MAX_RETRY = 3;


// WOWSのAPIへアクセス
// exports.callApi = async function (api, params = {}) {

//     let url = new url('/wows/' + api.trim('/'), process.env.API_SERVER);
//     url.searchParams = new URLSearchParams(params);
//     url.searchParams.append('application_id', process.env.APPLICATION_ID)

//     let opt = { uri: rul, json: true };
//     let retry = 0;
//     let res = null;

//     while (true) {
//         res = await rp(opt);

//         if (res.status == 'ok') {
//             return res;
//         } else if (res.error.message != 'REQUEST_LIMIT_EXCEEDED') {
//             break;
//         } else if (++retry >= MAX_RETRY) {
//             break;
//         }
//     }

//     console.error('[%s] returns error.\n%s', url, res);
//     throw res;
// }


// 指定チャンネルで操作を実行
exports.invokeChannel = function (client, type, name, permissions, func) {
    return Promise.map(client.guilds.array(), guild => {
        let channel = guild.channels.find(x => x.type == type && x.name == name);
        if (!channel) {
            console.log('%s サーバーに #%s チャンネルが見つかりません。', guild.name, name);
            return;
        }
        // 書き込みには読み取り権限も必要
        if (!channel.permissionsFor(client.user).has(permissions)) {
            console.log('%s サーバーの #%s チャンネルに対する権限がありません。', guild.name, name);
            return;
        }
        func(channel);
    }).catch(console.log);
}

exports.emojis = {
  a: '🇦', b: '🇧', c: '🇨', d: '🇩',
  e: '🇪', f: '🇫', g: '🇬', h: '🇭',
  i: '🇮', j: '🇯', k: '🇰', l: '🇱',
  m: '🇲', n: '🇳', o: '🇴', p: '🇵',
  q: '🇶', r: '🇷', s: '🇸', t: '🇹',
  u: '🇺', v: '🇻', w: '🇼', x: '🇽',
  y: '🇾', z: '🇿', 0: '0⃣', 1: '1⃣',
  2: '2⃣', 3: '3⃣', 4: '4⃣', 5: '5⃣',
  6: '6⃣', 7: '7⃣', 8: '8⃣', 9: '9⃣',
  10: '🔟', '#': '#⃣', '*': '*⃣',
  '!': '❗', '?': '❓',
};
