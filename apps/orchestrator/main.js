import 'dotenv/config'
import http from 'http'
import {
  buildAnswerSynthesisContext,
  synthesizeAnswerFromRows
} from './models/answerSynthesizer.js'
import { summarizeRows } from './models/resultSummarizer.js'
import { getGoldFreshness } from './sql/goldDataProvider.js'
import { executeMockGoldQuery } from './sql/queryExecutor.js'
import { classifyQuestion } from './sql/questionClassifier.js'
import { buildSqlGenerationContext } from './sql/queryPlanner.js'
import { generateSqlFromQuestion } from './ai/sqlGenerator.js'

const PORT =
  process.env.WEBSITES_PORT ||
  process.env.PORT ||
  process.env.CONTAINER_APP_PORT ||
  3002

const SERVICE_NAME = process.env.SERVICE_NAME || 'orchestrator'
const CLOUD_ENVIRONMENT = process.env.CLOUD_ENVIRONMENT || 'azure'
const DEPLOYMENT_SLOT = process.env.DEPLOYMENT_SLOT || 'production'
const INSTANCE_ID =
  process.env.HOSTNAME ||
  process.env.CONTAINER_APP_REPLICA_NAME ||
  'orchestrator-instance'

function buildRuntimeMetadata() {
  return {
    service: SERVICE_NAME,
    environment: CLOUD_ENVIRONMENT,
    slot: DEPLOYMENT_SLOT,
    instanceId: INSTANCE_ID,
    port: PORT
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''

    req.on('data', chunk => {
      raw += chunk
    })

    req.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })

    req.on('error', reject)
  })
}

async function buildMockQueryResponse(requestBody) {
  const { question, scenarioId, scenarioMode, sql, rows } = executeMockGoldQuery(requestBody)
  const freshness = getGoldFreshness()
  const summary = summarizeRows(rows)
  const { questionType, sqlMode } = classifyQuestion(question)

  const sqlGenerationContext = buildSqlGenerationContext(question)

  const sqlGenerationResult = await generateSqlFromQuestion({
    question,
    resolvedScenario: sqlGenerationContext.resolvedScenario || scenarioId,
    questionType,
    sqlMode,
    allowedGoldObjects: sqlGenerationContext.allowedGoldObjects,
    schemaContext: sqlGenerationContext.schemaContext,
    businessRules: sqlGenerationContext.businessRules,
    promptPreview: sqlGenerationContext.promptPreview
  })

  const answerSynthesisContext = buildAnswerSynthesisContext({
    question,
    resolvedScenario: sqlGenerationContext.resolvedScenario || scenarioId,
    questionType,
    sql,
    rows,
    summary
  })

  return {
    answer: synthesizeAnswerFromRows(rows, question),
    sql,
    rows,
    summary,
    trace: {
      provider: 'text-to-sql-orchestrator',
      step: 'query-processing',
      answerMode: 'generated-answer',
      receivedQuestion: question || 'No question provided',
      scenarioId,
      scenarioMode,
      questionType,
      sqlMode,
      rowCount: rows.length
    },
    freshness,
    orchestration: {
      sqlGenerationInput: {
        question: sqlGenerationContext.question,
        resolvedScenario: sqlGenerationContext.resolvedScenario,
        questionType: sqlGenerationContext.questionType,
        sqlMode: sqlGenerationContext.sqlMode,
        allowedGoldObjects: sqlGenerationContext.allowedGoldObjects,
        schemaContext: sqlGenerationContext.schemaContext,
        businessRules: sqlGenerationContext.businessRules,
        promptPreview: sqlGenerationContext.promptPreview
      },
      sqlGenerationOutput: {
        generatedSql: sqlGenerationResult.generatedSql,
        validationStatus: sqlGenerationResult.validationStatus,
        executionTarget: sqlGenerationResult.executionTarget
      },
      answerSynthesisInput: {
        question: answerSynthesisContext.question,
        resolvedScenario: answerSynthesisContext.resolvedScenario,
        questionType: answerSynthesisContext.questionType,
        sql: answerSynthesisContext.sql,
        rowsPreview: answerSynthesisContext.rowsPreview,
        summary: answerSynthesisContext.summary,
        answerInstructions: answerSynthesisContext.answerInstructions,
        promptPreview: answerSynthesisContext.promptPreview
      }
    }
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'orchestrator' }))
    return
  }

  if (req.url === '/query' && req.method === 'POST') {
    try {
      const requestBody = await readJsonBody(req)
      const responsePayload = await buildMockQueryResponse(requestBody)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(responsePayload))
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: {
            message: error.message,
            code: 'ORCHESTRATOR_BAD_REQUEST'
          }
        })
      )
    }
    return
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: 'orchestrator is running' }))
})

server.listen(PORT, () => {
  const runtime = buildRuntimeMetadata()
  console.log(
    `${runtime.service} listening on port ${runtime.port} (${runtime.environment}, ${runtime.slot}, ${runtime.instanceId})`
  )
})