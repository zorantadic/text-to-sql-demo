import 'dotenv/config'
import http from 'http'
import { executeSqlAgainstGold } from './sqlClient.js'

const PORT = process.env.PORT || 3004

function readJsonBody(req) {
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
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })

    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'sql-execution-service' }))
    return
  }

  if (req.url === '/execute' && req.method === 'POST') {
    try {
      const requestBody = await readJsonBody(req)
      const executionResult = await executeSqlAgainstGold(requestBody?.sql || '')

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: 'ok',
          ...executionResult
        })
      )
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: {
            message: error.message,
            code: 'SQL_EXECUTION_BAD_REQUEST'
          }
        })
      )
    }
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: 'sql-execution-service is running' }))
})

server.listen(PORT, () => {
  console.log(`sql-execution-service listening on port ${PORT}`)
})