import OpenAI from 'openai'

const azureOpenAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT
const azureOpenAiApiKey = process.env.AZURE_OPENAI_API_KEY
const azureOpenAiApiVersion =
  process.env.AZURE_OPENAI_API_VERSION || '2024-10-21'
const azureOpenAiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT

let clientInstance = null

export function getAzureOpenAiConfig() {
  return {
    endpoint: azureOpenAiEndpoint || '',
    apiKeyPresent: Boolean(azureOpenAiApiKey),
    apiVersion: azureOpenAiApiVersion,
    deployment: azureOpenAiDeployment || ''
  }
}

export function isAzureOpenAiConfigured() {
  return Boolean(
    azureOpenAiEndpoint &&
      azureOpenAiApiKey &&
      azureOpenAiApiVersion &&
      azureOpenAiDeployment
  )
}

export function getAzureOpenAiClient() {
  if (!isAzureOpenAiConfigured()) {
    throw new Error(
      'Azure OpenAI is not fully configured. Required env vars: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_VERSION, AZURE_OPENAI_DEPLOYMENT.'
    )
  }

  if (!clientInstance) {
    clientInstance = new OpenAI({
      apiKey: azureOpenAiApiKey,
      baseURL: `${azureOpenAiEndpoint}/openai/deployments/${azureOpenAiDeployment}`,
      defaultQuery: {
        'api-version': azureOpenAiApiVersion
      },
      defaultHeaders: {
        'api-key': azureOpenAiApiKey
      }
    })
  }

  return clientInstance
}