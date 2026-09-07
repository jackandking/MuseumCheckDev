// Run ON THE SERVER (Lighthouse) from ~/letmetry_web_service so .env DB creds load.
// Verification-first: SELECT the 12 junk duplicate rows (must be exactly 12, all
// visitor_count NULL) BEFORE any DELETE. Aborts if verification fails.
try {
  require('/root/letmetry_web_service/node_modules/dotenv').config({ path: '/root/letmetry_web_service/.env' });
} catch (e) {
  console.log('note: dotenv not explicitly loaded:', e.message);
}
const db = require('/root/letmetry_web_service/mysqlUtil');

const KEYS = [
  '陕西省_秦始皇帝陵博物院',
  '江苏省_苏州博物馆',
  '浙江省_浙江省博物馆',
  '广东省_广东省博物馆',
  '山东省_山东博物馆',
  '重庆市_重庆中国三峡博物馆',
  '浙江省_杭州博物馆',
  '安徽省_安徽博物院',
  '浙江省_嘉兴博物馆',
  '吉林省_吉林省博物院',
  '天津市_天津自然博物馆',
  '北京市_中国考古博物馆'
];

db.query(
  'SELECT dedupe_key, name, visitor_count, image_url FROM museums WHERE dedupe_key IN (?) AND visitor_count IS NULL',
  [KEYS],
  (e, rows) => {
    if (e) { console.error('SELECT ERROR:', e.message); process.exit(1); }
    console.log('VERIFY matched rows:', rows.length);
    rows.forEach(r => console.log('  ', r.dedupe_key, '| vc=', r.visitor_count, '| img=', r.image_url));
    const allNull = rows.every(r => r.visitor_count == null);
    if (rows.length !== 12 || !allNull) {
      console.error('ABORT: verification failed (expected 12 NULL-row duplicates). No DELETE performed.');
      return db.pool.end(() => process.exit(1));
    }
    db.query(
      'DELETE FROM museums WHERE dedupe_key IN (?) AND visitor_count IS NULL',
      [KEYS],
      (e2, res) => {
        if (e2) { console.error('DELETE ERROR:', e2.message); return db.pool.end(() => process.exit(1)); }
        console.log('DELETE affectedRows:', res.affectedRows);
        db.pool.end(() => process.exit(0));
      }
    );
  }
);
