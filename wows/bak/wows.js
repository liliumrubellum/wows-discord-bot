const Discord = require('discord.js');
const Promise = require('bluebird');
const rp = require('request-promise');
const moment = require('moment');
const util = require('util');
const mri = require('mri');
const bu = require('../../bot-util.js');


const MAX_CONCURRENCY = 10;
const CLAN_TAG = 'LILY';
const CHANNEL_NAME = 'wows';
const INTERVAL_MINUTES = 20;

const ACHV_HEADER = '**DAILY CLAN ACHIVEMENTS**';
const SERVER_TIME_OFFSET = 4;  // UTC+4(日本時間5時に日付変更)
const TL_WINS = 60;
const TL_FRAGS = 1.0;
const TL_PLANES_KILLED = 10;
const TL_DAMAGE_DEALT = 50000;
const TL_SURVIVED_BATTLES = 60;

const RANK_ENABLE = false;
const RANK_HEADER = '**RANK BATTLE**';
const RANK_SEASON = 9;
const RANK_SAVE_STAR_RATE = 1 / 7;
const RANK_STARS = new Map([
  [10, 4], [9, 4], [8, 4], [7, 4], [6, 4],
  [ 5, 5], [4, 5], [3, 5], [2, 5], [1, 0]]);

let _client = new Discord.Client();
let _clan = null;
let _members = null;







let getClan = async function(tag) {
  // クランを探す
  let clan = null;
  let page = 0;
  let maxpage = 1;
  do
  {
    let res = await callApi('clans/list', { search: tag, page_no: ++page });
    maxpage = Math.ceil(res.meta.total / 100);
    clan = res.data.find(x => x.tag == tag);
  } while (!clan && page < maxpage);
  //console.log(clan);
  return clan;
}

let getClanMembers = async function(clanId) {
  // クランメンバーを取得
  members = new Map();
  let res = await callApi(util.format('%sclans/info/?application_id=%s&clan_id=%s&extra=members', WOWS_SERVER, APP_ID, clanId));
  for (uid in res.data[clanId].members) {
    members[uid] = res.data[clanId].members[uid].account_name;
  }
  return members;
}

let update = async function() {
  try {
    _members = await getClanMembers(_clan.clan_id);
    //dump(_members);

    updateAchivements();
    updateRank();
  } catch (e) {
    console.error(e);
  }
}



let updateAchivements = function() {
  // 本日から9日前まで10日分の日付
  let dates = [];
  let now = moment().utcOffset(SERVER_TIME_OFFSET * 60);
  dates.push(now.format('YYYYMMDD'));
  for (let i = 0; i < 9; i++) {
    dates.push(now.add(-1, 'd').format('YYYYMMDD'));
  }

  // 日別戦績を取得
  Promise.map(Object.keys(_members), uid => {
    return callApi(util.format('%saccount/statsbydate/?application_id=%s&account_id=%s&dates=%s',
      WOWS_SERVER, APP_ID, uid, encodeURIComponent(dates.join())));
  }, { concurrency : MAX_CONCURRENCY })
  .then(res => {
    // ユーザー、pvp/pve、日付で構造化された結果データを平坦化する
    let stats = [];
    let diff = function(arr, date) {
      let ret = null;
      let idx = arr.findIndex(x => x.date == date);
      if (idx >= 0 && idx + 1 < arr.length) {
        let d1 = arr[idx];
        let d2 = arr[idx + 1];
        let ret = {
          'wins' : d1.wins - d2.wins,
          'frags' : d1.frags - d2.frags,
          'planes_killed' : d1.planes_killed - d2.planes_killed,
          'damage_dealt' : d1.damage_dealt - d2.damage_dealt,
          'survived_battles' : d1.survived_battles - d2.survived_battles,
          'battles' : d1.battles - d2.battles,
          'account_id' : d1.account_id,
          'account_name' : _members[d1.account_id],
          'battle_type' : d1.battle_type,
          'date' : d1.date
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
    for (user of res) {
      for (uid in user.data) {
        let pvp = toArray(user.data[uid].pvp, x => x.date, true);
        //let pve = toArray(user.data[uid].pve, x => x.date, true);
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
    let achivementsText = function(date) {
      return achivementText('wb', 'pvp', date, '至高の戦士', 'achv_SoloWarrior', 'WR', '%', TL_WINS) +
             achivementText('fb', 'pvp', date, 'クラーケン来襲', 'achv_KrakenUnleashed', 'Kill', '', TL_FRAGS) +
             achivementText('planes_killed', 'pvp', date, '晴天', 'achv_ClearSky', 'PKill', '', TL_PLANES_KILLED) +
             achivementText('db', 'pvp', date, '大口径', 'achv_HighCaliber', 'Dmg', '', TL_DAMAGE_DEALT) +
             achivementText('sb', 'pvp', date, 'ドレッドノート', 'achv_Dreadnought', 'Srv', '%', TL_SURVIVED_BATTLES);// +
             //achivementText('battles', 'pve', date, '孤高の戦士', 'Coop', '');
    }
    let achivementText = function(prop, type, date, achivement, emoji, desc, unit, tl) {
      let ret = '';
      let r = stats.filter(x => x.battle_type == type && x.date == date && x.battles >= 3 && x[prop] >= tl);
      if (r.length > 0) {
        let maxVal = r.map(x => Number(x[prop])).reduce((x, y) => (x > y) ? x : y);
        if (maxVal > 0) {
          let max = r.filter(x => Number(x[prop]) == maxVal);
          let emj = _client.emojis.find(x => x.name == emoji);
          for (m of max) {
            ret += util.format('%s %s「%s」  %s %s %s\n',
              emj ? emj : '', _members[m.account_id], achivement, desc, delimit(m[prop]), unit);
          }
        }
      }
      return ret;
    }

    // 書き込み
    invokeChannel('text', CHANNEL_NAME, Discord.Permissions.FLAGS.VIEW_CHANNEL | Discord.Permissions.FLAGS.READ_MESSAGE_HISTORY | Discord.Permissions.FLAGS.SEND_MESSAGES, async (c) => {
      let messages = await c.fetchMessages()
      let m = messages.find(x => x.content.startsWith(ACHV_HEADER));
      let text = util.format('%s - %s更新\n\n今日\n%s\n昨日\n%s',
        ACHV_HEADER, moment().format('M月D日 H:mm'), achivementsText(dates[0]), achivementsText(dates[1]));
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


let updateRank = async function() {
  if (RANK_ENABLE) {
    let rank = await callApi(util.format('%sseasons/accountinfo/?application_id=%s&account_id=%s&fields=seasons.rank_info&season_id=%s&fields=seasons.rank_info%2Cseasons.rank_solo.wins%2Cseasons.rank_solo.battles',
        WOWS_SERVER, APP_ID, encodeURIComponent(Object.keys(_members).join()), RANK_SEASON));

    let calcBattles = function(rank, stars, target_rank, win_rate, save_star_rate) {
      if (rank > 10 || rank < 2) return 0;
      let need_stars = 0;
      for (let i = rank; i > target_rank; i--) {
        need_stars += RANK_STARS.get(i);
      }
      need_stars -= stars;
      let stars_per_battle = win_rate - (1 - save_star_rate) * (1 - win_rate);
      return (stars_per_battle > 0) ? Math.round(need_stars / stars_per_battle) : Infinity;
    }

    // 配列に変換してソート
    let rank_array = [];
    for (let uid in rank.data) {
      if (rank.data[uid]) {
        let mr = rank.data[uid].seasons[RANK_SEASON].rank_info.max_rank;
        let r = rank.data[uid].seasons[RANK_SEASON].rank_info.rank;
        let s = rank.data[uid].seasons[RANK_SEASON].rank_info.stars;
        let wr = rank.data[uid].seasons[RANK_SEASON].rank_solo.battles > 0 ? rank.data[uid].seasons[RANK_SEASON].rank_solo.wins / rank.data[uid].seasons[RANK_SEASON].rank_solo.battles : 0;
        let nl = 0;
        if (r <= 10 && r >= 2) {
          if (r > 5 && mr > 5) {
            nl = calcBattles(r, s, 5, wr, RANK_SAVE_STAR_RATE);
          } else {
            nl = calcBattles(r, s, 1, wr, RANK_SAVE_STAR_RATE);
          }
        }

        rank_array.push({ id: uid, name: _members[uid], max_rank: mr, rank: r, stars: s, win_rate: wr, next_league: nl });
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
    dump(rank_array);

    // ランク別にグルーピング
    let rank_map = new Map();
    for (let r of rank_array) {
      let name = r.name;
      if (r.next_league > 0) {
        name += '(' + (Number.isFinite(r.next_league) ? r.next_league : '∞') + ')';
      }
      rank_map[r.rank] = rank_map[r.rank] ? rank_map[r.rank] + ', ' + name : r.rank.toString().padStart(2) + ' : ' + name;
      //rank_map[r.rank] = rank_map[r.rank] ? rank_map[r.rank] + ', ' + name : num2emoji(r.rank.toString().padStart(2, '0')) + ' ' + name;
    }
    //dump(rank_map);
  }

  // 書き込み
  invokeChannel('text', CHANNEL_NAME, Discord.Permissions.FLAGS.VIEW_CHANNEL | Discord.Permissions.FLAGS.READ_MESSAGE_HISTORY | Discord.Permissions.FLAGS.SEND_MESSAGES, async (c) => {
    let messages = await c.fetchMessages()
    let m = messages.find(x => x.content.startsWith(RANK_HEADER));
    let text = "";
    if (RANK_ENABLE) {
      text = util.format('%s - %s更新\n\n%s',
        RANK_HEADER, moment().format('M月D日 H:mm'), Object.values(rank_map).join('\n'));
    } else {
      text = util.format('%s - お休み中', RANK_HEADER);
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



let toArray = function(obj, keySelector, desc) {
  let ret = [];
  for (o in obj) {
    ret.push(obj[o]);
  }
  ret.sort((x, y) => {
    return ((keySelector(x) < keySelector(y)) ? -1 : 1) * (desc ? -1 : 1);
  });
  return ret;
}

let compare = function(x, y) {
  return (x < y) ? -1 : (x > y) ? 1 : 0;
}

let delimit = function(n) {
  return String(n).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}




_client.on('ready', async () => {
  console.log('I am ready!');
  try {
    _clan = await getClan(CLAN_TAG);
    update();

    _client.setInterval(() => {
      try {
        update();
      } catch(err) {
        console.error(err);
      }
    }, INTERVAL_MINUTES * 60 * 1000);
    //}, 5000);
  } catch(e) {
    console.error(e);
  }
});



let shell = function(m, cmd) {
  if (cmd._.length > 1) {
    let calibre = Number(cmd._[1]);
    let calcHE = function(caribre, conf, ifhe) {
      if (ifhe) {
        return Math.round(caribre / coef) - 1;
      } else {
        return Math.ceil(Math.round(caribre / coef) * 1.3) - 1;
      }
    }
    let calcAP = function(caribre) {
      return Math.ceil(calibre / 14.3) - 1;
    }
    let desc = util.format(
      'HE貫通可能装甲厚\n  %dmm - IFHE %dmm\n  %dmm - IFHE %dmm (ドイツ戦艦巡洋艦・イギリス戦艦)\n\nAP強制貫通可能装甲厚\n  %dmm',
      calcHE(calibre, 6.0, false),
      calcHE(calibre, 6.0, true),
      calcHE(calibre, 4.0, false),
      calcHE(calibre, 4.0, true),
      calcAP(calibre)
    );

    m.channel.send('', embed : {
      title: calibre + 'mm shell spec is',
      description: desc
    })
    .catch(lwl.error);
  }
}

_client.on('message' m => {
  if (m.content.startWith('!')) {
    // 書き込み権限があるかどうかの判定

    let cmd = mri(m.content.split(/\s+/));
    switch (cmd._[0]) {
      case '!shell': shell(cmd); break;
    }
  }
});

_client.login(WOWS_TOKEN);
