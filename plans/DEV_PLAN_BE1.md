# GGRAS Development Plan: Backend Developer (BE-1)

## Role Overview

| Attribute | Details |
|-----------|---------|
| **Role** | Backend Developer |
| **ID** | BE-1 |
| **Duration** | 12 Weeks (3 Months) |
| **Primary Focus** | Ingestion Gateway, Event Storage/Processing, Operator Management, Compliance APIs |
| **Secondary Focus** | Operator SDK, Rules Configuration API, Reporting/Exports, Integration with Lead-owned crypto/ledger/PII services |
| **Tech Stack** | NestJS (TypeScript), PostgreSQL, TimescaleDB, Redis, RabbitMQ |

---

## Microservices Architecture Alignment

**Deployment Model:** Kubernetes + standard service mesh (Istio/Linkerd) with mTLS, retries, and tracing.

**Service Ownership (BE-1):**
- ingestion-service (event intake, validation, batching)
- event-store-service (append-only storage, status)
- operator-service (registration, keys, certificates)
- compliance-service (cases, notices, penalties)
- rules-service (versioned rules API)
- reporting-service (dashboards + exports)

**Integration:** Coordinates with Lead-owned verification/ledger/PII services via internal APIs and async events.


## Core Responsibilities

1. **Ingestion Gateway** - Build the core event receiving infrastructure
2. **Raw Event Store** - Implement append-only immutable storage
3. **Event Processing Pipeline** - Queueing, consumers, retries, DLQ handling
4. **Operator Management** - Registration, keys, certificates, onboarding
5. **Compliance APIs** - Case management, notices, penalties
6. **Rules Configuration API** - Versioned rules and approvals (FE-1 UI integration)
7. **Reporting/Export APIs** - Dashboard and export data access
8. **Operator SDK** - Client library for operator integration

---

## Module Ownership

| Module | Role | Priority |
|--------|------|----------|
| Ingestion Gateway | Primary | Critical |
| Raw Event Store | Primary | Critical |
| Event Processing Pipeline | Primary | Critical |
| Operator Management | Primary | High |
| Reporting/Export APIs | Primary | High |
| Rules Configuration API | Primary | Medium |
| Compliance APIs | Primary | Medium |
| Cryptographic Verification | Secondary (Lead Primary) | Critical |
| Merkle Tree/Ledger | Secondary (Lead Primary) | Critical |
| Revenue Calculator | Secondary (Lead Primary) | High |
| Privacy Controls | Secondary (Lead Primary) | High |
| Operator SDK | Primary | High |
| Rules Configuration UI | Secondary (FE-1 Primary) | Medium |

---

# Phase 1: Foundation (Weeks 1-4)

## Week 1: Project Setup & Core Infrastructure

### Weekly Milestone
- [ ] NestJS project scaffolded with all core modules
- [ ] Database schema designed and migrations created
- [ ] Basic authentication and authorization implemented
- [ ] CI/CD pipeline integrated for backend
- [ ] API documentation framework established

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Initialize NestJS application with TypeScript strict mode | Critical | 2h | `apps/backend/` scaffold |
| Configure NestJS modules structure (core, events, auth) | Critical | 2h | Module architecture |
| Set up TypeORM with PostgreSQL connection | Critical | 2h | Database connectivity |
| Configure environment variables handling | High | 1h | `.env` configuration |
| Create initial README for backend | Medium | 30m | `apps/backend/README.md` |

**Code Deliverables:**
```
apps/backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── config.module.ts
│   │   └── database.config.ts
│   ├── common/
│   │   ├── filters/
│   │   ├── guards/
│   │   └── interceptors/
│   └── modules/
│       ├── auth/
│       ├── events/
│       └── operators/
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Design raw_events table schema | Critical | 2h | Migration file |
| Design operators table schema | Critical | 1h | Migration file |
| Design event_sequences table for tracking | High | 1h | Migration file |
| Design audit_logs table schema | High | 1h | Migration file |
| Implement database migration system | Critical | 2h | Migration tooling |
| Run initial migrations | High | 30m | Database initialized |

**Schema: raw_events**
```sql
CREATE TABLE raw_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES operators(id),
    event_id VARCHAR(64) NOT NULL UNIQUE,
    event_type VARCHAR(32) NOT NULL, -- 'stake', 'payout', 'refund'
    sequence_number BIGINT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    game_type VARCHAR(64),
    player_hash VARCHAR(64), -- pseudonymized player ID
    event_timestamp TIMESTAMPTZ NOT NULL,
    received_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signature VARCHAR(512),
    signature_verified BOOLEAN,
    raw_payload JSONB NOT NULL,
    event_hash VARCHAR(64), -- SHA-256 of canonicalized event
    merkle_root_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_operator_sequence UNIQUE (operator_id, sequence_number)
);

-- TimescaleDB hypertable for time-series optimization
SELECT create_hypertable('raw_events', 'event_timestamp');
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement Operators module (CRUD) | Critical | 3h | Operators service |
| Create operator registration endpoint | High | 2h | POST /operators |
| Implement API key generation for operators | Critical | 2h | Key generation service |
| Add operator status management | Medium | 1h | Status tracking |

**API Endpoints:**
- `POST /api/v1/operators` - Register new operator
- `GET /api/v1/operators/:id` - Get operator details
- `PUT /api/v1/operators/:id` - Update operator
- `POST /api/v1/operators/:id/api-keys` - Generate API key
- `DELETE /api/v1/operators/:id/api-keys/:keyId` - Revoke API key

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement JWT authentication module | Critical | 3h | Auth guard |
| Create API key authentication strategy | Critical | 2h | API key guard |
| Implement rate limiting middleware | High | 2h | Rate limiter |
| Add request logging interceptor | Medium | 1h | Request logging |

**Authentication Flow:**
```
1. Admin Users: JWT tokens (NextAuth compatible)
2. Operator Systems: API Key + mTLS
3. Rate Limits: 100 req/s per operator (configurable)
```

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Set up Swagger/OpenAPI documentation | High | 2h | `/api/docs` endpoint |
| Create health check endpoints | High | 1h | Health checks |
| Implement basic error handling | High | 2h | Error filters |
| Write unit tests for auth module | High | 2h | Test coverage |
| Create PR and request review | High | 30m | PR submitted |

---

## Week 2: Ingestion Gateway Core

### Weekly Milestone
- [ ] Event ingestion endpoint fully functional
- [ ] Schema validation implemented
- [ ] Basic rate limiting operational
- [ ] Event queuing system configured
- [ ] Initial performance benchmarks established

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Design event ingestion API contract | Critical | 2h | OpenAPI spec |
| Implement event DTO with validation | Critical | 2h | Event DTOs |
| Create event validation pipe | Critical | 2h | Validation pipe |
| Set up class-validator decorators | High | 1.5h | Validation rules |

**Event DTO:**
```typescript
export class IngestEventDto {
  @IsUUID()
  eventId: string;

  @IsEnum(EventType)
  eventType: 'stake' | 'payout' | 'refund';

  @IsInt()
  @Min(1)
  sequenceNumber: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsISO4217CurrencyCode()
  currency: string;

  @IsString()
  @MaxLength(64)
  gameType: string;

  @IsString()
  @MaxLength(64)
  playerHash: string;

  @IsISO8601()
  eventTimestamp: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement Events module structure | Critical | 2h | Events module |
| Create EventsController with POST endpoint | Critical | 2h | Ingestion endpoint |
| Implement EventsService core logic | Critical | 3h | Event processing |
| Integrate with idempotency/dedup service (Lead) | High | 1h | Idempotency hook |

**API Endpoint:**
```
POST /api/v1/events/ingest
Headers:
  - X-API-Key: operator API key
  - X-Operator-ID: operator UUID
  - Content-Type: application/json
Body: IngestEventDto[]
Response:
  - 202 Accepted: { accepted: number, rejected: EventError[] }
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Set up RabbitMQ connection | Critical | 2h | Queue connectivity |
| Implement event queue producer | Critical | 2h | Queue producer |
| Create event processing consumer | Critical | 2h | Queue consumer |
| Add dead letter queue for failures | High | 1.5h | DLQ configured |

**Queue Architecture:**
```
Producer (Ingestion) → events.ingest → Consumer (Processing)
                    ↓ (on failure)
               events.dlq → Manual review
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement batch event ingestion | Critical | 3h | Batch endpoint |
| Add transaction support for batches | Critical | 2h | Transaction handling |
| Implement sequence number validation | Critical | 2h | Sequence checking |
| Create sequence gap detection | High | 1h | Gap alerts |

**Sequence Validation Rules:**
```
1. Each operator maintains independent sequence
2. Sequence must be monotonically increasing
3. Gaps > 1 generate warning alert
4. Duplicates are handled by idempotency service (Lead)
5. Out-of-order events queued for reordering
```

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write integration tests for ingestion | High | 3h | Integration tests |
| Performance benchmark: target 10K events/sec | High | 2h | Benchmark results |
| Document ingestion API | Medium | 1.5h | API documentation |
| Create PR and request review | High | 30m | PR submitted |

---

## Week 3: Event Storage & Processing Pipeline

### Weekly Milestone
- [ ] Raw event store append-only semantics verified
- [ ] Event processing pipeline with retries and DLQ operational
- [ ] Event status tracking and reprocessing workflow defined

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Finalize raw_events indexes and partitions | Critical | 3h | Optimized schema |
| Configure Timescale policies (chunking/retention) | High | 2h | Retention policy |
| Define processing status fields | High | 1.5h | Status spec |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement event persistence service | Critical | 3h | Persisted events |
| Add transaction boundaries for batches | Critical | 2h | Transaction logic |
| Create event status table/enum | High | 1.5h | Status model |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement consumer pipeline with retries | Critical | 3h | Consumer pipeline |
| Configure DLQ handling and replay | High | 2h | DLQ workflow |
| Add back-pressure controls | High | 1.5h | Throttling behavior |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement event status APIs | High | 2h | Status endpoints |
| Add processing metrics and logs | High | 2h | Observability |
| Define reprocessing workflow | Medium | 2h | Reprocess runbook |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Integration tests for pipeline | High | 3h | Test suite |
| Performance profiling and tuning | High | 2h | Perf report |
| Documentation and PR | High | 2h | PR submitted |

---

## Week 4: Compliance & Rules APIs

### Weekly Milestone
- [ ] Rules versioning and approval workflow operational
- [ ] Compliance case management API available
- [ ] Notice generation system functional
- [ ] Phase 1 integration verified

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Design rules schema (tax rates, exemptions) | Critical | 2h | Rules schema |
| Implement rules versioning system | Critical | 3h | Version control |
| Create rules API endpoints | High | 2h | Rules CRUD |
| Add rules approval workflow | High | 1h | Approval status |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Design compliance case schema | High | 2h | Case schema |
| Implement ComplianceCase entity | High | 2h | Case entity |
| Create case management service | High | 3h | Case service |
| Add case status workflow | High | 1h | Status workflow |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement notice generation system | High | 3h | Notice service |
| Create notice templates | High | 2h | Notice templates |
| Add notice delivery tracking | Medium | 2h | Delivery tracking |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement compliance audit log endpoints | High | 2h | Audit APIs |
| Add penalty assessment API | High | 2h | Penalty API |
| Add RBAC checks for compliance roles | High | 2h | Access controls |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write rules/compliance tests | High | 2h | Test coverage |
| Integration test: events -> compliance workflow | High | 2h | E2E test |
| Phase 1 documentation | High | 2h | Phase 1 docs |
| Demo preparation and PR | High | 2h | Ready for demo |

---

## Week 5: Operator SDK Foundation

### Weekly Milestone
- [ ] SDK architecture designed
- [ ] Core SDK library implemented
- [ ] SDK documentation started
- [ ] Integration test harness ready

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Design SDK architecture and API | Critical | 3h | SDK design doc |
| Initialize SDK package (TypeScript) | Critical | 2h | `packages/operator-sdk/` |
| Define SDK configuration interface | High | 1.5h | Config types |
| Set up SDK build pipeline | High | 1.5h | Build config |

**SDK Structure:**
```
packages/operator-sdk/
├── src/
│   ├── index.ts
│   ├── client.ts
│   ├── config.ts
│   ├── types/
│   │   ├── events.ts
│   │   └── responses.ts
│   ├── crypto/
│   │   ├── signer.ts
│   │   └── keys.ts
│   ├── transport/
│   │   ├── http.ts
│   │   └── retry.ts
│   └── buffer/
│       └── local-queue.ts
├── tests/
└── package.json
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement GGRASClient main class | Critical | 3h | Client class |
| Create event builder utilities | High | 2h | Event builders |
| Implement configuration validation | High | 2h | Config validation |
| Add TypeScript strict typing | High | 1h | Type safety |

**SDK Client Interface:**
```typescript
export class GGRASClient {
  constructor(config: GGRASConfig);

  // Event submission
  async submitEvent(event: GameEvent): Promise<SubmitResult>;
  async submitBatch(events: GameEvent[]): Promise<BatchResult>;

  // Connection management
  async connect(): Promise<void>;
  async disconnect(): Promise<void>;

  // Health and status
  async healthCheck(): Promise<HealthStatus>;
  async getSubmissionStatus(eventId: string): Promise<EventStatus>;
}
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement ECDSA signing in SDK | Critical | 3h | Signing module |
| Add key loading and management | Critical | 2h | Key management |
| Create signature generation | High | 2h | Signature generation |
| Validate signature format with Lead spec | Critical | 1h | Signature tests |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement HTTP transport layer | Critical | 3h | HTTP client |
| Add automatic retry with backoff | High | 2h | Retry logic |
| Implement connection pooling | High | 2h | Connection pool |
| Add request/response logging | Medium | 1h | SDK logging |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement local buffer queue | High | 3h | Buffer queue |
| Add offline resilience | High | 2h | Offline support |
| Write SDK unit tests | High | 2h | SDK tests |
| Create PR and documentation | High | 1h | PR submitted |

---

## Week 6: Reporting & Admin Data Access

### Weekly Milestone
- [ ] Reporting endpoints for dashboards available
- [ ] Data export jobs operational
- [ ] PII-safe data access aligned with Lead-owned vault

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Define reporting KPIs with FE teams | High | 2h | KPI list |
| Implement summary report endpoints | High | 3h | Summary APIs |
| Add pagination and filtering helpers | Medium | 2h | Query helpers |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Build operator performance endpoints (non-revenue) | High | 3h | Operator reports |
| Add time-range and aggregation options | Medium | 2h | Aggregations |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement CSV export jobs | High | 3h | Export jobs |
| Add export status tracking | Medium | 2h | Export status |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Integrate PII-safe export via Lead vault | High | 3h | PII-safe export |
| Add audit logging for exports | High | 2h | Export audit logs |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write reporting/export tests | High | 2h | Test coverage |
| Update reporting API docs | Medium | 2h | Docs updated |
| Review with FE teams | High | 1.5h | Review notes |

---

## Week 7: Operator Connector SDK Completion

### Weekly Milestone
- [ ] SDK feature complete
- [ ] SDK documentation complete
- [ ] Integration testing suite ready
- [ ] NPM package prepared

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement certificate management in SDK | Critical | 3h | Cert handling |
| Add mTLS support | Critical | 2h | mTLS client |
| Create certificate rotation utilities | High | 2h | Cert rotation |
| Test certificate workflows | High | 1h | Cert tests |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Add event validation in SDK | High | 2h | SDK validation |
| Implement event batching logic | High | 2h | Batching |
| Add compression for large batches | Medium | 2h | Compression |
| Create event status polling | High | 2h | Status polling |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Write comprehensive SDK documentation | Critical | 4h | SDK docs |
| Create usage examples | High | 2h | Examples |
| Add troubleshooting guide | Medium | 1.5h | Troubleshooting |

**SDK Documentation Structure:**
```
docs/operator-sdk/
├── getting-started.md
├── configuration.md
├── authentication.md
├── event-submission.md
├── error-handling.md
├── offline-mode.md
├── security.md
├── api-reference.md
└── examples/
    ├── basic-integration.ts
    ├── batch-submission.ts
    └── error-recovery.ts
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create SDK integration test suite | Critical | 4h | Integration tests |
| Test with mock operator scenarios | High | 2h | Mock tests |
| Performance testing SDK | High | 2h | SDK benchmarks |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Prepare NPM package configuration | High | 2h | Package config |
| Version and changelog management | High | 1h | Versioning |
| Final SDK review | High | 2h | SDK review |
| Create release PR | High | 2h | Release PR |
| Demo preparation | High | 1h | Demo ready |

---

## Week 8: Integration Testing & Bug Fixes

### Weekly Milestone
- [ ] Full system integration tested
- [ ] All critical bugs fixed
- [ ] Performance optimized
- [ ] Phase 2 demo delivered

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| End-to-end integration testing | Critical | 4h | E2E tests |
| Identify and document bugs | High | 2h | Bug list |
| Prioritize bug fixes | High | 1h | Priority list |
| Start critical bug fixes | Critical | 1h | Fixes started |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Fix critical bugs (batch 1) | Critical | 4h | Bugs fixed |
| Fix high priority bugs | High | 3h | Bugs fixed |
| Update tests for fixes | High | 1h | Tests updated |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Performance profiling | High | 3h | Profile results |
| Database query optimization | High | 2h | Query tuning |
| API response time optimization | High | 2h | API optimization |
| Memory usage optimization | Medium | 1h | Memory tuning |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Fix remaining bugs | High | 3h | Bugs fixed |
| Final integration verification | Critical | 2h | All tests pass |
| Documentation updates | High | 2h | Docs updated |
| Prepare demo | High | 1h | Demo ready |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Phase 2 Demo participation | Critical | 2h | Demo delivered |
| Phase 2 retrospective | High | 1h | Lessons learned |
| Phase 3 planning participation | High | 2h | Phase 3 planned |
| PR cleanup and merge | High | 2h | Code merged |

---

# Phase 3: Production Readiness (Weeks 9-12)

## Week 9: Security Hardening

### Weekly Milestone
- [ ] Security hardening complete
- [ ] Penetration testing support
- [ ] Performance optimization finalized
- [ ] Production configuration ready

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Security audit of all endpoints | Critical | 3h | Audit report |
| Input validation hardening | Critical | 2h | Validation improved |
| SQL injection prevention verification | Critical | 2h | SQLi verified |
| XSS prevention verification | Critical | 1h | XSS verified |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Rate limiting hardening | High | 2h | Rate limits |
| DDoS protection configuration | High | 2h | DDoS protection |
| API abuse prevention | High | 2h | Abuse prevention |
| Security logging enhancement | High | 2h | Security logs |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Support penetration testing | Critical | 4h | Pentest support |
| Fix identified vulnerabilities | Critical | 3h | Vulns fixed |
| Security documentation | High | 1h | Security docs |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Production configuration review | Critical | 2h | Config reviewed |
| Secrets management verification | Critical | 2h | Secrets verified |
| Database security hardening | Critical | 2h | DB security |
| Network security review | High | 2h | Network reviewed |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final security checklist | Critical | 2h | Checklist complete |
| Security sign-off preparation | Critical | 2h | Sign-off ready |
| Documentation updates | High | 2h | Docs updated |
| Weekly review | High | 2h | Review complete |

---

## Week 10: Pilot Deployment Support

### Weekly Milestone
- [ ] Production deployment supported
- [ ] Pilot operators integrated
- [ ] Production issues resolved
- [ ] System stability verified

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Production deployment support | Critical | 4h | Deployment support |
| Post-deployment verification | Critical | 2h | Verification |
| Production monitoring review | High | 2h | Monitoring checked |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Pilot operator 1 integration support | Critical | 4h | Integration support |
| SDK troubleshooting | High | 2h | Issues resolved |
| Production issue monitoring | High | 2h | Issues tracked |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Pilot operator 2 integration support | Critical | 4h | Integration support |
| Production bug fixes | High | 2h | Bugs fixed |
| Performance monitoring | High | 2h | Performance verified |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Additional operator support | High | 3h | Support provided |
| Production optimization | High | 2h | Optimization |
| Documentation updates | Medium | 2h | Docs updated |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Week 1 pilot review | High | 2h | Review complete |
| Issue analysis | High | 2h | Analysis done |
| Improvement planning | High | 2h | Improvements planned |
| Weekly demo | High | 2h | Demo delivered |

---

## Week 11: Pilot Iteration

### Weekly Milestone
- [ ] Pilot feedback addressed
- [ ] Performance improvements deployed
- [ ] Additional operators onboarded
- [ ] System stability confirmed

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Address pilot feedback (backend) | Critical | 4h | Feedback addressed |
| Deploy improvements | High | 2h | Improvements live |
| Monitor deployment | High | 2h | Deployment stable |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Performance optimization deployment | High | 3h | Optimizations live |
| Database tuning | High | 2h | DB optimized |
| Cache optimization | Medium | 2h | Cache tuned |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Support additional operators | High | 4h | Operators supported |
| SDK improvements based on feedback | High | 2h | SDK improved |
| Documentation updates | Medium | 2h | Docs updated |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Scale testing | High | 3h | Scale verified |
| Stability monitoring | High | 2h | Stability confirmed |
| Compliance verification | High | 2h | Compliance verified |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Pilot status review | High | 2h | Status reviewed |
| Prepare final release | High | 2h | Release prepared |
| Weekly demo | High | 2h | Demo delivered |
| Documentation finalization | High | 2h | Docs final |

---

## Week 12: Final Release & Handover

### Weekly Milestone
- [ ] Final release deployed
- [ ] All documentation complete
- [ ] Knowledge transfer done
- [ ] Project handover complete

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final release preparation | Critical | 3h | Release ready |
| Final testing | Critical | 2h | Tests pass |
| Release notes | High | 2h | Release notes |
| Pre-release review | High | 1h | Review complete |

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final release deployment | Critical | 3h | Release deployed |
| Post-release verification | Critical | 2h | Verified |
| Knowledge transfer: Backend architecture | High | 3h | KT session 1 |

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Knowledge transfer: APIs and SDK | High | 3h | KT session 2 |
| Knowledge transfer: Operations | High | 2h | KT session 3 |
| Runbook finalization | High | 2h | Runbooks final |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final documentation review | High | 2h | Docs reviewed |
| Code documentation completion | High | 2h | Code docs done |
| Support handover | High | 2h | Handover done |
| Project retrospective participation | High | 2h | Retrospective |

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Final stakeholder presentation support | High | 2h | Presentation |
| Project sign-off | Critical | 1h | Sign-off |
| Archive and cleanup | Medium | 2h | Cleanup done |
| Team celebration! | High | 3h | Celebrate! |

---

## API Endpoints Summary

### Events Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/events/ingest` | Single event ingestion |
| POST | `/api/v1/events/batch` | Batch event ingestion |
| GET | `/api/v1/events/:id` | Get event details |
| GET | `/api/v1/events/:id/status` | Get event processing status |

### Reports Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports/summary` | High-level metrics summary |
| GET | `/api/v1/reports/operators` | Operator activity summary |
| POST | `/api/v1/reports/export` | Create export job |
| GET | `/api/v1/reports/export/:id` | Export job status |

### Rules Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/rules` | List all rules |
| POST | `/api/v1/rules` | Create new rule |
| GET | `/api/v1/rules/:id` | Get rule details |
| PUT | `/api/v1/rules/:id` | Update rule |
| POST | `/api/v1/rules/:id/approve` | Approve rule |

### Compliance Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/compliance/cases` | List compliance cases |
| POST | `/api/v1/compliance/cases` | Create case |
| GET | `/api/v1/compliance/cases/:id` | Get case details |
| PUT | `/api/v1/compliance/cases/:id` | Update case |
| POST | `/api/v1/compliance/notices` | Generate notice |

### Operators Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/operators` | List operators |
| POST | `/api/v1/operators` | Register operator |
| GET | `/api/v1/operators/:id` | Get operator details |
| POST | `/api/v1/operators/:id/api-keys` | Generate API key |
| POST | `/api/v1/operators/:id/certificates` | Upload certificate |

### Audit Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/audit/logs` | Get audit logs |

---

## Definition of Done

### For Each Task:
- [ ] Code implemented following NestJS best practices
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests where applicable
- [ ] API documented in OpenAPI spec
- [ ] Error handling implemented
- [ ] Logging added appropriately
- [ ] Security checklist verified
- [ ] Code reviewed and approved
- [ ] PR merged to develop branch

---

## Notes

- Always follow TypeScript strict mode
- Use DTOs for all API inputs/outputs
- Implement proper error handling with custom exceptions
- Log all significant operations
- Never log sensitive data (PII, secrets)
- Follow the established API versioning strategy
- Coordinate with AI team on data pipeline interfaces
- Coordinate with Frontend team on API contracts

## Service Catalog Appendix (BE-1)

| Service | Purpose | Interfaces |
|---------|---------|------------|
| ingestion-service | Intake, validation, batching | OpenAPI + events |
| event-store-service | Append-only storage, status | OpenAPI + events |
| operator-service | Operators, keys, certs | OpenAPI |
| compliance-service | Cases, notices, penalties | OpenAPI |
| rules-service | Rules versions/approvals | OpenAPI |
| reporting-service | Dashboards + exports | OpenAPI |

**Events (AsyncAPI):** event.ingested, event.rejected, event.processed, report.export.ready

