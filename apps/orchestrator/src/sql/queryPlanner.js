export function normalizeQuestion(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export function buildSqlForQuestion(question) {
  const normalized = normalizeQuestion(question).toLowerCase()

  if (normalized.includes('top category') || normalized.includes('top product category')) {
    return 'SELECT productCategory, SUM(revenue) AS totalRevenue, SUM(orderCount) AS totalOrders FROM Gold.SalesSummary GROUP BY productCategory ORDER BY totalRevenue DESC;'
  }

  if (normalized.includes('top customer')) {
    return 'SELECT customerName, SUM(revenue) AS totalRevenue, SUM(orderCount) AS totalOrders FROM Gold.SalesSummary GROUP BY customerName ORDER BY totalRevenue DESC;'
  }

  if (normalized.includes('europe')) {
    return "SELECT orderDate, region, customerName, productCategory, revenue, orderCount FROM Gold.SalesSummary WHERE region = 'Europe';"
  }

  if (normalized.includes('top region')) {
    return 'SELECT region, SUM(revenue) AS totalRevenue, SUM(orderCount) AS totalOrders FROM Gold.SalesSummary GROUP BY region ORDER BY totalRevenue DESC;'
  }

  return 'SELECT orderDate, region, customerName, productCategory, revenue, orderCount FROM Gold.SalesSummary;'
}

function buildTopRegionRows(rows) {
  const grouped = rows.reduce((acc, row) => {
    const region = row.region || 'Unknown'

    if (!acc[region]) {
      acc[region] = {
        region,
        totalRevenue: 0,
        totalOrders: 0
      }
    }

    acc[region].totalRevenue += row.revenue || 0
    acc[region].totalOrders += row.orderCount || 0

    return acc
  }, {})

  return Object.values(grouped).sort((a, b) => b.totalRevenue - a.totalRevenue)
}

function buildTopCustomerRows(rows) {
  const grouped = rows.reduce((acc, row) => {
    const customerName = row.customerName || 'Unknown'

    if (!acc[customerName]) {
      acc[customerName] = {
        customerName,
        region: row.region || 'Unknown',
        totalRevenue: 0,
        totalOrders: 0
      }
    }

    acc[customerName].totalRevenue += row.revenue || 0
    acc[customerName].totalOrders += row.orderCount || 0

    return acc
  }, {})

  return Object.values(grouped).sort((a, b) => b.totalRevenue - a.totalRevenue)
}

function buildTopCategoryRows(rows) {
  const grouped = rows.reduce((acc, row) => {
    const productCategory = row.productCategory || 'Unknown'

    if (!acc[productCategory]) {
      acc[productCategory] = {
        productCategory,
        totalRevenue: 0,
        totalOrders: 0
      }
    }

    acc[productCategory].totalRevenue += row.revenue || 0
    acc[productCategory].totalOrders += row.orderCount || 0

    return acc
  }, {})

  return Object.values(grouped).sort((a, b) => b.totalRevenue - a.totalRevenue)
}

export function filterRowsForQuestion(rows, question) {
  const normalized = normalizeQuestion(question).toLowerCase()

  if (normalized.includes('top category') || normalized.includes('top product category')) {
    return buildTopCategoryRows(rows)
  }

  if (normalized.includes('top customer')) {
    return buildTopCustomerRows(rows)
  }

  if (normalized.includes('top region')) {
    return buildTopRegionRows(rows)
  }

  if (normalized.includes('europe')) {
    return rows.filter(row => row.region === 'Europe')
  }

  return rows
}

function resolveScenarioFromQuestion(question) {
  const normalized = normalizeQuestion(question).toLowerCase()

  if (
    normalized.includes('enterprise') ||
    normalized.includes('server') ||
    normalized.includes('infrastructure')
  ) {
    return 'enterprise_accounts'
  }

  if (
    normalized.includes('retail') ||
    normalized.includes('shop') ||
    normalized.includes('store') ||
    normalized.includes('laptop sales')
  ) {
    return 'regional_growth'
  }

  return 'baseline'
}

function detectQuestionType(question) {
  const normalized = normalizeQuestion(question).toLowerCase()

  if (normalized.includes('top category') || normalized.includes('top product category')) {
    return 'top-category'
  }

  if (normalized.includes('top customer')) {
    return 'top-customer'
  }

  if (normalized.includes('top region')) {
    return 'top-region'
  }

  if (normalized.includes('europe')) {
    return 'region-filtered-sales-summary'
  }

  return 'sales-summary'
}

function detectSqlMode(question) {
  const normalized = normalizeQuestion(question).toLowerCase()

  if (normalized.includes('top category') || normalized.includes('top product category')) {
    return 'category-ranked-summary'
  }

  if (normalized.includes('top customer')) {
    return 'customer-ranked-summary'
  }

  if (normalized.includes('top region')) {
    return 'grouped-summary'
  }

  if (normalized.includes('europe')) {
    return 'region-filtered-summary'
  }

  return 'full-summary'
}

function buildAllowedGoldObjects() {
  return ['Gold.SalesSummary']
}

function buildSchemaContext(question) {
  const normalized = normalizeQuestion(question).toLowerCase()

  if (normalized.includes('top category') || normalized.includes('top product category')) {
    return [
      'Approved analytical object: Gold.SalesSummary',
      'Relevant fields:',
      '- productCategory',
      '- revenue',
      '- orderCount',
      'Expected result shape:',
      '- productCategory',
      '- totalRevenue',
      '- totalOrders'
    ]
  }

  if (normalized.includes('top customer')) {
    return [
      'Approved analytical object: Gold.SalesSummary',
      'Relevant fields:',
      '- customerName',
      '- region',
      '- revenue',
      '- orderCount',
      'Expected result shape:',
      '- customerName',
      '- region',
      '- totalRevenue',
      '- totalOrders'
    ]
  }

  if (normalized.includes('top region')) {
    return [
      'Approved analytical object: Gold.SalesSummary',
      'Relevant fields:',
      '- region',
      '- revenue',
      '- orderCount',
      'Expected result shape:',
      '- region',
      '- totalRevenue',
      '- totalOrders'
    ]
  }

  return [
    'Approved analytical object: Gold.SalesSummary',
    'Relevant fields:',
    '- orderDate',
    '- region',
    '- customerName',
    '- productCategory',
    '- revenue',
    '- orderCount',
    'Expected result shape:',
    '- orderDate',
    '- region',
    '- customerName',
    '- productCategory',
    '- revenue',
    '- orderCount'
  ]
}

function buildBusinessRules(question) {
  const normalized = normalizeQuestion(question).toLowerCase()

  if (normalized.includes('top category') || normalized.includes('top product category')) {
    return [
      'Generate a SQL SELECT query only',
      'Use only approved Gold-layer objects',
      'Do not invent tables or columns',
      'Aggregate revenue and order counts by productCategory',
      'Return a category-ranked result',
      'Order by totalRevenue descending',
      'Return only SQL, with no markdown or explanation'
    ]
  }

  if (normalized.includes('top customer')) {
    return [
      'Generate a SQL SELECT query only',
      'Use only approved Gold-layer objects',
      'Do not invent tables or columns',
      'Aggregate revenue and order counts by customerName',
      'Return a customer-ranked result',
      'Order by totalRevenue descending',
      'Return only SQL, with no markdown or explanation'
    ]
  }

  if (normalized.includes('top region')) {
    return [
      'Generate a SQL SELECT query only',
      'Use only approved Gold-layer objects',
      'Do not invent tables or columns',
      'Aggregate revenue and order counts by region',
      'Return a region-ranked result',
      'Order by totalRevenue descending',
      'Return only SQL, with no markdown or explanation'
    ]
  }

  if (normalized.includes('europe')) {
    return [
      'Generate a SQL SELECT query only',
      'Use only approved Gold-layer objects',
      'Do not invent tables or columns',
      "Apply the filter region = 'Europe'",
      'Return detail rows',
      'Return only SQL, with no markdown or explanation'
    ]
  }

  return [
    'Generate a SQL SELECT query only',
    'Use only approved Gold-layer objects',
    'Do not invent tables or columns',
    'Return detail rows for the sales summary',
    'Return only SQL, with no markdown or explanation'
  ]
}

function buildPromptPreview({
  question,
  resolvedScenario,
  questionType,
  sqlMode,
  allowedGoldObjects,
  schemaContext,
  businessRules
}) {
  return [
    'You are generating SQL for an enterprise Text-to-SQL system.',
    '',
    `Question:`,
    question || '',
    '',
    `Resolved scenario:`,
    resolvedScenario,
    '',
    `Question type:`,
    questionType,
    '',
    `SQL mode:`,
    sqlMode,
    '',
    `Allowed Gold objects:`,
    ...allowedGoldObjects,
    '',
    `Schema context:`,
    ...schemaContext,
    '',
    `Business rules / guardrails:`,
    ...businessRules,
    '',
    'Return only the SQL query.'
  ].join('\n')
}

export function buildSqlGenerationContext(question) {
  const normalizedQuestion = normalizeQuestion(question)
  const resolvedScenario = resolveScenarioFromQuestion(normalizedQuestion)
  const questionType = detectQuestionType(normalizedQuestion)
  const sqlMode = detectSqlMode(normalizedQuestion)
  const allowedGoldObjects = buildAllowedGoldObjects()
  const schemaContext = buildSchemaContext(normalizedQuestion)
  const businessRules = buildBusinessRules(normalizedQuestion)
  const promptPreview = buildPromptPreview({
    question: normalizedQuestion,
    resolvedScenario,
    questionType,
    sqlMode,
    allowedGoldObjects,
    schemaContext,
    businessRules
  })

  return {
    question: normalizedQuestion,
    resolvedScenario,
    questionType,
    sqlMode,
    allowedGoldObjects,
    schemaContext,
    businessRules,
    promptPreview
  }
}