import http from 'http'

const PORT = process.env.PORT || 3001
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3002'

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''

    req.on('data', chunk => {
      raw += chunk
    })

    req.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(new Error('Invalid JSON body'))
      }
    })

    req.on('error', error => {
      reject(error)
    })
  })
}

async function callOrchestrator(payload) {
  const response = await fetch(`${ORCHESTRATOR_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`Orchestrator returned status ${response.status}`)
  }

  return response.json()
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'api-gateway' }))
    return
  }

  if (req.url === '/api/query' && req.method === 'POST') {
    try {
      const requestBody = await readJsonBody(req)
      const orchestratorResponse = await callOrchestrator(requestBody)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(orchestratorResponse))
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: {
            message: error.message,
            code: 'API_GATEWAY_QUERY_FAILED'
          }
        })
      )
    }
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: 'api-gateway is running' }))
})

server.listen(PORT, () => {
  console.log(`api-gateway listening on port ${PORT}`)
})