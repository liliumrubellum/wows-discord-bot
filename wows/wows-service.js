const { Permissions } = require('discord.js');
const rp = require('request-promise');
const Promise = require('bluebird');
const moment = require('moment');
const { format } = require('util');
const throttledQueue = require('throttled-queue');
const throttle = throttledQueue(10, 1000);
const { invokeChannel, delimit, compare } = require('../bot-util.js');

const WOWS_RANK_ENABLE = eval(process.env.WOWS_RANK_ENABLE);
const WOWS_RANK_LEAGUES = eval(process.env.WOWS_RANK_LEAGUES);
const WOWS_RANK_STARS = new Map(eval(process.env.WOWS_RANK_STARS));

let _client = null;
let _timer = null;



module.exports.start = function (client) {
  _client = client;

  getClan(process.env.WOWS_CLAN_TAG).then(clan => {
    //console.log(clan);

    var update = function () {
      console.log("***** update start at " + moment().utcOffset(Number(process.env.LOCAL_TIME_OFFSET)).format('YYYY/MM/DD HH:mm:ss') + ". *****");
      getClanMembers(clan.clan_id).then(members => {
        updateAchivements(members).catch(console.error);
        updateRank(members).catch(console.error);
      }).catch(console.error);
    };

    update();
    _timer = _client.setInterval(update, process.env.WOWS_INTERVAL_MINUTES * 60 * 1000);

  }).catch(console.error);
}

module.exports.stop = function () {
  _client.clearInterval(_timer);
}



async function updateAchivements(members) {
  // 本日から9日前まで10日分の日付
  let dates = [];
  let now = moment().utcOffset(Number(process.env.WOWS_SERVER_TIME_OFFSET);
  dates.push(now.format('YYYYMMDD'));
  for (let i = 0; i < 9; i++) {
    dates.push(now.add(-1, 'd').format('YYYYMMDD'));
  }

  // 日別戦績を取得
  Promise.map(Object.keys(members), uid => {
    return callApi('account/statsbydate', { account_id: uid, dates: dates.join() });
    //  }, { concurrency: MAX_CONCURRENCY })
  }).then(res => {
    // ユーザー、pvp/pve、日付で構造化された結果データを平坦化する
    let stats = [];
    let diff = function (arr, date) {
      let ret = null;
      let idx = arr.findIndex(x => x.date == date);
      if (idx >= 0 && idx + 1 < arr.length) {
        let d1 = arr[idx];
        let d2 = arr[idx + 1];
        ret = {
          'wins': d1.wins - d2.wins,
          'frags': d1.frags - d2.frags,
          'planes_killed': d1.planes_killed - d2.planes_killed,
          'damage_dealt': d1.damage_dealt - d2.damage_dealt,
          'survived_battles': d1.survived_battles - d2.survived_battles,
          'battles': d1.battles - d2.battles,
          'account_id': d1.account_id,
          'account_name': members[d1.account_id],
          'battle_type': d1.battle_type,
          'date': d1.date
        };
        if (ret.battles > 0) {
          ret.wb = (ret.wins / ret.battles * 100).toFixed(1);
          ret.fb = (ret.frags / ret.battles).toFixed(1);
          ret.pb = (ret.planes_killed / ret.battles).toFixed(1);
          ret.db = (ret.damage_dealt / ret.battles).toFixed();
          ret.db = ret.db.toLocaleString();
          ret.sb = (ret.survived_battles / ret.battles * 100).toFixed(1);
        }
      }
      return ret;
    }
    let user_count = 0;
    let data_count = 0;
    for (const user of res) {
      for (const uid in user.data) {
        let pvp = [];
        for (const p in user.data[uid].pvp) {
          if (user.data[uid].pvp.hasOwnProperty(p)) {
            pvp.push(user.data[uid].pvp[p]);
          }
        }
        pvp.sort((x, y) => {
          return (x.date < y.date) ? 1 : -1
        });
        let pvp0 = diff(pvp, dates[0]); if (pvp0) stats.push(pvp0);
        let pvp1 = diff(pvp, dates[1]); if (pvp1) stats.push(pvp1);
        //let pve0 = diff(pve, dates[0]); if (pve0) stats.push(pve0);
        //let pve1 = diff(pve, dates[1]); if (pve1) stats.push(pve1);
        data_count += user.data[uid].pvp ? Object.keys(user.data[uid].pvp).length : 0;
      }
      user_count++;
    }
    console.log('日別戦績情報 %d人分 計%d件', user_count, data_count);

    // 整形
    let achivementsText = function (date) {
      return achivementText('wb', 'pvp', date, '至高の戦士', 'achv_SoloWarrior', 'WR', '%', process.env.WOWS_ACHV_WINS) +
        achivementText('fb', 'pvp', date, 'クラーケン来襲', 'achv_KrakenUnleashed', 'Kill', '', process.env.WOWS_ACHV_FRAGS) +
        achivementText('planes_killed', 'pvp', date, '晴天', 'achv_ClearSky', 'PKill', '', process.env.WOWS_ACHV_PLANES_KILLED) +
        achivementText('db', 'pvp', date, '大口径', 'achv_HighCaliber', 'Dmg', '', process.env.WOWS_ACHV_DAMAGE_DEALT) +
        achivementText('sb', 'pvp', date, 'ドレッドノート', 'achv_Dreadnought', 'Srv', '%', process.env.WOWS_ACHV_SURVIVED_BATTLES);// +
      //achivementText('battles', 'pve', date, '孤高の戦士', 'Coop', '');
    }
    let achivementText = function (prop, type, date, achivement, emoji, desc, unit, tl) {
      let ret = '';
      let r = stats.filter(x => x.battle_type == type && x.date == date && x.battles >= 3 && x[prop] >= tl);
      if (r.length > 0) {
        let maxVal = r.map(x => Number(x[prop])).reduce((x, y) => (x > y) ? x : y);
        if (maxVal > 0) {
          let max = r.filter(x => Number(x[prop]) == maxVal);
          let emj = _client.emojis.find(x => x.name == emoji);
          for (const m of max) {
            ret += format('%s %s「%s」  %s %s %s\n',
              emj ? emj : '', members[m.account_id], achivement, desc, delimit(m[prop]), unit);
          }
        }
      }
      return ret;
    }

    // 書き込み
    invokeChannel(_client, 'text', process.env.WOWS_CHANNEL,
      Permissions.FLAGS.VIEW_CHANNEL |
      Permissions.FLAGS.READ_MESSAGE_HISTORY |
      Permissions.FLAGS.SEND_MESSAGES, async (c) => {
        let messages = await c.fetchMessages()
        let m = messages.find(x => x.content.startsWith(process.env.WOWS_ACHV_HEADER));
        let text = format('%s - %s更新\n\n今日\n%s\n昨日\n%s',
          process.env.WOWS_ACHV_HEADER, moment().utcOffset(Number(process.env.LOCAL_TIME_OFFSET)).format('M月D日 H:mm'), achivementsText(dates[0]), achivementsText(dates[1]));
        if (m) {
          await m.edit(text);
        } else {
          await c.send(text);
        }
      })
    console.log('実績を更新しました。');
  })
    .catch(console.error);
}

async function updateRank(members) {
  let rank_map = new Map();

  if (WOWS_RANK_ENABLE) {
    let rank = await callApi('seasons/accountinfo', { account_id: Object.keys(members).join() });
    let calcBattles = function (rank, stars, target_rank, win_rate) {
      if (rank <= 1) return 0;
      let need_stars = 0;
      for (let i = rank; i > target_rank; i--) {
        need_stars += WOWS_RANK_STARS.get(i)[0];
        if (i < rank) {
          need_stars -= WOWS_RANK_STARS.get(i)[1];
        }
      }
      need_stars -= stars;
      let stars_per_battle = win_rate - (1 - (1 / process.env.WOWS_RANK_PLAYERS)) * (1 - win_rate);
      return (stars_per_battle > 0) ? Math.round(need_stars / stars_per_battle) : Infinity;
    }

    // 配列に変換してソート
    let rank_array = [];
    for (const uid in rank.data) {
      if (rank.data[uid] && rank.data[uid].seasons[process.env.WOWS_RANK_SEASON]) {
        let season = rank.data[uid].seasons[process.env.WOWS_RANK_SEASON];
        if (season.rank_info.max_rank > 0 && (season.rank_solo || season.rank_div2 || season.rank_div3)) {
          let rank_data = { id: uid, name: members[uid] };
          // 今シーズンの進捗
          rank_data.max_rank = season.rank_info.max_rank;
          rank_data.rank = season.rank_info.rank;
          rank_data.stars = season.rank_info.stars;
          rank_data.battles = 0;
          rank_data.wins = 0;
          // 全シーズンの戦績
          for (const sid in rank.data[uid].seasons) {
            season = rank.data[uid].seasons[sid];
            for (const battle_type of ['rank_solo', 'rank_div2', 'rank_div3']) {
              let battle_data = season[battle_type];
              if (battle_data) {
                rank_data.battles += battle_data.battles;
                rank_data.wins += battle_data.wins;
              }
            }
          }
          rank_data.win_rate = rank_data.battles > 0 ? rank_data.wins / rank_data.battles : 0;
          rank_data.target_rank = Math.max(Math.max.apply(null, WOWS_RANK_LEAGUES.filter(x => x < rank_data.max_rank)), 1);
          rank_data.next_league = calcBattles(rank_data.rank, rank_data.stars, rank_data.target_rank, rank_data.win_rate);
          rank_array.push(rank_data);
        }
      }
    }

    rank_array.sort((x, y) => {
      let c = 0;
      c = compare(x.rank, y.rank);
      if (c != 0) return c;
      c = compare(x.stars, y.stars) * -1;
      if (c != 0) return c;
      c = compare(x.next_league, y.next_league);
      if (c != 0) return c;
      c = compare(x.max_rank, y.max_rank);
      if (c != 0) return c;
      return compare(x.id, y.id);
    });
    //console.log(rank_array);

    // ランク別にグルーピング
    for (const r of rank_array) {
      let name = r.name;
      if (r.next_league > 0) {
        name += '(' + (Number.isFinite(r.next_league) ? r.next_league : '∞') + ')';
      }
      rank_map[r.rank] = rank_map[r.rank] ? rank_map[r.rank] + ', ' + name : r.rank.toString().padStart(2) + ' : ' + name;
    }
    //console.log(rank_map);
  }

  // 書き込み
  invokeChannel(_client, 'text', process.env.WOWS_CHANNEL,
    Permissions.FLAGS.VIEW_CHANNEL |
    Permissions.FLAGS.READ_MESSAGE_HISTORY |
    Permissions.FLAGS.SEND_MESSAGES, async (c) => {
      let messages = await c.fetchMessages()
      let m = messages.find(x => x.content.startsWith(process.env.WOWS_RANK_HEADER));
      let text = "";
      if (WOWS_RANK_ENABLE) {
        text = format('%s - %s更新\n\n%s',
          process.env.WOWS_RANK_HEADER, moment().utcOffset(Number(process.env.LOCAL_TIME_OFFSET)).format('M月D日 H:mm'), Object.values(rank_map).join('\n'));
      } else {
        text = format('%s - お休み中', process.env.WOWS_RANK_HEADER);
      }
      if (m) {
        await m.edit(text);
      } else {
        await c.send(text);
      }
      console.log('ランク情報を更新しました。');
    })
    .catch(console.error);
}






// WOWSのAPIへアクセス
async function callApi(api, params = {}) {

  let url = new URL(api.replace(/\/*$/, '/'), process.env.WOWS_API_URL);
  for (const p in params) {
    if (params.hasOwnProperty(p)) {
      // searchParamsはreadonly
      // setは上書き、appendは既存の値と追加する値を1つの配列に収めてセットする
      url.searchParams.set(p, params[p]);
    }
  }
  url.searchParams.set('application_id', process.env.WOWS_APP_ID)
  //console.log(url);

  let options = {
    uri: url,
    simple: false,
    resolveWithFullResponse: true,
    forever: true,
    json: true
  };

  return new Promise((resolve, reject) => {
    throttle(() => {
      rp(options).then(r => {
        //console.log('StatusCode: %d, URL: %s', r.statusCode, r.request.href);
        if (!(/^2/.test('' + r.statusCode)) || (r.body.status && r.body.status != 'ok')) {
          console.error('StatusCode: %d, URL: %s', r.statusCode, r.request.href);
          //console.error(r.body);
          reject(r.body);
        }
        resolve(r.body);

      }).catch(err => {
        //console.error(err);
        reject(err);
      });
    });
  });
}

// クランを探す
async function getClan(tag) {
  let clan = null;
  let page = 1;
  let maxpage = 1;

  do {
    let res = await callApi('clans/list', { search: tag, page_no: page });
    maxpage = Math.ceil(res.meta.total / 100);
    clan = res.data.find(x => x.tag == tag);
  } while (!clan && page++ < maxpage);
  return clan;
}

// クランメンバーを取得
async function getClanMembers(clanId) {
  let members = new Map();
  let res = await callApi('clans/info', { clan_id: clanId, extra: 'members' });
  for (const uid in res.data[clanId].members) {
    members[uid] = res.data[clanId].members[uid].account_name;
  }
  return members;
}
