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

exports.getPrevMessage = async function (message) {
  let messages = await message.channel.fetchMessages().catch(console.error);
  return messages
    // 自分の投稿したコマンド以外のメッセージ
    .filter(m => m.author.id == message.author.id && !m.content.startsWith('!'))
    // 投稿日降順でソートされている前提で1つ前のメッセージを取得
    .find(m => m.createdAt < message.createdAt);
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
