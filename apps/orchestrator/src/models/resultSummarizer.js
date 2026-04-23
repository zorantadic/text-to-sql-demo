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

function detectSummaryShape(rows) {
  const firstRow = rows?.[0]

  if (!firstRow) {
    return 'empty'
  }

  if (typeof firstRow.productCategory === 'string' && typeof firstRow.totalRevenue === 'number') {
    return 'category-ranked'
  }

  if (typeof firstRow.customerName === 'string' && typeof firstRow.totalRevenue === 'number') {
    return 'customer-ranked'
  }

  if (typeof firstRow.region === 'string' && typeof firstRow.totalRevenue === 'number') {
    return 'region-ranked'
  }

  return 'detail'
}

export function summarizeRows(rows) {
  if (!rows || rows.length === 0) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      topRegion: 'N/A',
      primaryDimensionLabel: 'Top Region',
      primaryDimensionValue: 'N/A'
    }
  }

  const totalRevenue = rows.reduce((sum, row) => sum + getRevenueValue(row), 0)
  const totalOrders = rows.reduce((sum, row) => sum + getOrderValue(row), 0)
  const shape = detectSummaryShape(rows)

  if (shape === 'category-ranked') {
    const topRow = rows[0]

    return {
      totalRevenue,
      totalOrders,
      topRegion: 'N/A',
      primaryDimensionLabel: 'Top Category',
      primaryDimensionValue: topRow?.productCategory || 'N/A'
    }
  }

  if (shape === 'customer-ranked') {
    const topRow = rows[0]

    return {
      totalRevenue,
      totalOrders,
      topRegion: topRow?.region || 'N/A',
      primaryDimensionLabel: 'Top Customer',
      primaryDimensionValue: topRow?.customerName || 'N/A'
    }
  }

  if (shape === 'region-ranked') {
    const topRow = rows[0]

    return {
      totalRevenue,
      totalOrders,
      topRegion: topRow?.region || 'N/A',
      primaryDimensionLabel: 'Top Region',
      primaryDimensionValue: topRow?.region || 'N/A'
    }
  }

  const totalsByRegion = rows.reduce((acc, row) => {
    const region = row.region || 'Unknown'
    acc[region] = (acc[region] || 0) + getRevenueValue(row)
    return acc
  }, {})

  const topRegion =
    Object.entries(totalsByRegion).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  return {
    totalRevenue,
    totalOrders,
    topRegion,
    primaryDimensionLabel: 'Top Region',
    primaryDimensionValue: topRegion
  }
}