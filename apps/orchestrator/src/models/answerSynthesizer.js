function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

function getRevenueValue(row) {
  if (typeof row?.revenue === 'number') {
    return row.revenue
  }

  if (typeof row?.totalRevenue === 'number') {
    return row.totalRevenue
  }

  return 0
}

function getOrderValue(row) {
  if (typeof row?.orderCount === 'number') {
    return row.orderCount
  }

  if (typeof row?.totalOrders === 'number') {
    return row.totalOrders
  }

  return 0
}

function detectQuestionKind(question = '') {
  const normalized = typeof question === 'string' ? question.trim().toLowerCase() : ''

  if (normalized.includes('top category') || normalized.includes('top product category')) {
    return 'top-category'
  }

  if (normalized.includes('top customer')) {
    return 'top-customer'
  }

  if (normalized.includes('top region')) {
    return 'top-region'
  }

  return 'summary'
}

function buildRowsPreview(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }

  return rows.slice(0, 5).map((row, index) => {
    if (typeof row?.customerName === 'string' && typeof row?.totalRevenue === 'number') {
      return `${index + 1}. customerName = ${row.customerName}, region = ${row.region || 'Unknown'}, totalRevenue = ${row.totalRevenue}, totalOrders = ${row.totalOrders || 0}`
    }

    if (typeof row?.productCategory === 'string' && typeof row?.totalRevenue === 'number') {
      return `${index + 1}. productCategory = ${row.productCategory}, totalRevenue = ${row.totalRevenue}, totalOrders = ${row.totalOrders || 0}`
    }

    if (
      typeof row?.region === 'string' &&
      typeof row?.totalRevenue === 'number' &&
      typeof row?.customerName !== 'string'
    ) {
      return `${index + 1}. region = ${row.region}, totalRevenue = ${row.totalRevenue}, totalOrders = ${row.totalOrders || 0}`
    }

    return `${index + 1}. orderDate = ${row.orderDate || 'N/A'}, region = ${row.region || 'Unknown'}, customerName = ${row.customerName || 'Unknown'}, productCategory = ${row.productCategory || 'Unknown'}, revenue = ${row.revenue || 0}, orderCount = ${row.orderCount || 0}`
  })
}

function buildAnswerInstructions(questionKind) {
  if (questionKind === 'top-region') {
    return [
      'Base the answer only on the returned query results',
      'Do not invent business values',
      'Identify the top region from the first ranked row',
      'Include region, revenue, and total orders',
      'Keep the answer concise and business-facing'
    ]
  }

  if (questionKind === 'top-customer') {
    return [
      'Base the answer only on the returned query results',
      'Do not invent business values',
      'Identify the top customer from the first ranked row',
      'Include customer name, region, revenue, and total orders',
      'Keep the answer concise and business-facing'
    ]
  }

  if (questionKind === 'top-category') {
    return [
      'Base the answer only on the returned query results',
      'Do not invent business values',
      'Identify the top category from the first ranked row',
      'Include category, revenue, and total orders',
      'Keep the answer concise and business-facing'
    ]
  }

  return [
    'Base the answer only on the returned query results',
    'Do not invent business values',
    'Summarize row count, total revenue, total orders, and top region',
    'Keep the answer concise and business-facing'
  ]
}

function buildSummaryLines(summary) {
  if (!summary || typeof summary !== 'object') {
    return []
  }

  return Object.entries(summary).map(([key, value]) => `${key} = ${value}`)
}

function buildAnswerPromptPreview({
  question,
  resolvedScenario,
  questionType,
  sql,
  rowsPreview,
  summary,
  answerInstructions
}) {
  const summaryLines = buildSummaryLines(summary)

  return [
    'You are generating the final business answer for an enterprise Text-to-SQL system.',
    '',
    'Original question:',
    question || '',
    '',
    'Resolved scenario:',
    resolvedScenario || 'baseline',
    '',
    'Question type:',
    questionType || 'sales-summary',
    '',
    'SQL used:',
    sql || '',
    '',
    'Returned results:',
    ...rowsPreview,
    '',
    'Summary:',
    ...summaryLines,
    '',
    'Rules:',
    ...answerInstructions
  ].join('\n')
}

export function buildAnswerSynthesisContext({
  question,
  resolvedScenario,
  questionType,
  sql,
  rows,
  summary
}) {
  const questionKind = detectQuestionKind(question)
  const rowsPreview = buildRowsPreview(rows)
  const answerInstructions = buildAnswerInstructions(questionKind)
  const promptPreview = buildAnswerPromptPreview({
    question,
    resolvedScenario,
    questionType,
    sql,
    rowsPreview,
    summary,
    answerInstructions
  })

  return {
    question: typeof question === 'string' ? question.trim() : '',
    resolvedScenario: resolvedScenario || 'baseline',
    questionType: questionType || 'sales-summary',
    sql: sql || '',
    rowsPreview,
    summary: summary || {},
    answerInstructions,
    promptPreview
  }
}

export function synthesizeAnswerFromRows(rows, question = '') {
  if (!rows || rows.length === 0) {
    return 'No matching data was returned for the submitted question.'
  }

  const totalRevenue = rows.reduce((sum, row) => sum + getRevenueValue(row), 0)
  const totalOrders = rows.reduce((sum, row) => sum + getOrderValue(row), 0)
  const questionKind = detectQuestionKind(question)
  const normalizedQuestion = typeof question === 'string' ? question.trim() : 'the submitted question'

  if (questionKind === 'top-region') {
    const topRow = rows[0]

    return `For "${normalizedQuestion}", the top region is ${topRow?.region || 'Unknown'} with ${formatCurrency(topRow?.totalRevenue || 0)} in revenue and ${topRow?.totalOrders || 0} total orders.`
  }

  if (questionKind === 'top-customer') {
    const topRow = rows[0]

    return `For "${normalizedQuestion}", the top customer is ${topRow?.customerName || 'Unknown'} in region ${topRow?.region || 'Unknown'}, with ${formatCurrency(topRow?.totalRevenue || 0)} in revenue and ${topRow?.totalOrders || 0} total orders.`
  }

  if (questionKind === 'top-category') {
    const topRow = rows[0]

    return `For "${normalizedQuestion}", the top category is ${topRow?.productCategory || 'Unknown'} with ${formatCurrency(topRow?.totalRevenue || 0)} in revenue and ${topRow?.totalOrders || 0} total orders.`
  }

  const totalsByRegion = rows.reduce((acc, row) => {
    const region = row.region || 'Unknown'
    acc[region] = (acc[region] || 0) + getRevenueValue(row)
    return acc
  }, {})

  const topRegion =
    Object.entries(totalsByRegion).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  return `For "${normalizedQuestion}", ${rows.length} rows were returned from the Gold layer. Total revenue is ${formatCurrency(totalRevenue)}, total orders are ${totalOrders}, and the top region is ${topRegion}.`
}