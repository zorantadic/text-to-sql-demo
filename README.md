# Text-to-SQL Demo

Enterprise-focused Azure text-to-SQL platform demonstrating orchestration, guarded SQL generation, and analytical query workflows over approved Gold-layer objects.

## What This Project Demonstrates

- Multi-service text-to-SQL application structure
- Orchestrated question processing and SQL generation flow
- Guardrails around approved analytical objects
- Separation of gateway, orchestration, ingestion, execution, and UI concerns
- Azure-ready configuration patterns for model and SQL connectivity

## Architecture

Main components:

- **web-ui**: browser-based query experience
- **api-gateway**: edge API that forwards requests to the orchestrator
- **orchestrator**: question classification, SQL planning, answer synthesis, and trace packaging
- **ingestion-worker**: dataset refresh/reset placeholder workflow
- **sql-execution-service**: SQL execution boundary and authentication abstraction

## Repository Structure

```text
apps/
  api-gateway/
  ingestion-worker/
  orchestrator/
  sql-execution-service/
  web-ui/
data/
docs/
infra/
shared/
