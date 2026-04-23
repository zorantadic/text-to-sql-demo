import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const demoStateFilePath = path.resolve(__dirname, '../../../../data/dataset-state.json')

function readDemoState() {
  const raw = fs.readFileSync(demoStateFilePath, 'utf-8')
  return JSON.parse(raw)
}

export function getGoldSalesSummaryRows(scenarioId = 'baseline') {
  const demoState = readDemoState()
  const scenario = demoState?.scenarios?.[scenarioId] || demoState?.scenarios?.baseline

  return scenario?.salesSummaryRows || []
}

export function getGoldFreshness() {
  const demoState = readDemoState()

  return {
    layer: 'Gold',
    provider: 'curated-gold-layer',
    lastRefreshUtc: demoState?.lastRefreshUtc || 'N/A',
    status: 'ready',
    refreshVersion: demoState?.refreshVersion ?? 0
  }
}