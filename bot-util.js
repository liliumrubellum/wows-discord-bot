const rp = require('request-promise');
const Promise = require('bluebird');
const throttledQueue = require('throttled-queue');
const throttle = throttledQueue(10, 1000);


// WOWSのAPIへアクセス
exports.callApi = async function (api, params = {}) {

  let url = new URL(api.replace(/\/*$/, '/'), process.env.WOWS_API_URL);
  url.searchParams = new URLSearchParams(params);
  url.searchParams.append('application_id', process.env.APPLICATION_ID)
  console.log(url);

  let options = {
    uri: url,
    simple: false,
    resolveWithFullResponse: true,
    forever: true,
    json: true
  };

  return new Promise((resolve, reject) => {
    throttle(() => {
      rp(options)
        .then(r => {
          console.log('StatusCode: %d, URL: %s', r.statusCode, r.request.href);
          if (!(/^2/.test('' + r.statusCode)) || (r.body.status && r.body.status != 'ok')) {
            //console.log('StatusCode: %d, URL: %s', r.statusCode, r.request.href);
            console.log('unexpected response...');
            console.log(r.body);
          }
          resolve(r.body);
        })
        .catch(err => {
          console.error(err);
          reject(err);
        });
    });
  });
}

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

// 数字を絵文字に変換
function num2emoji(num) {
  let ret = '';
  let t = num.toString();
  for (let i = 0; i < t.length; i++) {
    ret += function (n) {
      dump(n);
      switch (n) {
        case 0: return ':zero:';
        case 1: return ':one:';
        case 2: return ':two:';
        case 3: return ':three:';
        case 4: return ':four:';
        case 5: return ':five:';
        case 6: return ':six:';
        case 7: return ':seven:';
        case 8: return ':eight:';
        case 9: return ':nine:';
        default: return num;
      }
    }(Number.parseInt(t.substr(i, 1)));
  }
  return ret;
}
