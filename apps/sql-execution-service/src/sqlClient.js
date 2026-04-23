import { buildAuthConfig } from './authProvider.js'

function getOptionalEnv(name, fallback = '') {
  const value = process.env[name]

  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback
  }

  return String(value).trim()
}

function buildConnectionConfig() {
  const auth = buildAuthConfig()

  return {
    provider: getOptionalEnv('SQL_PROVIDER', 'fabric-sql-endpoint'),
    server: getOptionalEnv('SQL_SERVER', 'your-fabric-or-azure-sql-server'),
    port: Number(getOptionalEnv('SQL_PORT', '1433')),
    database: getOptionalEnv('SQL_DATABASE', 'your-gold-database'),
    encrypt: getOptionalEnv('SQL_ENCRYPT', 'true').toLowerCase() === 'true',
    trustServerCertificate:
      getOptionalEnv('SQL_TRUST_SERVER_CERTIFICATE', 'false').toLowerCase() === 'true',
    auth
  }
}

function buildExecutionMetadata(config) {
  return {
    target: 'gold-sql-endpoint',
    provider: 'sql-execution-service',
    sqlProvider: config.provider,
    server: config.server,
    database: config.database,
    authenticationMode: config.auth.authMode
  }
}

export async function executeSqlAgainstGold(sql) {
  const config = buildConnectionConfig()

  if (!sql || typeof sql !== 'string') {
    throw new Error('SQL text is required for execution.')
  }

  return {
    executionMode: 'azure-sql-skeleton',
    receivedSql: sql,
    rows: [],
    metadata: buildExecutionMetadata(config)
  }
}