const SQL_EXECUTION_SERVICE_URL =
  process.env.SQL_EXECUTION_SERVICE_URL || 'http://localhost:3004'

export async function executeQuery(sql) {
  const response = await fetch(`${SQL_EXECUTION_SERVICE_URL}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sql
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || 'SQL execution failed')
  }

  return data
}