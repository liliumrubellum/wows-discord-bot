const Promise = require('bluebird');



/**
 * 数値を3桁のコンマ区切り文字列に変換する
 * @param {number} n 数値
 */
exports.delimit = function (n) {
  return String(n).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

/**
 * 2つの値を比較する
 * @param {any} x
 * @param {any} y
 * @returns x < y なら -1, x > y なら1, 等しければ0
 */
exports.compare = function (x, y) {
  return (x < y) ? -1 : (x > y) ? 1 : 0;
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
