export async function generateSqlFromQuestion({
  question,
  resolvedScenario,
  questionType,
  sqlMode,
  allowedGoldObjects,
  schemaContext,
  businessRules,
  promptPreview
}) {
  const generatedSql = buildSqlForQuestion(question)
  const validationStatus = validateGeneratedSql({
    generatedSql,
    allowedGoldObjects
  })
  const executionTarget = buildExecutionTarget(allowedGoldObjects)

  return {
    mode: 'sql-generation',
    resolvedScenario: resolvedScenario || 'baseline',
    questionType: questionType || 'sales-summary',
    sqlMode: sqlMode || 'full-summary',
    generatedSql,
    validationStatus,
    executionTarget,
    promptPreview: buildPromptPreview({
      question,
      resolvedScenario,
      questionType,
      sqlMode,
      allowedGoldObjects,
      schemaContext,
      businessRules,
      promptPreview
    })
  }
}

function normalizeQuestion(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase()
}

function buildSqlForQuestion(question) {
  const normalized = normalizeQuestion(question)

  if (normalized.includes('top category') || normalized.includes('top product category')) {
    return 'SELECT productCategory, SUM(revenue) AS totalRevenue, SUM(orderCount) AS totalOrders FROM Gold.SalesSummary GROUP BY productCategory ORDER BY totalRevenue DESC;'
  }

  if (normalized.includes('top customer')) {
    return 'SELECT customerName, region, SUM(revenue) AS totalRevenue, SUM(orderCount) AS totalOrders FROM Gold.SalesSummary GROUP BY customerName, region ORDER BY totalRevenue DESC;'
  }

  if (normalized.includes('top region')) {
    return 'SELECT region, SUM(revenue) AS totalRevenue, SUM(orderCount) AS totalOrders FROM Gold.SalesSummary GROUP BY region ORDER BY totalRevenue DESC;'
  }

  if (normalized.includes('europe')) {
    return "SELECT orderDate, region, customerName, productCategory, revenue, orderCount FROM Gold.SalesSummary WHERE region = 'Europe';"
  }

  return 'SELECT orderDate, region, customerName, productCategory, revenue, orderCount FROM Gold.SalesSummary;'
}

function validateGeneratedSql({ generatedSql, allowedGoldObjects }) {
  const sql = typeof generatedSql === 'string' ? generatedSql.trim() : ''
  const approvedObjects = Array.isArray(allowedGoldObjects) ? allowedGoldObjects : []

  if (!sql) {
    return 'Rejected'
  }

  if (!sql.toUpperCase().startsWith('SELECT ')) {
    return 'Rejected'
  }

  if (!approvedObjects.length) {
    return 'Approved'
  }

  const matchesApprovedObject = approvedObjects.some(objectName => sql.includes(objectName))

  return matchesApprovedObject ? 'Approved' : 'Rejected'
}

function buildExecutionTarget(allowedGoldObjects) {
  if (Array.isArray(allowedGoldObjects) && allowedGoldObjects.length > 0) {
    return allowedGoldObjects[0]
  }

  return 'Gold.SalesSummary'
}

function buildPromptPreview({
  question,
  resolvedScenario,
  questionType,
  sqlMode,
  allowedGoldObjects,
  schemaContext,
  businessRules,
  promptPreview
}) {
  if (typeof promptPreview === 'string' && promptPreview.trim()) {
    return promptPreview
  }

  const normalizedAllowedGoldObjects = Array.isArray(allowedGoldObjects)
    ? allowedGoldObjects
    : []
  const normalizedSchemaContext = Array.isArray(schemaContext) ? schemaContext : []
  const normalizedBusinessRules = Array.isArray(businessRules) ? businessRules : []

  return [
    'You are generating SQL for an enterprise Text-to-SQL system.',
    '',
    'Question:',
    question || '',
    '',
    'Resolved scenario:',
    resolvedScenario || 'baseline',
    '',
    'Question type:',
    questionType || 'sales-summary',
    '',
    'SQL mode:',
    sqlMode || 'full-summary',
    '',
    'Allowed Gold objects:',
    ...normalizedAllowedGoldObjects,
    '',
    'Schema context:',
    ...normalizedSchemaContext,
    '',
    'Business rules / guardrails:',
    ...normalizedBusinessRules,
    '',
    'Return only the SQL query.'
  ].join('\n')
}