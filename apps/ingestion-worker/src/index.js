import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const PORT = process.env.PORT || 3003

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const demoStateFilePath = path.resolve(__dirname, '../../../data/dataset-state.json')

const initialDemoState = {
  activeScenarioId: 'baseline',
  lastRefreshUtc: '2026-04-16T09:00:00Z',
  refreshVersion: 1,
  scenarios: {
    baseline: {
      salesSummaryRows: [
        {
          orderDate: '2026-04-01',
          region: 'Europe',
          customerName: 'Alpine Retail GmbH',
          productCategory: 'Laptops',
          revenue: 18500,
          orderCount: 3
        },
        {
          orderDate: '2026-04-02',
          region: 'North America',
          customerName: 'Blue Yonder Stores',
          productCategory: 'Accessories',
          revenue: 9200,
          orderCount: 5
        },
        {
          orderDate: '2026-04-03',
          region: 'Europe',
          customerName: 'North Peak Trading',
          productCategory: 'Monitors',
          revenue: 14300,
          orderCount: 2
        },
        {
          orderDate: '2026-04-04',
          region: 'Asia',
          customerName: 'Summit Digital',
          productCategory: 'Tablets',
          revenue: 12100,
          orderCount: 4
        },
        {
          orderDate: '2026-04-05',
          region: 'Europe',
          customerName: 'Harbor Central',
          productCategory: 'Laptops',
          revenue: 26400,
          orderCount: 6
        }
      ]
    },
    regional_growth: {
      salesSummaryRows: [
        {
          orderDate: '2026-04-10',
          region: 'Europe',
          customerName: 'Metro Retail Group',
          productCategory: 'Laptops',
          revenue: 31200,
          orderCount: 8
        },
        {
          orderDate: '2026-04-11',
          region: 'North America',
          customerName: 'Urban Shop Holdings',
          productCategory: 'Accessories',
          revenue: 14600,
          orderCount: 9
        },
        {
          orderDate: '2026-04-12',
          region: 'Europe',
          customerName: 'Mercury Stores BV',
          productCategory: 'Monitors',
          revenue: 19800,
          orderCount: 4
        },
        {
          orderDate: '2026-04-13',
          region: 'Asia',
          customerName: 'Pacific Retail Chain',
          productCategory: 'Tablets',
          revenue: 22300,
          orderCount: 7
        },
        {
          orderDate: '2026-04-14',
          region: 'Europe',
          customerName: 'Nova Commerce GmbH',
          productCategory: 'Laptops',
          revenue: 28700,
          orderCount: 5
        }
      ]
    },
    enterprise_accounts: {
      salesSummaryRows: [
        {
          orderDate: '2026-04-20',
          region: 'North America',
          customerName: 'Apex Infrastructure Inc',
          productCategory: 'Servers',
          revenue: 45800,
          orderCount: 2
        },
        {
          orderDate: '2026-04-21',
          region: 'Europe',
          customerName: 'Continental Systems AG',
          productCategory: 'Storage',
          revenue: 28600,
          orderCount: 3
        },
        {
          orderDate: '2026-04-22',
          region: 'North America',
          customerName: 'Vertex Data Platforms',
          productCategory: 'Security',
          revenue: 31900,
          orderCount: 2
        },
        {
          orderDate: '2026-04-23',
          region: 'Europe',
          customerName: 'Euro Enterprise Tech',
          productCategory: 'Servers',
          revenue: 26700,
          orderCount: 2
        },
        {
          orderDate: '2026-04-24',
          region: 'Asia',
          customerName: 'Pacific Enterprise Grid',
          productCategory: 'Networking',
          revenue: 21400,
          orderCount: 4
        }
      ]
    }
  }
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function readDemoState() {
  const raw = fs.readFileSync(demoStateFilePath, 'utf-8')
  return JSON.parse(raw)
}

function writeDemoState(nextState) {
  fs.writeFileSync(demoStateFilePath, JSON.stringify(nextState, null, 2), 'utf-8')
}

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

function resolveScenarioId(currentState, requestedScenarioId) {
  if (
    requestedScenarioId &&
    typeof requestedScenarioId === 'string' &&
    currentState?.scenarios?.[requestedScenarioId]
  ) {
    return requestedScenarioId
  }

  return currentState.activeScenarioId || 'default'
}

function resetDemoState(requestedScenarioId) {
  const nextState = structuredClone(initialDemoState)
  const scenarioId =
    requestedScenarioId && nextState?.scenarios?.[requestedScenarioId]
      ? requestedScenarioId
      : nextState.activeScenarioId

  nextState.activeScenarioId = scenarioId
  writeDemoState(nextState)
  return nextState
}

function upsertRow(rows, nextRow, matchFn) {
  const index = rows.findIndex(matchFn)

  if (index >= 0) {
    rows[index] = nextRow
    return 'updated'
  }

  rows.push(nextRow)
  return 'inserted'
}

function applyRefreshSimulation(currentState, requestedScenarioId) {
  const nextState = structuredClone(currentState)
  const activeScenarioId = resolveScenarioId(nextState, requestedScenarioId)
  nextState.activeScenarioId = activeScenarioId

  const activeScenario =
    nextState?.scenarios?.[activeScenarioId] || nextState?.scenarios?.baseline

  if (!activeScenario?.salesSummaryRows) {
    return {
      nextState,
      changeType: 'none'
    }
  }

  const rows = activeScenario.salesSummaryRows
  const currentVersion = nextState.refreshVersion || 0
  let changeType = 'none'

  if (currentVersion === 2) {
    changeType = upsertRow(
      rows,
      {
        orderDate: '2026-04-26',
        region: 'Europe',
        customerName: 'Global Retail Partners',
        productCategory: 'Laptops',
        revenue: 19400,
        orderCount: 4
      },
      row =>
        row.orderDate === '2026-04-26' &&
        row.customerName === 'Global Retail Partners'
    )

    nextState.lastRefreshUtc = '2026-04-17T11:00:00Z'
  } else if (currentVersion === 3) {
    changeType = upsertRow(
      rows,
      {
        orderDate: '2026-04-27',
        region: 'North America',
        customerName: 'Summit Retail Hub',
        productCategory: 'Accessories',
        revenue: 11800,
        orderCount: 6
      },
      row =>
        row.orderDate === '2026-04-27' &&
        row.customerName === 'Summit Retail Hub'
    )

    nextState.lastRefreshUtc = '2026-04-17T11:30:00Z'
  } else if (currentVersion === 4) {
    changeType = upsertRow(
      rows,
      {
        orderDate: '2026-04-28',
        region: 'Europe',
        customerName: 'Alpine Retail GmbH',
        productCategory: 'Monitors',
        revenue: 9600,
        orderCount: 2
      },
      row =>
        row.orderDate === '2026-04-28' &&
        row.customerName === 'Alpine Retail GmbH'
    )

    nextState.lastRefreshUtc = '2026-04-17T12:00:00Z'
  } else {
    const existingIndex = rows.findIndex(
      row =>
        row.orderDate === '2026-04-26' &&
        row.customerName === 'Global Retail Partners'
    )

    if (existingIndex >= 0) {
      rows[existingIndex] = {
        ...rows[existingIndex],
        revenue: rows[existingIndex].revenue + 1200,
        orderCount: rows[existingIndex].orderCount + 1
      }
      changeType = 'updated'
    } else {
      rows.push({
        orderDate: '2026-04-26',
        region: 'Europe',
        customerName: 'Global Retail Partners',
        productCategory: 'Laptops',
        revenue: 17300,
        orderCount: 3
      })
      changeType = 'inserted'
    }

    nextState.lastRefreshUtc = '2026-04-17T12:30:00Z'
  }

  nextState.refreshVersion = currentVersion + 1

  return {
    nextState,
    changeType
  }
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
    res.end(JSON.stringify({ status: 'ok', service: 'ingestion-worker' }))
    return
  }

  if (req.url === '/refresh' && req.method === 'POST') {
    try {
      const requestBody = await readJsonBody(req)
      const currentState = readDemoState()
      const { nextState, changeType } = applyRefreshSimulation(
        currentState,
        requestBody?.scenarioId
      )

      writeDemoState(nextState)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: 'ok',
          message: 'Data refresh completed.',
          activeScenarioId: nextState.activeScenarioId,
          refreshVersion: nextState.refreshVersion,
          lastRefreshUtc: nextState.lastRefreshUtc,
          changeType
        })
      )
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: {
            message: error.message,
            code: 'INGESTION_REFRESH_FAILED'
          }
        })
      )
    }
    return
  }

  if (req.url === '/reset' && req.method === 'POST') {
    try {
      const requestBody = await readJsonBody(req)
      const resetState = resetDemoState(requestBody?.scenarioId)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: 'ok',
          message: 'Dataset state reset completed.',
          activeScenarioId: resetState.activeScenarioId,
          refreshVersion: resetState.refreshVersion,
          lastRefreshUtc: resetState.lastRefreshUtc
        })
      )
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: {
            message: error.message,
            code: 'INGESTION_RESET_FAILED'
          }
        })
      )
    }
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: 'ingestion-worker is running' }))
})

server.listen(PORT, () => {
  console.log(`ingestion-worker listening on port ${PORT}`)
})