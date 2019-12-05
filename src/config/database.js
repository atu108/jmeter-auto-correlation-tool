import env from '../utility/env';
const database = {
  host: env('DB_HOST', '127.0.0.1'),
  port: env('DB_PORT', 27017),
  user: env('DB_USER', ''),
  password: env('DB_PASSWORD', ''),
  name: env('DB_NAME', 'perfeasy'),
  replica: env('DB_REPLICA', false),
};

database.uri = `mongodb://${database.host}/${database.name}`;
if(database.user !== '') database.uri = `mongodb://${database.user}:${encodeURIComponent(database.password)}@${database.host}:${database.port}/${database.name}?authSource=admin`;

export default database;
