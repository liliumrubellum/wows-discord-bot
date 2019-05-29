const moment = require('moment');
const Promise = require('bluebird');
const path = require('path');
const fs = require('fs');
const sqlite = require('sqlite');

// DBの準備
const dbDir = path.resolve(__dirname, '.data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const dbPromise = Promise.resolve()
  //.then(() => console.log('init'))
  .then(() => sqlite.open(path.resolve(dbDir, 'wows.db'), { Promise }))
  .then(db => db.migrate())
  .catch(console.error);



let createParam = function (data, user, props) {
  // propsで指定されたプロパティの頭に$をつける
  let ret = Object.assign({}, data);
  props.forEach(p => {
    if (!ret.hasOwnProperty('$' + p)) {
      if (ret.hasOwnProperty(p)) {
        Object.defineProperty(ret, '$' + p, Object.getOwnPropertyDescriptor(ret, p));
      } else {
        ret['$' + p] = null;
      }
    }
  });

  // 頭に$がついてないプロパティを削除する(削除しないとエラーになる)
  for (const d in ret) {
    if (!d.startsWith('$')) {
      delete ret[d];
    }
  }

  // 更新日時と更新ユーザーを設定する
  ret.$updated_at = moment().utcOffset(Number(process.env.LOCAL_TIME_OFFSET)).format('YYYY/MM/DD HH:mm:ss')
  ret.$updated_by = user;
  return ret;
}

// メンバー取得
module.exports.getMember = async function (account_id = null) {
  console.log('getMember called');

  try {
    let db = await dbPromise;
    let sql = 'SELECT * FROM member';
    if (account_id) {
      sql += ' WHERE account_id = ' + account_id;
    }
    return db.all(sql);
  } catch (error) {
    console.log('getMember failed');
    console.error(error);
  }
};

// メンバー更新
/* status
   0: 未確定
  10: クランメンバー
  20: ゲスト(元クランメンバー)
  21: ゲスト
  30: 離脱者(元クランメンバー)
  31: 離脱者(元ゲスト)
  99: 削除アカウント
*/
module.exports.updateMember = async function (data, user, props = []) {
  console.log('updateMember called');

  let db = await dbPromise;
  await db.exec('BEGIN');

  try {
    let updateSql = props.map(p => p + ' = $' + p).join(', ');
    let stmt = await db.prepare(' \
      INSERT INTO \
        member \
      ( \
        account_id, \
        account_name, \
        status, \
        achivement_enabled, \
        rank_enabled, \
        discord_id, \
        updated_at, \
        updated_by \
      ) VALUES ( \
        $account_id, \
        $account_name, \
        $status, \
        $achivement_enabled, \
        $rank_enabled, \
        $discord_id, \
        $updated_at, \
        $updated_by \
      ) \
      ON CONFLICT ( account_id ) DO \
      UPDATE SET \
      ' + updateSql + ', \
        updated_at = $updated_at, \
        updated_by = $updated_by \
      ');

    await Promise.map(data, d => {
      stmt.run(createParam(d, user, [
        'account_id', 'account_name', 'status',
        'achivement_enabled', 'rank_enabled', 'discord_id']));
    });
    await stmt.finalize();

    await db.exec('COMMIT');
    console.log('update ' + data.length + ' members.');

  } catch (error) {
    console.log('updateMember failed');
    console.error(error);
    await db.exec('ROLLBACK');
  }
}
