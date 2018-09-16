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
