import { useState } from 'react'
import './styles/app.css'

const API_URL = 'http://localhost:3001/api/query'
const REFRESH_URL = 'http://localhost:3003/refresh'
const RESET_URL = 'http://localhost:3003/reset'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

function getSqlMode(responseData) {
  return responseData?.trace?.sqlMode || 'full-summary'
}

function renderListItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return <div className="kv-value">N/A</div>
  }

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#334155',
            padding: '8px 10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px'
          }}
        >
          {item}
        </div>
      ))}
    </div>
  )
}

function renderSummaryObject(summaryObject) {
  if (!summaryObject || typeof summaryObject !== 'object') {
    return <div className="kv-value">N/A</div>
  }

  const entries = Object.entries(summaryObject)

  if (!entries.length) {
    return <div className="kv-value">N/A</div>
  }

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      {entries.map(([key, value]) => (
        <div
          key={key}
          style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#334155',
            padding: '8px 10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px'
          }}
        >
          <strong>{key}</strong>: {String(value)}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [question, setQuestion] = useState('Show Europe sales summary')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')
  const [responseData, setResponseData] = useState(null)

  async function runQueryRequest({ nextQuestion }) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: nextQuestion,
        sessionId: 's1',
        scenarioId: 'auto'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Request failed')
    }

    setResponseData(data)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await runQueryRequest({
        nextQuestion: question
      })
    } catch (requestError) {
      setError(requestError.message)
      setResponseData(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    setError('')

    try {
      const refreshResponse = await fetch(REFRESH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenarioId: responseData?.trace?.scenarioId || 'baseline'
        })
      })

      const refreshData = await refreshResponse.json()

      if (!refreshResponse.ok) {
        throw new Error(refreshData?.error?.message || 'Refresh failed')
      }

      await runQueryRequest({
        nextQuestion: question
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setRefreshing(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    setError('')

    try {
      const resetResponse = await fetch(RESET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenarioId: responseData?.trace?.scenarioId || 'baseline'
        })
      })

      const resetData = await resetResponse.json()

      if (!resetResponse.ok) {
        throw new Error(resetData?.error?.message || 'Reset failed')
      }

      await runQueryRequest({
        nextQuestion: question
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setResetting(false)
    }
  }

  const summary = responseData?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    topRegion: 'N/A',
    primaryDimensionLabel: 'Top Region',
    primaryDimensionValue: 'N/A'
  }

  const effectiveScenarioId = responseData?.trace?.scenarioId || 'auto'
  const sqlMode = getSqlMode(responseData)
  const groupedByRegionMode = sqlMode === 'grouped-summary'
  const groupedByCustomerMode = sqlMode === 'customer-ranked-summary'
  const groupedByCategoryMode = sqlMode === 'category-ranked-summary'

  const sqlGenerationInput = responseData?.orchestration?.sqlGenerationInput || {}
  const sqlGenerationOutput = responseData?.orchestration?.sqlGenerationOutput || {}
  const answerSynthesisInput = responseData?.orchestration?.answerSynthesisInput || {}

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">Enterprise Data & AI</div>
          <h1>Text-to-SQL Platform</h1>
        </div>
        <div className="topbar-badge">{`Gold Layer · ${effectiveScenarioId}`}</div>
      </header>

      <div className="layout-grid">
        <aside className="column left-column">
          <section className="panel">
            <div className="panel-header">
              <h2>Question Input</h2>
              <span className="panel-tag">UI</span>
            </div>

            <form onSubmit={handleSubmit} className="question-form">
              <label htmlFor="question" className="field-label">
                Business Question
              </label>

              <textarea
                id="question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="question-textarea"
                rows={5}
              />

              <div className="button-row" style={{ gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading || refreshing || resetting}
                >
                  {loading ? 'Running...' : 'Run Query'}
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={handleRefresh}
                  disabled={loading || refreshing || resetting}
                  style={{
                    background: '#ffffff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe'
                  }}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={handleReset}
                  disabled={loading || refreshing || resetting}
                  style={{
                    background: '#ffffff',
                    color: '#b91c1c',
                    border: '1px solid #fecaca'
                  }}
                >
                  {resetting ? 'Resetting...' : 'Reset Data'}
                </button>
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Interaction Summary</h2>
              <span className="panel-tag">Session</span>
            </div>

            <div className="kv-list">
              <div className="kv-item">
                <span className="kv-label">Session ID</span>
                <span className="kv-value">s1</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Scenario</span>
                <span className="kv-value">{effectiveScenarioId}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Scenario Mode</span>
                <span className="kv-value">{responseData?.trace?.scenarioMode || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Question Type</span>
                <span className="kv-value">{responseData?.trace?.questionType || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">SQL Mode</span>
                <span className="kv-value">{responseData?.trace?.sqlMode || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">State</span>
                <span className="kv-value">
                  {loading ? 'Running' : refreshing ? 'Refreshing' : resetting ? 'Resetting' : 'Ready'}
                </span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Rows Returned</span>
                <span className="kv-value">{responseData?.rows?.length || 0}</span>
              </div>
            </div>
          </section>

          <section className="panel answer-panel">
            <div className="panel-header">
              <h2>Final Answer</h2>
              <span className="panel-tag">Answer</span>
            </div>

            {error ? <div className="error-box">{error}</div> : null}

            <div className="answer-content">
              {responseData?.answer || 'No answer yet. Run a query to see the AI response.'}
            </div>
          </section>
        </aside>

        <main className="column center-column">
          <section className="panel">
            <div className="panel-header">
              <h2>SQL Generation Input</h2>
              <span className="panel-tag">AI Input</span>
            </div>

            <div className="kv-list">
              <div className="kv-item">
                <span className="kv-label">Question</span>
                <span className="kv-value">{sqlGenerationInput.question || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Resolved Scenario</span>
                <span className="kv-value">{sqlGenerationInput.resolvedScenario || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Question Type</span>
                <span className="kv-value">{sqlGenerationInput.questionType || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">SQL Mode</span>
                <span className="kv-value">{sqlGenerationInput.sqlMode || 'N/A'}</span>
              </div>
              <div className="kv-item" style={{ display: 'block' }}>
                <span className="kv-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Allowed Gold Objects
                </span>
                {renderListItems(sqlGenerationInput.allowedGoldObjects)}
              </div>
              <div className="kv-item" style={{ display: 'block' }}>
                <span className="kv-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Schema Context
                </span>
                {renderListItems(sqlGenerationInput.schemaContext)}
              </div>
              <div className="kv-item" style={{ display: 'block' }}>
                <span className="kv-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Business Rules / Guardrails
                </span>
                {renderListItems(sqlGenerationInput.businessRules)}
              </div>
              <div className="kv-item" style={{ display: 'block' }}>
                <span className="kv-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Prompt Preview
                </span>
                <pre className="sql-block" style={{ margin: 0 }}>
                  {sqlGenerationInput.promptPreview || 'No SQL generation prompt yet.'}
                </pre>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Generated SQL</h2>
              <span className="panel-tag">SQL</span>
            </div>

            <pre className="sql-block">
              {responseData?.sql || 'No SQL generated yet.'}
            </pre>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>SQL Generation Output</h2>
              <span className="panel-tag">AI Output</span>
            </div>

            <div className="kv-list">
              <div className="kv-item">
                <span className="kv-label">Generated SQL</span>
                <span className="kv-value">
                  {sqlGenerationOutput.generatedSql ? 'Available' : 'N/A'}
                </span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Validation Status</span>
                <span className="kv-value">{sqlGenerationOutput.validationStatus || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Execution Target</span>
                <span className="kv-value">{sqlGenerationOutput.executionTarget || 'N/A'}</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Query Summary</h2>
              <span className="panel-tag">Metrics</span>
            </div>

            <div className="summary-grid">
              <div className="metric-card">
                <span className="metric-label">Total Revenue</span>
                <strong className="metric-value">{formatCurrency(summary.totalRevenue || 0)}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">Total Orders</span>
                <strong className="metric-value">{summary.totalOrders || 0}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">{summary.primaryDimensionLabel || 'Top Region'}</span>
                <strong className="metric-value">{summary.primaryDimensionValue || 'N/A'}</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Query Results</h2>
              <span className="panel-tag">Rows</span>
            </div>

            <div className="table-wrapper">
              {groupedByCategoryMode ? (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Total Revenue</th>
                      <th>Total Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseData?.rows?.length ? (
                      responseData.rows.map((row, index) => (
                        <tr key={`${row.productCategory}-${index}`}>
                          <td>{row.productCategory}</td>
                          <td>{formatCurrency(row.totalRevenue || 0)}</td>
                          <td>{row.totalOrders || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="empty-cell">
                          No rows yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : groupedByCustomerMode ? (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Region</th>
                      <th>Total Revenue</th>
                      <th>Total Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseData?.rows?.length ? (
                      responseData.rows.map((row, index) => (
                        <tr key={`${row.customerName}-${index}`}>
                          <td>{row.customerName}</td>
                          <td>{row.region}</td>
                          <td>{formatCurrency(row.totalRevenue || 0)}</td>
                          <td>{row.totalOrders || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="empty-cell">
                          No rows yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : groupedByRegionMode ? (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Region</th>
                      <th>Total Revenue</th>
                      <th>Total Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseData?.rows?.length ? (
                      responseData.rows.map((row, index) => (
                        <tr key={`${row.region}-${index}`}>
                          <td>{row.region}</td>
                          <td>{formatCurrency(row.totalRevenue || 0)}</td>
                          <td>{row.totalOrders || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="empty-cell">
                          No rows yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Order Date</th>
                      <th>Region</th>
                      <th>Customer</th>
                      <th>Category</th>
                      <th>Revenue</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseData?.rows?.length ? (
                      responseData.rows.map((row, index) => (
                        <tr key={`${row.customerName}-${row.orderDate}-${index}`}>
                          <td>{row.orderDate}</td>
                          <td>{row.region}</td>
                          <td>{row.customerName}</td>
                          <td>{row.productCategory}</td>
                          <td>{formatCurrency(row.revenue || 0)}</td>
                          <td>{row.orderCount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="empty-cell">
                          No rows yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Answer Synthesis Input</h2>
              <span className="panel-tag">AI Input</span>
            </div>

            <div className="kv-list">
              <div className="kv-item">
                <span className="kv-label">Question</span>
                <span className="kv-value">{answerSynthesisInput.question || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Resolved Scenario</span>
                <span className="kv-value">{answerSynthesisInput.resolvedScenario || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Question Type</span>
                <span className="kv-value">{answerSynthesisInput.questionType || 'N/A'}</span>
              </div>
              <div className="kv-item" style={{ display: 'block' }}>
                <span className="kv-label" style={{ display: 'block', marginBottom: '8px' }}>
                  SQL Used
                </span>
                <pre className="sql-block" style={{ margin: 0 }}>
                  {answerSynthesisInput.sql || 'No SQL available yet.'}
                </pre>
              </div>
              <div className="kv-item" style={{ display: 'block' }}>
                <span className="kv-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Returned Rows Preview
                </span>
                {renderListItems(answerSynthesisInput.rowsPreview)}
              </div>
              <div className="kv-item" style={{ display: 'block' }}>
                <span className="kv-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Summary Used
                </span>
                {renderSummaryObject(answerSynthesisInput.summary)}
              </div>
              <div className="kv-item" style={{ display: 'block' }}>
                <span className="kv-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Answer Rules
                </span>
                {renderListItems(answerSynthesisInput.answerInstructions)}
              </div>
              <div className="kv-item" style={{ display: 'block' }}>
                <span className="kv-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Prompt Preview
                </span>
                <pre className="sql-block" style={{ margin: 0 }}>
                  {answerSynthesisInput.promptPreview || 'No answer synthesis prompt yet.'}
                </pre>
              </div>
            </div>
          </section>
        </main>

        <aside className="column right-column">
          <section className="panel">
            <div className="panel-header">
              <h2>Query Trace</h2>
              <span className="panel-tag">Trace</span>
            </div>

            <div className="kv-list">
              <div className="kv-item">
                <span className="kv-label">Provider</span>
                <span className="kv-value">{responseData?.trace?.provider || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Step</span>
                <span className="kv-value">{responseData?.trace?.step || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Answer Mode</span>
                <span className="kv-value">{responseData?.trace?.answerMode || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Received Question</span>
                <span className="kv-value">{responseData?.trace?.receivedQuestion || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Scenario ID</span>
                <span className="kv-value">{responseData?.trace?.scenarioId || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Scenario Mode</span>
                <span className="kv-value">{responseData?.trace?.scenarioMode || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Question Type</span>
                <span className="kv-value">{responseData?.trace?.questionType || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">SQL Mode</span>
                <span className="kv-value">{responseData?.trace?.sqlMode || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Row Count</span>
                <span className="kv-value">{responseData?.trace?.rowCount ?? 'N/A'}</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Freshness</h2>
              <span className="panel-tag">Status</span>
            </div>

            <div className="kv-list">
              <div className="kv-item">
                <span className="kv-label">Layer</span>
                <span className="kv-value">{responseData?.freshness?.layer || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Provider</span>
                <span className="kv-value">{responseData?.freshness?.provider || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Last Refresh UTC</span>
                <span className="kv-value">{responseData?.freshness?.lastRefreshUtc || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Status</span>
                <span className="kv-value">{responseData?.freshness?.status || 'N/A'}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Refresh Version</span>
                <span className="kv-value">{responseData?.freshness?.refreshVersion ?? 'N/A'}</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Gold Source Status</h2>
              <span className="panel-tag">Data</span>
            </div>

            <div className="status-stack">
              <div className="status-card">
                <span className="status-title">Data Layer</span>
                <strong>Gold Layer</strong>
              </div>
              <div className="status-card">
                <span className="status-title">Provider</span>
                <strong>{responseData?.trace?.provider || 'N/A'}</strong>
              </div>
              <div className="status-card">
                <span className="status-title">Active Scenario</span>
                <strong>{effectiveScenarioId}</strong>
              </div>
              <div className="status-card">
                <span className="status-title">Scenario Mode</span>
                <strong>{responseData?.trace?.scenarioMode || 'N/A'}</strong>
              </div>
              <div className="status-card">
                <span className="status-title">Execution Path</span>
                <strong>Gateway → Orchestrator</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}