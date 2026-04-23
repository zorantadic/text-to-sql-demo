export function detectScenarioFromQuestion(question = '') {
  const normalized = typeof question === 'string' ? question.trim().toLowerCase() : ''

  if (
    normalized.includes('server') ||
    normalized.includes('storage') ||
    normalized.includes('enterprise') ||
    normalized.includes('infrastructure') ||
    normalized.includes('security')
  ) {
    return 'enterprise_accounts'
  }

  if (
    normalized.includes('retail') ||
    normalized.includes('store') ||
    normalized.includes('commerce') ||
    normalized.includes('push campaign')
  ) {
    return 'regional_growth'
  }

  return 'baseline'
}

export function resolveScenario(requestBody = {}) {
  const rawScenarioId =
    typeof requestBody?.scenarioId === 'string' ? requestBody.scenarioId.trim() : ''

  if (rawScenarioId && rawScenarioId !== 'auto') {
    return {
      scenarioId: rawScenarioId,
      scenarioMode: 'manual-override'
    }
  }

  return {
    scenarioId: detectScenarioFromQuestion(requestBody?.question || ''),
    scenarioMode: 'auto-detected'
  }
}