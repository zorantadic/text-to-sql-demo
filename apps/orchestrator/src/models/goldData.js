const defaultSalesSummaryRows = [
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

const retailPushSalesSummaryRows = [
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

const enterpriseExpansionSalesSummaryRows = [
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

const scenarioRowsMap = {
  baseline: defaultSalesSummaryRows,
  regional_growth: retailPushSalesSummaryRows,
  enterprise_accounts: enterpriseExpansionSalesSummaryRows
}

export function getScenarioSalesSummaryRows(scenarioId = 'baseline') {
  return scenarioRowsMap[scenarioId] || scenarioRowsMap.baseline
}

export const goldFreshness = {
  layer: 'Gold',
  provider: 'curated-gold-layer',
  lastRefreshUtc: '2026-04-16T09:00:00Z',
  status: 'ready'
}