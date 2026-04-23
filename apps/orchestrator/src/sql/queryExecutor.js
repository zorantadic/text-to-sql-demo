import { getGoldSalesSummaryRows } from './goldDataProvider.js'
import { buildSqlForQuestion, filterRowsForQuestion, normalizeQuestion } from './queryPlanner.js'
import { resolveScenario } from './scenarioResolver.js'

export function executeMockGoldQuery(requestBody) {
  const question = normalizeQuestion(requestBody?.question)
  const { scenarioId, scenarioMode } = resolveScenario(requestBody)

  const allRows = getGoldSalesSummaryRows(scenarioId)
  const sql = buildSqlForQuestion(question)
  const rows = filterRowsForQuestion(allRows, question)

  return {
    question,
    scenarioId,
    scenarioMode,
    sql,
    rows
  }
}