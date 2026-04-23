function getRequiredEnv(name) {
  const value = process.env[name]

  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return String(value).trim()
}

function getOptionalEnv(name, fallback = '') {
  const value = process.env[name]

  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback
  }

  return String(value).trim()
}

function buildSqlPasswordAuth() {
  return {
    authMode: 'sql-password',
    user: getRequiredEnv('SQL_USER'),
    password: getRequiredEnv('SQL_PASSWORD')
  }
}

function buildEntraTokenAuth() {
  return {
    authMode: 'entra-token',
    tenantId: getRequiredEnv('AZURE_TENANT_ID'),
    clientId: getRequiredEnv('AZURE_CLIENT_ID'),
    clientSecret: getRequiredEnv('AZURE_CLIENT_SECRET'),
    scope: getOptionalEnv('AZURE_SQL_SCOPE', 'https://database.windows.net/.default')
  }
}

function buildManagedIdentityAuth() {
  return {
    authMode: 'managed-identity',
    clientId: getOptionalEnv('AZURE_MANAGED_IDENTITY_CLIENT_ID'),
    scope: getOptionalEnv('AZURE_SQL_SCOPE', 'https://database.windows.net/.default')
  }
}

export function buildAuthConfig() {
  const authMode = getOptionalEnv('SQL_AUTH_MODE', 'sql-password')

  if (authMode === 'sql-password') {
    return buildSqlPasswordAuth()
  }

  if (authMode === 'entra-token') {
    return buildEntraTokenAuth()
  }

  if (authMode === 'managed-identity') {
    return buildManagedIdentityAuth()
  }

  throw new Error(`Unsupported SQL_AUTH_MODE: ${authMode}`)
}