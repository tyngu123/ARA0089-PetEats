const mysql = require('mysql2/promise');

// Lê a configuração do banco a partir das variáveis de ambiente.
// Na nuvem (Render + Aiven) use DATABASE_URL ou DB_HOST/DB_PORT/DB_USER/DB_PASSWORD
// e DB_SSL=true. Nunca coloque a senha diretamente no código.
const readConfig = (env = process.env) => {
  let base = {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
  };
  let database = env.DB_NAME || 'peteats';

  if (env.DATABASE_URL) {
    const url = new URL(env.DATABASE_URL);
    base = {
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };
    if (!env.DB_NAME && url.pathname.length > 1) {
      database = decodeURIComponent(url.pathname.slice(1));
    }
    if (url.searchParams.get('ssl-mode') === 'REQUIRED' && env.DB_SSL === undefined) {
      env = { ...env, DB_SSL: 'true' };
    }
  }

  if (String(env.DB_SSL).toLowerCase() === 'true') {
    const ca = env.DB_SSL_CA ? env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined;
    // Com o certificado (CA) do provedor a conexão é verificada; sem ele,
    // a conexão continua criptografada, mas sem validar o certificado.
    base.ssl = ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false };
  }

  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error('DB_NAME deve conter apenas letras, números e _.');
  }

  return { connectionOptions: base, database };
};

const { connectionOptions, database } = readConfig();

const createPool = () =>
  mysql.createPool({
    ...connectionOptions,
    database,
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 10000,
    decimalNumbers: true,
  });

module.exports = { connectionOptions, database, createPool, readConfig };
