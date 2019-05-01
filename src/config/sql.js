import env from '../utility/env';
const sql = {
  host: env('SQL_HOST', '127.0.0.1'),
  port: env('SQL_PORT', 3306),
  user: env('SQL_USER', 'root'),
  password: env('SQL_PASSWORD', 'perfeasy'),
  name: env('SQL_DB', 'performance'),
  replica: env('DB_REPLICA', false),
};

export default sql;
