export function classifyQuestion(question = '') {
  const normalized = typeof question === 'string' ? question.trim().toLowerCase() : ''

  if (!normalized) {
    return {
      questionType: 'empty',
      sqlMode: 'full-summary'
    }
  }

  if (normalized.includes('top category') || normalized.includes('top product category')) {
    return {
      questionType: 'top-category',
      sqlMode: 'category-ranked-summary'
    }
  }

  if (normalized.includes('top customer')) {
    return {
      questionType: 'top-customer',
      sqlMode: 'customer-ranked-summary'
    }
  }

  if (normalized.includes('top region')) {
    return {
      questionType: 'top-region',
      sqlMode: 'grouped-summary'
    }
  }

  if (normalized.includes('europe')) {
    return {
      questionType: 'region-filtered-sales-summary',
      sqlMode: 'region-filtered-summary'
    }
  }

  return {
    questionType: 'sales-summary',
    sqlMode: 'full-summary'
  }
}