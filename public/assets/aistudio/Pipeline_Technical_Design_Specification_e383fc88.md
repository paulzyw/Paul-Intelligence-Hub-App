# Pipeline Technical Design Specification v1.1

## Document Control

| Item | Description |
|---|---|
| Product | RevOS |
| Module | Pipeline Assessment |
| Document | Pipeline Technical Design Specification |
| Version | 1.1 |
| Status | Draft — Implementation Baseline |
| Supersedes | Pipeline Technical Design Specification v1.0 |
| Primary Purpose | Define the technical architecture and implementation requirements for Pipeline Assessment |
| Related Assets | Pipeline Product Design Specification v1.1; Pipeline Reasoning Strategy Specification v1.1; Gemini Pipeline Reasoning System Prompt v1.1 |
| Authoritative JSON Assets | Pipeline_industry_configuration_JSON_v1.1.json; Pipeline_evidence_knowledge_base_v1.1.json; Pipeline_Assessment_Rules_v1.1.json |

---

# 1. Technical Vision and Objectives

## 1.1 Technical Vision

The RevOS Pipeline Assessment Engine is an AI-native pipeline intelligence system designed to continuously evaluate qualified sales opportunities, understand their commercial reality, assess winability, identify risks, and recommend strategic actions.

The system must integrate:

- Opportunity Qualification intelligence.
- Current pipeline and opportunity information.
- Pipeline Assessment Dimensions Framework (PADF).
- Industry and revenue-motion intelligence.
- Evidence Knowledge Base.
- SWOT Intelligence.
- Deterministic Pipeline Assessment Rules.
- Gemini contextual reasoning.
- Risk Intelligence.
- Winability assessment.
- TOWS strategic intelligence.
- Winning Strategy and execution recommendations.
- Historical assessment and outcome tracking.

The architecture must preserve the distinction between deterministic assessment, configurable intelligence, AI reasoning, and human decision-making.

## 1.2 Technical Objective

Transform:

```text
Qualified Opportunity Intelligence
             +
Current Pipeline Information
             +
Opportunity Evidence
             +
Industry Configuration
             +
Evidence Knowledge Base
             +
Assessment Rules
             +
Historical Intelligence
             |
             v
    Pipeline Assessment Orchestrator
             |
     +-------+--------+
     |                |
     v                v
Evidence and       Deterministic
Context Evaluation Rules Engine
     |                |
     +-------+--------+
             |
             v
       Gemini Reasoning
             |
             v
    Pipeline Intelligence
             |
     +-------+--------+
     |       |        |
     v       v        v
 Winability Risk   Strategy
     |       |        |
     +-------+--------+
             |
             v
     Assessment Snapshot
             |
             v
       User Interface
             |
             v
      Continuous Review
```

## 1.3 Core Technical Outcomes

The system must provide:

1. Reliable opportunity data inheritance.
2. Context-aware configuration resolution.
3. Structured opportunity evidence management.
4. Evidence-to-SWOT and evidence-to-PADF relationships.
5. Deterministic assessment execution.
6. Controlled Gemini reasoning.
7. Existing winability and Risk Intelligence integration.
8. TOWS-based strategic intelligence.
9. Actionable winning strategies.
10. Historical assessment traceability.
11. Continuous reassessment.
12. Secure multi-user and multi-tenant operation.

## 1.4 Architecture Principles

| Principle | Technical Requirement |
|---|---|
| Evidence First | Every analytical conclusion must be traceable to available evidence or explicitly identified as an inference. |
| Deterministic Integrity | Scores, calculations, thresholds, and rule outcomes must be produced by the Rules Engine, not Gemini. |
| Configuration Driven | Industry and revenue-motion behavior must be governed by versioned JSON configuration assets. |
| Context Aware | Assessment must use the resolved industry and revenue-motion context. |
| Modular Architecture | Evidence, PADF, SWOT, winability, risk, strategy, and reasoning must remain logically separated. |
| Explainability | Every important conclusion must retain its evidence and processing lineage. |
| Human Governance | Users must be able to review and update evidence and manage execution actions. |
| Historical Continuity | Each completed assessment must preserve a versioned and reproducible snapshot. |
| Extensibility | New industries, revenue motions, evidence objects, and intelligence capabilities must not require fundamental architectural redesign. |

---

# 2. Technical Environment and Implementation Baseline

## 2.1 Existing RevOS Technology Environment

The implementation should align with the existing RevOS application architecture.

| Layer | Existing Technology / Service |
|---|---|
| Frontend | React |
| Build System | Vite |
| Programming Language | TypeScript |
| Hosting | Wasmer.io |
| Deployment | GitHub Actions |
| Authentication | Supabase Auth |
| Application Backend | Supabase Edge Functions |
| Operational Database | Supabase PostgreSQL |
| File Storage | Supabase Storage |
| Vector / Semantic Retrieval | Existing Supabase vector capabilities |
| AI Reasoning | Google Gemini API |

The Pipeline Assessment module should be implemented as an integrated RevOS application module rather than as an independent application with a separate technology stack.

## 2.2 Architectural Deployment Principle

The frontend communicates with the backend through authenticated application interfaces.

```text
React + TypeScript Frontend
             |
             v
       Supabase Auth
             |
             v
    Supabase Edge Functions
             |
     +-------+---------+
     |       |         |
     v       v         v
PostgreSQL  Storage  Gemini API
     |
     v
Pipeline Intelligence Data
```

Important implementation requirements:

- Gemini API credentials must never be exposed in frontend code.
- Deterministic calculations must execute in trusted backend code.
- Configuration assets must be loaded and validated server-side.
- Users must only access data permitted by their tenant and role.
- Historical assessment records must be preserved independently of current opportunity data.
- The frontend must not independently calculate winability, risk-adjusted winability, dimension scores, or other Rules Engine outputs.

## 2.3 Architectural Separation

The system must maintain four distinct processing responsibilities.

| Processing Layer | Responsibility | Authority |
|---|---|---|
| Configuration Intelligence | Defines reusable industry, revenue-motion, evidence, and factor intelligence. | JSON configuration assets |
| Deterministic Assessment | Evaluates evidence, applies rules, and produces governed outputs. | Pipeline Assessment Rules Engine |
| AI Reasoning | Interprets evidence and deterministic results, explains implications, and develops contextual recommendations. | Gemini |
| Human Intelligence | Supplies evidence, validates information, reviews recommendations, and executes actions. | Authorized users |

No layer should silently assume the responsibilities of another.

---

# 3. High-Level System Architecture

## 3.1 Eight-Layer Architecture

Pipeline Assessment consists of eight logical layers.

```text
LAYER 8 — EXPERIENCE LAYER
Pipeline Overview
Opportunity Assessment Workspace
Evidence Intelligence
SWOT Intelligence
Risk Intelligence
TOWS and Winning Strategy
Historical Intelligence
             |
             v
LAYER 7 — AI REASONING LAYER
Gemini Pipeline Reasoning Engine
Prompt Assembly
Output Validation
Reasoning Traceability
             |
             v
LAYER 6 — DECISION INTELLIGENCE LAYER
Winability Engine
Risk Intelligence Engine
TOWS Intelligence
Winning Strategy Engine
             |
             v
LAYER 5 — DETERMINISTIC RULE LAYER
Pipeline Assessment Rules Engine
PADF Assessment
Evidence Evaluation
SWOT Integration Rules
Lifecycle Governance
             |
             v
LAYER 4 — EVIDENCE INTELLIGENCE LAYER
Evidence Normalization
Evidence Evaluation
Evidence-to-PADF Mapping
Evidence-to-SWOT Mapping
Evidence Lineage
             |
             v
LAYER 3 — CONFIGURATION INTELLIGENCE LAYER
Industry Configuration v1.1
Evidence Knowledge Base v1.1
Assessment Rules v1.1
Compatibility Registries
             |
             v
LAYER 2 — PIPELINE DATA LAYER
Opportunity Context
Evidence Records
Assessment Snapshots
Risk Records
Strategy and Action Records
Historical Records
             |
             v
LAYER 1 — INTEGRATION LAYER
Opportunity Qualification
CRM
ERP / Financial Systems
Customer Systems
Authorized External Sources
```

## 3.2 Core Technical Components

The following components should be implemented as logically separated services or modules.

| Component | Primary Responsibility |
|---|---|
| Pipeline Assessment Orchestrator | Coordinates assessment lifecycle and processing sequence. |
| Pipeline Data Inheritance Service | Receives and normalizes Opportunity Qualification intelligence. |
| Pipeline Context Resolution Engine | Resolves industry, revenue motion, and applicable configuration. |
| Evidence Management Service | Creates, updates, retrieves, and maintains opportunity evidence. |
| Evidence Intelligence Engine | Evaluates evidence and resolves its relationships with assessment factors and dimensions. |
| PADF Assessment Engine | Evaluates the eight PADF dimensions using authoritative rules. |
| SWOT Intelligence Engine | Evaluates the active SWOT factor set and evidence relationships. |
| Pipeline Assessment Rules Engine | Executes deterministic assessment logic and governs calculation outputs. |
| Winability Engine | Produces the authoritative winability outputs. |
| Risk Intelligence Engine | Evaluates formal risks and risk-adjusted winability. |
| TOWS Intelligence Engine | Identifies supported strategic combinations. |
| Winning Strategy Engine | Produces and manages strategic recommendations and actions. |
| Gemini Reasoning Engine | Produces contextual explanations and strategic reasoning. |
| Historical Intelligence Service | Maintains assessment snapshots and compares changes over time. |
| Configuration Governance Service | Controls configuration versions, validation, and activation. |

These are logical components. They do not necessarily need to become separate deployed microservices. The initial implementation may use modular Supabase Edge Functions and shared backend libraries.

---

# 4. Core Data Architecture

## 4.1 Data Architecture Principles

The data model must support:

- Opportunity-level intelligence.
- Evidence-level traceability.
- Multiple assessment executions.
- Configuration version control.
- PADF and SWOT relationships.
- Formal risk and strategy management.
- Historical comparisons.
- Multi-tenant security.
- Reproducibility of previous assessments.

The system must distinguish reusable knowledge objects from opportunity-specific evidence records.

## 4.2 Core Data Entities

The recommended logical data model includes the following entities.

### 4.2.1 Pipeline Opportunity

Represents an active commercial opportunity.

Core attributes:

| Field | Description |
|---|---|
| pipeline_id | Unique opportunity identifier |
| tenant_id | Tenant ownership |
| customer_id | Customer reference |
| opportunity_name | Opportunity name |
| industry_id | Canonical industry identifier |
| revenue_motion_id | Canonical revenue-motion identifier |
| deal_value | Current opportunity value |
| currency | Deal currency |
| sales_stage | Current sales stage |
| forecast_category | Current forecast classification, if available |
| expected_close_date | Expected closing date |
| opportunity_owner | Responsible sales owner |
| lifecycle_status | Active, Closed Won, Closed Lost, or other governed state |
| source_system | Originating system |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

The opportunity record represents the current commercial state, not the historical assessment result.

### 4.2.2 Opportunity Inheritance Record

Stores the Opportunity Qualification information received when the opportunity enters Pipeline Assessment.

Core attributes:

- inheritance_id
- pipeline_id
- source_qualification_id
- source_module
- inherited_payload
- inheritance_mapping_version
- inherited_at
- source_updated_at
- validation_status

The inherited information must remain traceable to its original qualification source.

The inheritance record must not be treated as an independently verified current commercial fact.

### 4.2.3 Evidence Record

Represents a specific evidence instance associated with an opportunity.

Core attributes:

| Field | Description |
|---|---|
| evidence_instance_id | Unique opportunity-specific evidence identifier |
| pipeline_id | Related opportunity |
| evidence_object_id | Reference to reusable Evidence Knowledge Base object, where applicable |
| evidence_type | Evidence classification |
| evidence_statement | Actual evidence information |
| source_type | Customer, internal, document, system, or other source |
| source_reference | Source identifier or reference |
| source_date | Date of original evidence |
| recorded_at | Date recorded in RevOS |
| recorded_by | User or system |
| verification_status | Verification state |
| evidence_quality | Evidence quality assessment |
| evidence_confidence | Evidence confidence, when available |
| customer_confirmed | Whether customer confirmation exists, if applicable |
| notes | Additional context |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

Important:

- Evidence records must preserve the original evidence statement.
- Reusable Evidence Knowledge Base objects must not be confused with actual opportunity evidence.
- A knowledge-base mapping does not prove that the corresponding evidence exists in an opportunity.
- Missing evidence must remain an unknown or evidence gap, not automatically become negative evidence.

### 4.2.4 Evidence-to-Intelligence Relationship

The relationship between evidence and intelligence factors must be stored separately from the evidence record.

Recommended attributes:

- relationship_id
- evidence_instance_id
- evidence_object_id
- target_factor_id
- target_dimension_id
- mapping_source
- mapping_relevance
- runtime_relationship
- runtime_polarity
- runtime_interpretation
- evaluation_reference
- created_at

The six runtime relationship types are:

- SUPPORTS
- CONTRADICTS
- QUALIFIES
- CONTEXTUALIZES
- GAP_SIGNAL
- CHANGE_SIGNAL

The five runtime polarity types are:

- POSITIVE
- NEGATIVE
- MIXED
- NEUTRAL
- UNDETERMINED

The implementation must preserve the distinction between:

1. Reusable knowledge-base mapping relevance.
2. Evidence quality.
3. Evidence confidence.
4. Runtime relationship.
5. Runtime polarity.
6. Factor assessment.
7. TOWS strategic relevance.

These concepts must not be collapsed into one generic evidence score.

### 4.2.5 Assessment Record

Represents one completed or attempted assessment execution.

Core attributes:

- assessment_id
- pipeline_id
- tenant_id
- assessment_sequence
- assessment_status
- assessment_timestamp
- trigger_type
- configuration_version
- evidence_kb_version
- rules_version
- reasoning_prompt_version
- model_identifier
- input_revision
- processing_status
- completion_timestamp
- created_by

Assessment status should distinguish at least:

- QUEUED
- PROCESSING
- COMPLETED
- PARTIALLY_COMPLETED
- FAILED
- CANCELLED

A failed assessment must not be presented as a successfully completed assessment.

### 4.2.6 PADF Assessment Record

Represents the result for each PADF dimension within an assessment.

Core attributes:

- assessment_id
- pipeline_id
- dimension_id
- dimension_name
- assessment_state
- deterministic_score, when applicable
- evidence_references
- key_strengths
- key_weaknesses
- business_implications
- recommended_actions
- evaluation_timestamp

The system must preserve all eight PADF dimensions.

### 4.2.7 SWOT Factor Assessment Record

Represents the assessment of an active SWOT factor.

Core attributes:

- assessment_id
- pipeline_id
- factor_id
- factor_type
- factor_layer
- factor_definition_version
- assessment_state
- supporting_evidence_references
- contradicting_evidence_references
- contextual_evidence_references
- evidence_gap_references
- evaluation_rationale
- confidence_reference, where supported
- related_dimension_ids

The factor layer must identify whether the factor originates from:

- Universal baseline.
- Revenue-motion override.
- Industry override.

### 4.2.8 Risk Record

Represents a formal Risk Intelligence output.

Core attributes:

- risk_instance_id
- assessment_id
- pipeline_id
- risk_id
- risk_category
- severity
- likelihood, if defined by the Rules Engine
- impact
- triggering_evidence
- risk_status
- mitigation_strategy
- mitigation_actions
- owner
- created_at
- updated_at

A SWOT weakness or threat must not automatically become a formal risk record.

Potential risk signals may be displayed separately until the governed Risk Intelligence process evaluates them.

### 4.2.9 Strategy Record

Represents a strategy generated by the existing Winning Strategy Engine or an approved TOWS integration.

Core attributes:

- strategy_instance_id
- assessment_id
- pipeline_id
- strategy_id
- strategy_category
- tows_type, where applicable
- strategic_objective
- strategic_rationale
- supporting_factor_ids
- supporting_evidence_ids
- related_risk_ids
- priority
- expected_impact
- feasibility
- dependencies
- strategy_status

### 4.2.10 Strategy Action Record

Represents an executable action.

Core attributes:

- action_id
- strategy_instance_id
- pipeline_id
- action_description
- action_owner
- priority
- target_date
- action_status
- completion_notes
- created_at
- updated_at

### 4.2.11 Assessment Snapshot

Represents the immutable historical result of an assessment.

The snapshot should preserve:

- Opportunity state at assessment time.
- Inherited qualification context.
- Evidence revision references.
- Resolved industry and revenue-motion configuration.
- Active SWOT factors.
- PADF results.
- Deterministic Rules Engine outputs.
- Base winability.
- Risk Intelligence outputs.
- Risk-adjusted winability.
- TOWS results.
- Winning Strategy outputs.
- Gemini reasoning output.
- Configuration and prompt versions.
- Processing metadata.

The historical snapshot must not change when the current opportunity or configuration is subsequently updated.

---

# 5. Configuration Intelligence Architecture

## 5.1 Authoritative Configuration Assets

The implementation must use the following assets as the authoritative configuration sources.

| Configuration Asset | Purpose |
|---|---|
| Pipeline_industry_configuration_JSON_v1.1.json | Industry, revenue-motion, and SWOT factor configuration |
| Pipeline_evidence_knowledge_base_v1.1.json | Reusable evidence definitions and evidence-to-intelligence mappings |
| Pipeline_Assessment_Rules_v1.1.json | Deterministic orchestration, evaluation, calculation, integration, and governance rules |

Additional structural references:

- Pipeline Assessment Dimensions Framework v1.0.
- Pipeline Assessment Data Inheritance Framework v1.0.
- Pipeline SWOT Intelligence Master Schema v1.0.

These assets must be treated as versioned configuration inputs, not as informal prompt instructions.

## 5.2 Configuration Loading

The Configuration Governance Service must:

1. Retrieve the requested configuration version.
2. Verify that the asset exists.
3. Validate its JSON structure.
4. Validate required identifiers and references.
5. Verify compatibility between configuration versions.
6. Resolve the applicable industry and revenue-motion context.
7. Record the resolved configuration versions in the assessment record.
8. Prevent assessment execution if a required configuration is invalid or incompatible.

Configuration loading should use a controlled server-side process.

The frontend must not independently resolve configuration inheritance.

## 5.3 Context Resolution and Inheritance

The system must apply the following inheritance sequence:

```text
Universal Baseline
        |
        v
Revenue Motion Override
        |
        v
Industry Override
        |
        v
Resolved Opportunity Context
```

More-specific configuration takes precedence over less-specific configuration where an override is defined.

The system must use explicit canonical identifiers and alias registries.

The six canonical revenue-motion identifiers are:

```text
RM01_Digital_Solution_Selling
RM02_Professional_Solution_Services
RM03_Digital_Transformation_OT
RM04_Engineering_Project_Solutions
RM05_Project_Procurement
RM06_Generic_Solution_Selling
```

Implementation requirements:

- Do not use array position to resolve identifiers.
- Do not use fuzzy matching for canonical IDs.
- Do not assume that legacy IDs are equivalent without an explicit alias mapping.
- Preserve the source identifier and resolved canonical identifier for traceability.
- Record which configuration layer supplied the final factor definition.

## 5.4 Active SWOT Factor Resolution

The Industry Configuration v1.1 contains 96 configured SWOT factor references:

| Configuration Layer | Configured Factor References |
|---|---:|
| Universal | 8 |
| Revenue Motion | 24 |
| Industry | 64 |
| Total | 96 |

For a resolved opportunity context, the expected active factor set is:

```text
8 Universal Factors
       +
4 Revenue-Motion Factors
       +
4 Industry-Specific Factors
       |
       v
16 Active SWOT Factors
```

The system must resolve the applicable factors according to the configuration inheritance rules.

The 96 configured factor references must not all be activated for every opportunity.

The user interface must distinguish:

- Total configured factor universe.
- Factors applicable to the current opportunity.
- Factors actually evaluated.
- Factors with evidence support.
- Factors with evidence gaps.

A configured factor is an analytical lens or hypothesis. It is not proof that the factor exists in the opportunity.

## 5.5 Evidence Knowledge Base Integration

The Evidence Knowledge Base v1.1 contains:

- 48 reusable evidence objects.
- 373 evidence-to-SWOT mappings.
- 169 DIRECT mappings.
- 87 SUPPORTING mappings.
- 117 INDIRECT mappings.
- Mapping coverage for 82 of the 96 configured factors.
- 14 factors intentionally without an approved mapping.

The system must preserve these distinctions.

Technical requirements:

1. Load evidence objects by their canonical identifiers.
2. Resolve mapping references using the explicit compatibility and normalization contract.
3. Preserve the distinction between `evidenceId` and `evidenceObjectId`.
4. Preserve mapping relevance and mapping strength.
5. Do not force mappings for the 14 unmapped factors.
6. Do not assume that the six evidence objects not referenced in the mapping catalogue are invalid.
7. Do not treat mapping relevance as evidence confidence.
8. Do not treat mapping strength as an assessment score.

When an active factor has no approved evidence mapping, the system should record this as a configuration or evidence-mapping limitation, not fabricate a relationship.

## 5.6 Confidence Scale Governance

The system must preserve the original scales:

| Concept | Scale |
|---|---|
| Evidence Knowledge Base confidence | 0–100 |
| Industry Configuration factor evidence_confidence | 1–5 ordinal |

These scales must not be converted into one another unless a formally approved conversion contract is introduced.

The UI must identify which confidence concept is being displayed.

---

# 6. Evidence Intelligence Architecture

## 6.1 Purpose

The Evidence Intelligence Engine converts opportunity information into structured, traceable evidence intelligence.

It is responsible for:

- Evidence normalization.
- Evidence classification.
- Evidence quality evaluation.
- Evidence confidence handling.
- Evidence-to-PADF relationships.
- Evidence-to-SWOT relationships.
- Runtime evidence interpretation.
- Evidence gap identification.
- Evidence provenance.

## 6.2 Evidence Processing Flow

```text
Opportunity Evidence
        |
        v
Evidence Record Creation
        |
        v
Evidence Normalization
        |
        v
Evidence Object Resolution
        |
        v
Evidence Quality Evaluation
        |
        v
PADF / SWOT Mapping Resolution
        |
        v
Runtime Relationship Evaluation
        |
        v
Runtime Polarity Evaluation
        |
        v
Evidence Intelligence Object
```

## 6.3 Evidence Evaluation Requirements

The system must distinguish the following:

### Evidence Quality

Evaluates the quality of the actual evidence.

Relevant considerations may include:

- Completeness.
- Recency.
- Source reliability.
- Directness.
- Verifiability.
- Customer confirmation.

The exact evaluation methodology must follow the authoritative Evidence Knowledge Base and Rules contracts.

### Evidence Confidence

Represents the confidence assigned to an evidence evaluation where supported by the authoritative methodology.

It must not be substituted for evidence quality.

### Runtime Relationship

Indicates how actual evidence relates to a particular factor or assessment dimension.

Supported values:

```text
SUPPORTS
CONTRADICTS
QUALIFIES
CONTEXTUALIZES
GAP_SIGNAL
CHANGE_SIGNAL
```

### Runtime Polarity

Indicates the interpreted direction of the evidence relationship.

Supported values:

```text
POSITIVE
NEGATIVE
MIXED
NEUTRAL
UNDETERMINED
```

Runtime relationship and runtime polarity must remain independent attributes.

## 6.4 Evidence Lineage

Every evaluated evidence relationship should be traceable through:

```text
Opportunity
    |
    v
Evidence Instance
    |
    v
Reusable Evidence Object
    |
    v
Knowledge Base Mapping
    |
    v
Runtime Interpretation
    |
    v
SWOT Factor / PADF Dimension
    |
    v
Assessment Result
    |
    v
Business Implication
```

The system should allow an authorized user to inspect this chain from the relevant UI component.

## 6.5 Evidence Gap Handling

Evidence gaps must be explicitly represented.

Examples:

- Required evidence has not been supplied.
- Evidence exists but is outdated.
- Evidence is incomplete.
- Evidence cannot be verified.
- Evidence is contradictory.
- No approved mapping exists.

Missing evidence must never automatically be interpreted as negative evidence.

An evidence gap may justify a recommended information-gathering action, but it must not be converted into an unsupported negative assessment.

---

# 7. PADF Assessment Architecture

## 7.1 PADF Framework

The Pipeline Assessment Dimensions Framework remains the authoritative eight-dimension assessment structure.

| ID | Dimension |
|---|---|
| PA1_Customer_Value_and_Urgency | Customer Value & Urgency |
| PA2_Buying_Center_and_Influence | Buying Center & Influence |
| PA3_Buying_Process_and_Decision_Control | Buying Process & Decision Control |
| PA4_Solution_and_Value_Proposition | Solution & Value Proposition |
| PA5_Competitive_Position | Competitive Position |
| PA6_Commercial_and_Deal_Structure | Commercial & Deal Structure |
| PA7_Sales_Execution_and_Deal_Readiness | Sales Execution & Deal Readiness |
| PA8_Deal_Momentum_Risk_and_Closeability | Deal Momentum, Risk & Closeability |

## 7.2 PADF Processing

The PADF Assessment Engine must:

1. Receive normalized opportunity context.
2. Retrieve relevant evidence.
3. Resolve applicable dimension relationships.
4. Evaluate evidence according to Rules v1.1.
5. Execute deterministic dimension assessment logic.
6. Generate dimension outputs.
7. preserve evidence references and evaluation lineage.
8. Pass authoritative results to Gemini for contextual interpretation.

## 7.3 PADF and SWOT Integration

SWOT intelligence enriches the existing PADF assessment.

It does not:

- Replace PADF.
- Create additional PADF dimensions.
- Duplicate dimension scoring.
- Introduce a second independent winability calculation.

The relationship between SWOT factors and PADF dimensions may be many-to-many.

The implementation must use approved mappings and runtime relationships rather than assume a one-to-one relationship.

---

# 8. SWOT Intelligence Architecture

## 8.1 Purpose

The SWOT Intelligence Engine evaluates the active opportunity-specific SWOT factor set using:

- Industry Configuration v1.1.
- Evidence Knowledge Base v1.1.
- Rules v1.1.
- Actual opportunity evidence.
- Resolved opportunity context.

Its purpose is to identify supported strengths, weaknesses, opportunities, and threats and connect these insights to the broader assessment.

## 8.2 SWOT Evaluation Flow

```text
Resolved Opportunity Context
             |
             v
Resolve 16 Active Factors
             |
             v
Load Applicable Factor Definitions
             |
             v
Retrieve Related Evidence
             |
             v
Evaluate Evidence Relationships
             |
             v
Evaluate Runtime Polarity
             |
             v
Assess Individual Factors
             |
             v
Evaluate Factor Interactions
             |
             v
Generate SWOT Intelligence
             |
             v
Feed PADF / Risk / TOWS Integration
```

## 8.3 Factor Evaluation Requirements

For each active factor, the system must preserve:

- Canonical factor ID.
- Factor type.
- Factor definition.
- Configuration layer.
- Applicable industry and revenue motion.
- Supporting evidence.
- Contradicting evidence.
- Qualifying evidence.
- Contextual evidence.
- Evidence gaps.
- Runtime relationship.
- Runtime polarity.
- Assessment rationale.
- Related PADF dimensions.
- Related risks and strategies, where supported.

## 8.4 Factor Assessment Governance

The system must not:

- Treat a factor definition as evidence.
- Treat a configured factor as an established fact.
- Assume that all factors have supporting evidence.
- Force evidence mappings for unmapped factors.
- Infer negative polarity from missing evidence.
- Generate unsupported factor confidence values.
- Invent factor-to-risk or factor-to-strategy mappings.

## 8.5 SWOT Output

The SWOT output should contain four logical groups:

```text
STRENGTHS
Evidence-supported internal advantages

WEAKNESSES
Evidence-supported internal limitations

OPPORTUNITIES
Relevant external opportunities

THREATS
Relevant external threats
```

Each factor must include its supporting evidence and interpretation.

The output must distinguish confirmed findings from qualified interpretations and unresolved evidence gaps.

---

# 9. Deterministic Assessment Rules Architecture

## 9.1 Rules Engine Authority

Pipeline Assessment Rules v1.1 is the authoritative source for deterministic execution and assessment governance.

The Rules Engine is responsible for:

- Assessment initialization.
- Context validation.
- Evidence evaluation orchestration.
- PADF assessment.
- SWOT integration.
- Cross-dimensional adjustment.
- Winability calculation.
- Risk evaluation.
- Strategy integration.
- Lifecycle governance.
- Output validation.

Gemini must not replace these responsibilities.

## 9.2 Rules Execution Sequence

The Rules Engine must execute the ten logical processing domains defined by Rules v1.1:

1. Context resolution.
2. Data validation.
3. Evidence evaluation.
4. Dimension assessment.
5. Cross-dimension adjustment.
6. Winability.
7. Risk.
8. Strategy.
9. Lifecycle.
10. Output.

This sequence describes the logical Rules Engine execution domains.

It must not be confused with the business reasoning phases or the separate Phase 6, Phase 7, and Phase 8 decision-engine responsibilities.

## 9.3 Winability Processing

The existing Winability Engine remains authoritative.

The system must preserve the distinction between:

- Base winability.
- Risk evaluation.
- Risk-adjusted winability.

The processing sequence is:

```text
PADF and Assessment Inputs
          |
          v
Base Winability Calculation
          |
          v
Formal Risk Evaluation
          |
          v
Risk-Adjusted Winability
          |
          v
Winning Strategy Processing
```

The implementation must use the actual Rules v1.1 calculations and output contracts.

No new formula, weighting, threshold, or scoring methodology may be invented in the technical implementation.

## 9.4 Rules Output Validation

Before an assessment result is persisted, the backend must validate:

- Required output fields.
- Canonical identifiers.
- Supported enumeration values.
- Numeric ranges defined by the rules.
- Required evidence references.
- Assessment and configuration version consistency.
- Lifecycle status.
- Output completeness.

Invalid deterministic output must be rejected or marked as a processing failure.

Gemini must never be allowed to repair or silently replace a deterministic result.

## 9.5 Rules v1.1 Validation Status

Rules v1.1 is currently a draft pending Stage 6 validation.

Therefore:

- The implementation must preserve its current version and status metadata.
- The system must support configuration activation controls.
- Production activation must require the agreed validation and approval gate.
- The implementation must not represent Rules v1.1 as fully validated before that gate is completed.

---

# 10. Decision Intelligence Architecture

## 10.1 Winability Engine

The Winability Engine calculates the opportunity's authoritative winability outputs.

It receives the relevant deterministic assessment inputs and returns the outputs defined by Rules v1.1.

The engine must expose:

- Base winability.
- Winability state or classification, if defined.
- Relevant contributing factors.
- Relevant limiting factors.
- Supporting assessment references.
- Calculation and rule version references.

Gemini may explain the result but must not recalculate it.

## 10.2 Risk Intelligence Engine

The Risk Intelligence Engine evaluates formal risks using the authoritative rules.

It must preserve:

- Risk identity.
- Risk category.
- Triggering conditions.
- Evidence references.
- Severity.
- Likelihood, where defined.
- Business impact.
- Mitigation requirements.
- Risk status.
- Risk-adjusted winability relationship, where returned.

SWOT threats and weaknesses may provide contextual risk signals.

However, these signals must not automatically become formal risks without the approved Risk Intelligence evaluation.

## 10.3 TOWS Intelligence Engine

The TOWS Intelligence Engine uses supported SWOT relationships to identify strategic combinations.

Four strategic types:

| Type | Strategic Logic |
|---|---|
| SO | Use strengths to capture opportunities. |
| WO | Address weaknesses to unlock opportunities. |
| ST | Use strengths to respond to threats. |
| WT | Reduce exposure from weaknesses and threats. |

The engine must:

1. Identify relevant SWOT factor combinations.
2. Verify that the factor assessments have sufficient supporting evidence.
3. Preserve the evidence and factor references.
4. Evaluate strategic relevance according to approved rules.
5. Avoid mechanically generating every possible combination.
6. Produce supported TOWS candidates.
7. Pass relevant candidates to the existing Winning Strategy process.

## 10.4 Winning Strategy Engine

The existing Winning Strategy Engine remains authoritative.

The TOWS integration enriches its inputs; it does not replace the engine.

The system should connect:

```text
Evidence
   |
   v
SWOT Factor
   |
   v
PADF / Risk Implication
   |
   v
TOWS Strategic Combination
   |
   v
Strategic Objective
   |
   v
Winning Strategy
   |
   v
Execution Actions
```

The implementation must preserve the distinction between:

- Strategy recommendation.
- Strategy execution.
- Action completion.
- Measured business outcome.

---

# 11. Gemini AI Reasoning Architecture

## 11.1 Gemini's Role

Gemini provides contextual reasoning and explanation.

It is responsible for:

- Understanding opportunity context.
- Interpreting inherited qualification intelligence.
- Explaining evidence relationships.
- Interpreting PADF results.
- Explaining SWOT implications.
- Identifying cross-dimensional business implications.
- Explaining formal risks.
- Interpreting TOWS strategic opportunities.
- Explaining winning strategies.
- Recommending practical actions.
- Analyzing historical evolution.

Gemini is not the calculation engine.

## 11.2 Gemini Input Architecture

Gemini receives a structured reasoning payload.

```text
Gemini System Prompt v1.1
          +
Pipeline Reasoning Strategy v1.1
          +
Resolved Opportunity Context
          +
Inherited Qualification Intelligence
          +
Current Pipeline Information
          +
Opportunity Evidence
          +
Evidence Evaluation Results
          +
PADF Assessment Results
          +
SWOT Factor Assessment Results
          +
Deterministic Rules Outputs
          +
Risk Intelligence Results
          +
TOWS Results
          +
Historical Assessment Context
          |
          v
     Gemini Reasoning
```

The prompt must not contain unnecessary full database records or unrelated historical content.

The orchestration layer should assemble a bounded, structured context payload.

## 11.3 Prompt Assembly Service

The Prompt Assembly Service must:

1. Load the approved Gemini system prompt.
2. Load the applicable reasoning specification.
3. Retrieve the resolved opportunity context.
4. Retrieve relevant evidence and evaluation results.
5. Include deterministic PADF and Rules outputs.
6. Include relevant SWOT and TOWS results.
7. Include formal Risk Intelligence outputs.
8. Include historical information when required.
9. Include source and version metadata.
10. Generate the structured Gemini request.

The prompt version must be recorded with the assessment.

## 11.4 Gemini Output Contract

Gemini must return structured output rather than uncontrolled free-form text.

The recommended logical output structure is:

```json
{
  "assessment_id": "assessment_id",
  "reasoning_status": "COMPLETED",
  "executive_summary": {
    "overall_assessment": "",
    "current_strengths": [],
    "key_constraints": [],
    "key_risks": [],
    "evidence_gaps": [],
    "priority_actions": []
  },
  "evidence_interpretation": [],
  "padf_interpretation": [],
  "swot_interpretation": [],
  "risk_interpretation": [],
  "tows_interpretation": [],
  "winning_strategy_explanation": [],
  "historical_evolution": [],
  "reasoning_trace": [],
  "uncertainties": [],
  "assumptions": []
}
```

This is a presentation-oriented logical contract.

The final field names and required properties must be reconciled with the approved Gemini prompt and implementation response schema before production deployment.

The output must not introduce new deterministic scores or calculations.

## 11.5 Gemini Output Validation

The backend must validate:

- JSON parseability.
- Required fields.
- Supported output structure.
- Evidence reference integrity.
- Canonical factor and dimension identifiers.
- No unsupported risk identifiers.
- No unsupported strategy identifiers.
- No invented numeric calculations.
- No unsupported claims of evidence.
- Clear distinction between facts, inference, assumptions, and unknowns.

If Gemini returns invalid or incomplete output:

1. Preserve valid deterministic results.
2. Mark the reasoning stage as failed or partially completed.
3. Record the error.
4. Allow controlled retry.
5. Do not fabricate missing reasoning output.

## 11.6 Gemini Security

The Gemini API must only be invoked server-side.

Requirements:

- Store API credentials in secure environment secrets.
- Do not expose prompts containing sensitive opportunity data in frontend logs.
- Minimize customer information included in the request.
- Apply tenant authorization before retrieving data.
- Validate model output before persistence.
- Record model identifier and prompt version.
- Apply request timeouts and retry limits.
- Prevent uncontrolled recursive retries.

---

# 12. Pipeline Assessment Orchestration

## 12.1 Orchestrator Responsibilities

The Pipeline Assessment Orchestrator controls the complete assessment lifecycle.

It is responsible for:

- Assessment initiation.
- Input validation.
- Configuration resolution.
- Evidence processing.
- Rules Engine execution.
- Decision Intelligence execution.
- Gemini invocation.
- Output validation.
- Snapshot persistence.
- Status management.
- Error handling.
- Historical comparison.

## 12.2 Full Assessment Processing Workflow

```text
1. Assessment Request
        |
        v
2. Authentication and Authorization
        |
        v
3. Load Opportunity
        |
        v
4. Load Inherited Qualification Context
        |
        v
5. Validate Opportunity Data
        |
        v
6. Resolve Industry and Revenue Motion
        |
        v
7. Load Configuration Assets
        |
        v
8. Resolve Active SWOT Factors
        |
        v
9. Retrieve Opportunity Evidence
        |
        v
10. Evaluate Evidence
        |
        v
11. Execute PADF Assessment
        |
        v
12. Execute SWOT Intelligence
        |
        v
13. Execute Deterministic Rules
        |
        v
14. Calculate Base Winability
        |
        v
15. Execute Formal Risk Intelligence
        |
        v
16. Calculate Risk-Adjusted Winability
        |
        v
17. Execute TOWS Integration
        |
        v
18. Execute Winning Strategy
        |
        v
19. Assemble Gemini Context
        |
        v
20. Execute Gemini Reasoning
        |
        v
21. Validate All Outputs
        |
        v
22. Persist Assessment Snapshot
        |
        v
23. Generate Historical Comparison
        |
        v
24. Return Assessment Result
```

The exact deterministic processing order must follow Rules v1.1.

The above workflow describes the complete orchestration lifecycle, not a replacement for the detailed Rules Engine execution sequence.

## 12.3 Assessment Trigger Types

The system should support the following trigger categories.

| Trigger | Description |
|---|---|
| MANUAL | User explicitly requests a new assessment. |
| EVIDENCE_UPDATE | Relevant opportunity evidence is added or updated. |
| OPPORTUNITY_UPDATE | Important opportunity information changes. |
| STAGE_CHANGE | Sales stage changes. |
| RISK_TRIGGER | A governed risk-related event requires reassessment. |
| SCHEDULED | Periodic assessment review. |
| LIFECYCLE | Opportunity lifecycle transition. |

Not every data update should automatically trigger a complete Gemini assessment.

The system should distinguish between:

- Data synchronization.
- Evidence update.
- Deterministic reassessment.
- Full AI reasoning reassessment.

This avoids unnecessary model calls and processing costs.

## 12.4 Assessment State Management

Recommended lifecycle:

```text
DRAFT
  |
  v
QUEUED
  |
  v
PROCESSING
  |
  +-------------------+
  |                   |
  v                   v
COMPLETED       PARTIALLY_COMPLETED
  |
  v
SUPERSEDED
  |
  v
HISTORICAL
```

Failure and cancellation states must also be supported.

A new assessment must not overwrite an earlier completed assessment.

## 12.5 Idempotency and Duplicate Prevention

The orchestration layer must prevent duplicate assessments caused by:

- Repeated user clicks.
- Network retries.
- Duplicate webhook events.
- Repeated trigger delivery.
- Frontend refreshes.

Use an idempotency key or equivalent request identity.

The system must verify whether an equivalent assessment request is already processing before creating another execution.

---

# 13. API and Backend Interface Architecture

## 13.1 API Design Principles

All application operations must:

- Require authentication.
- Validate authorization.
- Validate input.
- Use canonical identifiers.
- Return consistent response structures.
- Support error handling.
- Preserve tenant isolation.
- Record relevant audit events.

The API examples below describe logical contracts. They do not require the implementation to adopt a particular REST endpoint naming convention if the existing Supabase Edge Function architecture uses another consistent pattern.

## 13.2 Core Backend Operations

| Operation | Purpose |
|---|---|
| createPipeline | Create or register an opportunity. |
| inheritQualification | Receive Opportunity Qualification intelligence. |
| getPipeline | Retrieve opportunity information. |
| updatePipeline | Update opportunity information. |
| addEvidence | Create an opportunity evidence record. |
| updateEvidence | Update an existing evidence record. |
| getEvidence | Retrieve opportunity evidence. |
| assessPipeline | Initiate an assessment. |
| getAssessment | Retrieve an assessment result. |
| getAssessmentHistory | Retrieve historical assessments. |
| getSWOTIntelligence | Retrieve active SWOT factor assessments. |
| getPADFAssessment | Retrieve PADF results. |
| getRiskIntelligence | Retrieve formal risk outputs. |
| getWinningStrategy | Retrieve strategy recommendations. |
| updateAction | Update strategy action status. |
| compareAssessments | Compare historical assessment snapshots. |

## 13.3 Standard API Request Structure

Example:

```json
{
  "request_id": "unique_request_id",
  "pipeline_id": "pipeline_id",
  "tenant_id": "tenant_id",
  "requested_action": "ASSESS",
  "trigger_type": "MANUAL",
  "input_revision": "revision_reference"
}
```

The backend must derive and validate the tenant identity from the authenticated session rather than trust an unverified tenant identifier supplied by the frontend.

## 13.4 Standard API Response Structure

Example:

```json
{
  "success": true,
  "request_id": "unique_request_id",
  "data": {},
  "metadata": {
    "pipeline_id": "pipeline_id",
    "assessment_id": "assessment_id",
    "processing_status": "COMPLETED",
    "timestamp": "ISO-8601 timestamp"
  },
  "error": null
}
```

For failed requests:

```json
{
  "success": false,
  "request_id": "unique_request_id",
  "data": null,
  "metadata": {},
  "error": {
    "code": "ASSESSMENT_PROCESSING_ERROR",
    "message": "Assessment could not be completed.",
    "retryable": true
  }
}
```

Do not expose internal stack traces, secrets, or sensitive backend details to the frontend.

---

# 14. Supabase Database and Storage Architecture

## 14.1 Database Design Principles

Supabase PostgreSQL should serve as the primary operational data store.

The database should separate:

- Current opportunity information.
- Inherited qualification information.
- Opportunity evidence.
- Evidence relationships.
- Assessment executions.
- Deterministic assessment results.
- Gemini reasoning results.
- Risk records.
- Strategy and action records.
- Historical snapshots.
- Configuration metadata.
- Audit records.

The following is a recommended logical structure, not a requirement to create every table independently if an existing RevOS schema already provides equivalent structures.

## 14.2 Recommended Logical Tables

| Logical Table | Purpose |
|---|---|
| pipeline_opportunities | Current opportunity information |
| pipeline_inheritance | Inherited qualification intelligence |
| pipeline_evidence | Opportunity evidence instances |
| pipeline_evidence_relationships | Evidence-to-factor and evidence-to-dimension relationships |
| pipeline_assessments | Assessment execution records |
| pipeline_assessment_snapshots | Immutable historical assessment snapshots |
| pipeline_padf_results | PADF assessment outputs |
| pipeline_swot_results | SWOT factor assessment outputs |
| pipeline_risks | Formal Risk Intelligence records |
| pipeline_strategies | Winning Strategy and TOWS outputs |
| pipeline_actions | Execution actions |
| pipeline_assessment_events | Assessment lifecycle events |
| pipeline_configuration_registry | Configuration versions and activation metadata |
| pipeline_audit_logs | User and system audit events |

## 14.3 JSONB Usage

PostgreSQL JSONB is appropriate for complex and versioned intelligence payloads, including:

- Inherited qualification payloads.
- Evidence evaluation details.
- Gemini reasoning output.
- Assessment snapshots.
- Complex strategy structures.
- Configuration metadata.

However, frequently queried relationships and identifiers should be stored in appropriately indexed relational columns.

Do not place the entire application data model into one large JSONB field.

## 14.4 Indexing Recommendations

Consider indexes for:

- tenant_id
- pipeline_id
- assessment_id
- assessment_timestamp
- assessment_status
- evidence_instance_id
- factor_id
- dimension_id
- risk_instance_id
- strategy_instance_id
- action_status
- lifecycle_status

Composite indexes should support common queries such as:

- Tenant + opportunity.
- Opportunity + assessment date.
- Opportunity + evidence status.
- Assessment + factor.
- Opportunity + risk status.

Actual indexes should be determined using query plans and observed workload.

## 14.5 Supabase Storage

Supabase Storage may be used for supporting evidence files where the product supports document attachments.

Recommended logical storage organization:

```text
pipeline-evidence/
    {tenant_id}/
        {pipeline_id}/
            {evidence_instance_id}/
                original-file
                supporting-file
```

Requirements:

- Store metadata in PostgreSQL.
- Store file references rather than binary file contents in assessment JSON.
- Use authenticated access.
- Apply tenant-specific access controls.
- Validate file type and size.
- Use secure signed access where appropriate.
- Preserve original evidence file references for historical traceability.

## 14.6 Vector Retrieval

Vector retrieval may support semantic retrieval of relevant historical information and supporting documents.

It must not replace:

- Deterministic database queries.
- Canonical configuration resolution.
- Explicit evidence mappings.
- Rules Engine execution.

Semantic similarity must never be treated as proof of an approved mapping.

---

# 15. Frontend Application Architecture and UI Implementation

## 15.1 Frontend Architecture

The Pipeline Assessment frontend should be implemented as a modular React and TypeScript application.

Recommended logical structure:

```text
src/apps/
|
+-- revos/
|   |
|   +-- pipeline/
|       |
|       +-- pages/
|       |   +-- PipelineOverviewPage.tsx
|       |   +-- OpportunityAssessmentPage.tsx
|       |
|       +-- components/
|       |   +-- PipelineHeader.tsx
|       |   +-- PipelineMetricCard.tsx
|       |   +-- OpportunityTable.tsx
|       |   +-- AssessmentStatusBadge.tsx
|       |   +-- EvidenceCard.tsx
|       |   +-- FactorCard.tsx
|       |   +-- DimensionCard.tsx
|       |   +-- RiskCard.tsx
|       |   +-- TOWSCard.tsx
|       |   +-- StrategyActionCard.tsx
|       |   +-- AssessmentTimeline.tsx
|       |
|       +-- sections/
|       |   +-- ExecutiveSummary.tsx
|       |   +-- PADFAssessment.tsx
|       |   +-- EvidenceIntelligence.tsx
|       |   +-- SWOTIntelligence.tsx
|       |   +-- RiskIntelligence.tsx
|       |   +-- TOWSStrategy.tsx
|       |   +-- AssessmentHistory.tsx
|       |
|       +-- hooks/
|       |   +-- usePipeline.ts
|       |   +-- useAssessment.ts
|       |   +-- useEvidence.ts
|       |   +-- useAssessmentHistory.ts
|       |
|       +-- services/
|       |   +-- pipelineApi.ts
|       |   +-- assessmentApi.ts
|       |   +-- evidenceApi.ts
|       |
|       +-- types/
|           +-- pipeline.types.ts
|           +-- assessment.types.ts
|           +-- evidence.types.ts
|           +-- swot.types.ts
|           +-- strategy.types.ts
|
+-- shared/
    +-- components/
    +-- hooks/
    +-- types/
    +-- utils/
```

This is a suggested organization. Existing RevOS conventions should be retained where equivalent modules already exist.

## 15.2 Main Navigation

The Pipeline Assessment module should use the following primary navigation structure:

```text
PIPELINE ASSESSMENT
|
+-- Pipeline Overview
|
+-- Opportunity Assessment
|    |
|    +-- Executive Summary
|    +-- PADF Assessment
|    +-- Evidence Intelligence
|    +-- SWOT Intelligence
|    +-- Risk Intelligence
|    +-- TOWS & Winning Strategy
|    +-- History & Changes
|
+-- Governance
     |
     +-- Configuration Status
     +-- Assessment Trace
     +-- Audit History
```

Governance capabilities should be permission-controlled.

The user-facing interface should avoid exposing internal configuration identifiers unless an authorized user opens a technical or diagnostic view.

---

# 16. UI Layout Design — Pipeline Overview

## 16.1 Purpose

The Pipeline Overview is the portfolio-level entry point.

It provides a consolidated view of active opportunities, winability, health, risks, and assessment status.

## 16.2 Desktop Layout

Recommended desktop layout:

```text
+------------------------------------------------------------------+
| RevOS                                      User / Organization   |
+------------------------------------------------------------------+
| Pipeline Assessment                                              |
|                                                                  |
| Overview | Opportunities | Governance                            |
+------------------------------------------------------------------+
| Pipeline Overview                                                |
|                                                                  |
| [Date Range] [Owner] [Stage] [Industry] [Revenue Motion] [Search] |
+------------------------------------------------------------------+
|                                                                  |
| [Total Pipeline] [Opportunities] [Weighted Pipeline*] [At Risk]  |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
| WINABILITY DISTRIBUTION         PIPELINE HEALTH                  |
| +---------------------------+   +-----------------------------+  |
| | Distribution chart        |   | Health distribution         |  |
| |                           |   |                             |  |
| +---------------------------+   +-----------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
| RISK OVERVIEW                                                    |
|                                                                  |
| [Critical Risks] [High-Priority Risks] [Opportunities at Risk]   |
|                                                                  |
+------------------------------------------------------------------+
| OPPORTUNITY PORTFOLIO                                             |
|                                                                  |
| Opportunity | Customer | Value | Stage | Winability | Risk | Date|
|------------------------------------------------------------------|
| Deal A      | Client A | ...   | ...   | ...        | ...  | ... |
| Deal B      | Client B | ...   | ...   | ...        | ...  | ... |
| Deal C      | Client C | ...   | ...   | ...        | ...  | ... |
|                                                                  |
+------------------------------------------------------------------+
```

*Weighted Pipeline must only be displayed if the existing authoritative calculation contract defines it.

## 16.3 Dashboard Data Sources

| UI Component | Data Source |
|---|---|
| Total Pipeline | Current opportunity records |
| Opportunity Count | Current opportunity records |
| Weighted Pipeline | Existing approved calculation, if available |
| Winability Distribution | Deterministic assessment outputs |
| Pipeline Health | Rules Engine outputs |
| Risk Overview | Formal Risk Intelligence outputs |
| Opportunity Table | Pipeline records and latest completed assessment |
| Assessment Status | Assessment lifecycle records |

The frontend must not create independent formulas for these metrics.

## 16.4 Opportunity Table Requirements

Recommended columns:

- Opportunity name.
- Customer.
- Deal value.
- Currency.
- Industry.
- Revenue motion.
- Sales stage.
- Expected close date.
- Current winability.
- Risk status.
- Last assessment date.
- Assessment status.

The user should be able to:

- Search opportunities.
- Filter by relevant fields.
- Sort by supported columns.
- Open the opportunity workspace.
- Identify opportunities requiring reassessment.
- Identify opportunities with incomplete or failed assessments.

## 16.5 Dashboard Interaction

Clicking an opportunity opens the Opportunity Assessment Workspace.

Clicking a risk summary opens the relevant risk details.

Clicking a winability distribution segment filters the opportunity portfolio accordingly.

All charts must be based on authoritative backend outputs.

---

# 17. UI Layout Design — Opportunity Assessment Workspace

## 17.1 Purpose

The Opportunity Assessment Workspace is the primary product experience.

It consolidates opportunity context, assessment results, evidence, SWOT intelligence, risks, strategies, and historical evolution.

## 17.2 Desktop Layout

```text
+------------------------------------------------------------------+
| Pipeline Assessment > Opportunity Name                           |
+------------------------------------------------------------------+
| Opportunity Name                         [Reassess] [More Actions]|
| Customer | Owner | Industry | Revenue Motion                     |
| Deal Value | Stage | Expected Close Date                         |
+------------------------------------------------------------------+
|                                                                  |
| [Base Winability] [Risk-Adjusted Winability] [Pipeline Health]   |
|                                                                  |
| Assessment Status | Evidence Status | Last Assessed              |
+------------------------------------------------------------------+
|                                                                  |
| Executive Summary | PADF | Evidence | SWOT | Risks | Strategy   |
| History                                                           |
+------------------------------------------------------------------+
|                                                                  |
|                    SELECTED TAB CONTENT                          |
|                                                                  |
|                                                                  |
|                                                                  |
|                                                                  |
+------------------------------------------------------------------+
```

## 17.3 Header Requirements

The opportunity header must display:

- Opportunity name.
- Customer.
- Deal value and currency.
- Industry.
- Revenue motion.
- Sales stage.
- Expected close date.
- Opportunity owner.
- Lifecycle status.
- Last assessment timestamp.

The header should also provide:

- Reassess action.
- Evidence update action.
- Opportunity update action, where permitted.
- Historical assessment access.

## 17.4 Assessment Summary Strip

The summary strip should distinguish:

1. Base winability.
2. Risk-adjusted winability.
3. Pipeline health.
4. Evidence coverage or evidence status, if returned.
5. Assessment completion status.

Base winability and risk-adjusted winability must never be displayed as the same metric.

If a metric is unavailable, show an explicit unavailable state rather than a placeholder number.

---

# 18. UI Layout Design — Executive Summary

## 18.1 Purpose

The Executive Summary should answer five business questions:

1. How likely is this opportunity to become Closed Won according to the existing winability methodology?
2. Why does the opportunity currently have this assessment?
3. What evidence supports, contradicts, qualifies, or contextualizes the assessment?
4. Which weaknesses, threats, formal risks, and evidence gaps could affect the outcome?
5. What actions should be taken to improve winability and deal quality?

## 18.2 Layout

```text
+------------------------------------------------------------------+
| EXECUTIVE SUMMARY                                                |
+------------------------------------------------------------------+
| Overall Assessment                                               |
|                                                                  |
| Gemini-generated business interpretation                        |
|                                                                  |
+------------------------------------------------------------------+
| KEY ASSESSMENT DRIVERS                                           |
|                                                                  |
| [Strengths]             [Constraints]                            |
|                                                                  |
+------------------------------------------------------------------+
| RISK AND UNCERTAINTY                                             |
|                                                                  |
| [Formal Risks]          [Evidence Gaps]                           |
|                                                                  |
+------------------------------------------------------------------+
| PRIORITY ACTIONS                                                 |
|                                                                  |
| 1. Action                                                     |
| 2. Action                                                     |
| 3. Action                                                     |
|                                                                  |
+------------------------------------------------------------------+
| WHY THIS ASSESSMENT?                                             |
|                                                                  |
| Evidence -> Interpretation -> Assessment -> Business Implication|
|                                                                  |
+------------------------------------------------------------------+
```

## 18.3 Reasoning Trace Component

The Reasoning Trace component should explain the relationship between:

```text
Evidence
   |
   v
Evidence Interpretation
   |
   v
SWOT Factor / PADF Dimension
   |
   v
Business Implication
   |
   v
Assessment Result
   |
   v
Strategic Recommendation
```

Each link should be expandable.

The interface must clearly distinguish deterministic results from Gemini-generated explanations.

---

# 19. UI Layout Design — PADF Assessment

## 19.1 Purpose

Display all eight PADF dimensions and their assessment results.

## 19.2 Layout

```text
+------------------------------------------------------------------+
| PADF ASSESSMENT                                                  |
+------------------------------------------------------------------+
| Dimension Overview                                               |
|                                                                  |
| +--------------------------+  +--------------------------+       |
| | PA1 Customer Value       |  | PA2 Buying Center        |       |
| | & Urgency                |  | & Influence              |       |
| | State / Score            |  | State / Score            |       |
| | Key evidence             |  | Key evidence             |       |
| +--------------------------+  +--------------------------+       |
|                                                                  |
| +--------------------------+  +--------------------------+       |
| | PA3 Buying Process       |  | PA4 Solution & Value     |       |
| | & Decision Control       |  | Proposition              |       |
| +--------------------------+  +--------------------------+       |
|                                                                  |
| +--------------------------+  +--------------------------+       |
| | PA5 Competitive Position |  | PA6 Commercial & Deal    |       |
| |                          |  | Structure                |       |
| +--------------------------+  +--------------------------+       |
|                                                                  |
| +--------------------------+  +--------------------------+       |
| | PA7 Sales Execution      |  | PA8 Deal Momentum        |       |
| | & Deal Readiness         |  | Risk & Closeability      |       |
| +--------------------------+  +--------------------------+       |
+------------------------------------------------------------------+
```

## 19.3 Dimension Card

Each card should contain:

- Dimension name.
- Assessment state.
- Deterministic score, if applicable.
- Short assessment interpretation.
- Key supporting evidence.
- Key weaknesses or gaps.
- Related SWOT factors.
- Recommended actions.
- Historical movement, if available.

Clicking a dimension opens a detailed panel.

The UI must not invent a score or rating where the Rules Engine does not return one.

---

# 20. UI Layout Design — Evidence Intelligence

## 20.1 Purpose

Provide users with a consolidated and traceable view of the actual evidence supporting pipeline assessment.

## 20.2 Evidence Register

Recommended layout:

```text
+------------------------------------------------------------------+
| EVIDENCE INTELLIGENCE                                            |
+------------------------------------------------------------------+
| [Search] [Evidence Type] [Relationship] [Polarity] [Date]        |
+------------------------------------------------------------------+
| Evidence Statement | Source | Date | Quality | Relationship     |
|------------------------------------------------------------------|
| Evidence A         | ...    | ...  | ...     | SUPPORTS          |
| Evidence B         | ...    | ...  | ...     | CONTRADICTS       |
| Evidence C         | ...    | ...  | ...     | QUALIFIES         |
| Evidence D         | ...    | ...  | ...     | GAP_SIGNAL        |
+------------------------------------------------------------------+
| [Add Evidence]                                                    |
+------------------------------------------------------------------+
```

## 20.3 Evidence Detail Drawer

When a user selects an evidence record, display:

- Evidence statement.
- Evidence type.
- Source.
- Source date.
- Recorded date.
- Verification status.
- Evidence quality.
- Evidence confidence, where applicable.
- Reusable evidence object reference.
- Mapping relevance.
- Runtime relationship.
- Runtime polarity.
- Linked SWOT factors.
- Linked PADF dimensions.
- Assessment references.
- Provenance and history.

## 20.4 Evidence Creation and Update

The Add Evidence workflow should support:

1. Evidence statement entry.
2. Evidence type selection.
3. Source identification.
4. Source date.
5. Supporting document reference, where supported.
6. Verification information.
7. Notes.
8. Save and confirmation.

Evidence classification and evaluation may be assisted by backend intelligence, but actual evidence content must come from a user or an authorized source.

The system must not automatically fabricate evidence or silently populate unsupported customer facts.

## 20.5 Evidence Filtering

Recommended filters:

- Evidence type.
- Source.
- Date.
- Verification status.
- Evidence quality.
- Runtime relationship.
- Runtime polarity.
- Related PADF dimension.
- Related SWOT factor.
- Evidence gap.
- Contradictory evidence.

---

# 21. UI Layout Design — SWOT Intelligence

## 21.1 Purpose

Display the active opportunity-specific SWOT intelligence in a structured and explainable format.

## 21.2 SWOT Board

```text
+------------------------------------------------------------------+
| SWOT INTELLIGENCE                                                |
+------------------------------------------------------------------+
| Active Factors: 16 / Applicable Configuration                    |
|                                                                  |
| +-----------------------------+--------------------------------+ |
| | STRENGTHS                   | WEAKNESSES                     | |
| |                             |                                | |
| | Factor Card                 | Factor Card                    | |
| | Factor Card                 | Factor Card                    | |
| |                             |                                | |
| +-----------------------------+--------------------------------+ |
|                                                                  |
| +-----------------------------+--------------------------------+ |
| | OPPORTUNITIES               | THREATS                        | |
| |                             |                                | |
| | Factor Card                 | Factor Card                    | |
| | Factor Card                 | Factor Card                    | |
| |                             |                                | |
| +-----------------------------+--------------------------------+ |
+------------------------------------------------------------------+
```

The exact number of factors in each quadrant must come from the assessment results. The interface must not assume an equal distribution.

## 21.3 Factor Card

Each factor card should show:

- Factor name.
- Factor type.
- Configuration layer.
- Assessment state.
- Short interpretation.
- Evidence status.
- Supporting evidence count.
- Contradicting evidence count.
- Related PADF dimensions.
- Related formal risks, where applicable.

## 21.4 Factor Detail Drawer

The detail drawer should contain:

1. Factor definition.
2. Factor ID in authorized technical view.
3. Configuration source layer.
4. Applicable industry and revenue motion.
5. Supporting evidence.
6. Contradicting evidence.
7. Qualifying and contextual evidence.
8. Evidence gaps.
9. Runtime relationships.
10. Runtime polarity.
11. Evaluation rationale.
12. Linked PADF dimensions.
13. Related risks.
14. Related TOWS strategies.
15. Historical factor changes.

## 21.5 Configuration and Evidence Status

The interface must distinguish:

- Active and evaluated.
- Active but insufficient evidence.
- Active with contradictory evidence.
- Active with no approved evidence mapping.
- Not applicable to the current opportunity.

A factor with no approved evidence mapping must not be presented as a software error or automatically treated as a negative finding.

---

# 22. UI Layout Design — Risk Intelligence

## 22.1 Purpose

Present formal Risk Intelligence outputs separately from general SWOT threat and weakness signals.

## 22.2 Risk Overview

```text
+------------------------------------------------------------------+
| RISK INTELLIGENCE                                                |
+------------------------------------------------------------------+
| [Critical] [High] [Medium] [Low]                                 |
+------------------------------------------------------------------+
| Risk | Severity | Trigger | Business Impact | Status            |
|------------------------------------------------------------------|
| Risk A | ...    | ...     | ...              | Open              |
| Risk B | ...    | ...     | ...              | Mitigating        |
+------------------------------------------------------------------+
| RISK DETAIL                                                      |
|                                                                  |
| Description                                                      |
| Triggering Evidence                                              |
| Business Impact                                                  |
| Mitigation Strategy                                              |
| Owner / Target Date                                              |
| Related SWOT Factors                                             |
|                                                                  |
+------------------------------------------------------------------+
```

## 22.3 Risk Detail Requirements

Display only the fields supported by the formal Risk Intelligence output:

- Risk identity.
- Risk category.
- Severity.
- Likelihood, if available.
- Impact.
- Triggering evidence.
- Related dimensions.
- Related SWOT factors.
- Mitigation strategy.
- Risk owner.
- Status.
- Historical changes.

Potential risk signals from SWOT should be visually distinguished from formal risks.

---

# 23. UI Layout Design — TOWS and Winning Strategy

## 23.1 TOWS Matrix

The TOWS interface should display the four strategic categories.

```text
+------------------------------------------------------------------+
| TOWS STRATEGIC INTELLIGENCE                                      |
+------------------------------------------------------------------+
|                                                                  |
| +-----------------------------+--------------------------------+ |
| | SO STRATEGIES               | WO STRATEGIES                  | |
| | Use strengths to capture    | Address weaknesses to unlock  | |
| | opportunities.              | opportunities.                 | |
| |                             |                                | |
| | Strategy Cards              | Strategy Cards                 | |
| +-----------------------------+--------------------------------+ |
|                                                                  |
| +-----------------------------+--------------------------------+ |
| | ST STRATEGIES               | WT STRATEGIES                  | |
| | Use strengths to respond    | Reduce exposure from          | |
| | to threats.                 | weaknesses and threats.        | |
| |                             |                                | |
| | Strategy Cards              | Strategy Cards                 | |
| +-----------------------------+--------------------------------+ |
+------------------------------------------------------------------+
```

## 23.2 Strategy Detail

Each strategy should display:

- Strategic objective.
- TOWS category, where applicable.
- Supporting SWOT factors.
- Supporting evidence.
- Related formal risks.
- Strategic rationale.
- Expected impact.
- Feasibility.
- Dependencies.
- Priority.
- Recommended actions.
- Execution status.

Expected impact must remain directional unless an approved deterministic calculation supports a quantified value.

## 23.3 Action Management

The user should be able to:

- Assign an owner.
- Set a target date.
- Change action status.
- Record execution notes.
- Mark an action complete.
- Review historical action progress.

The system must preserve the distinction between an AI recommendation and an action actually executed by a user.

---

# 24. UI Layout Design — History and Changes

## 24.1 Purpose

Display the evolution of the opportunity over time.

## 24.2 Historical Timeline

```text
+------------------------------------------------------------------+
| HISTORY & CHANGES                                                |
+------------------------------------------------------------------+
|                                                                  |
| Assessment 01                                                   |
| Initial Pipeline Assessment                                     |
|                                                                  |
| Assessment 02                                                   |
| New Customer Evidence Added                                      |
|                                                                  |
| Assessment 03                                                   |
| Buying Process Risk Identified                                   |
|                                                                  |
| Assessment 04                                                   |
| Commercial Strategy Updated                                      |
|                                                                  |
| Closed Won / Closed Lost                                         |
+------------------------------------------------------------------+
```

## 24.3 Historical Comparison

The system should support comparison of two assessment snapshots.

Comparison categories:

- Opportunity data changes.
- Evidence added or updated.
- Evidence quality changes.
- PADF dimension changes.
- SWOT factor changes.
- Formal risk changes.
- Base winability changes.
- Risk-adjusted winability changes.
- TOWS strategy changes.
- Winning Strategy changes.
- Action completion.
- Final outcome.

## 24.4 Change Attribution

The system must distinguish between:

1. Actual business changes.
2. New or updated evidence.
3. Configuration version changes.
4. Rules version changes.
5. Reasoning prompt or model changes.
6. User corrections.
7. Assessment methodology changes.

A score or assessment change caused by a configuration update must not be presented as though the customer situation itself changed.

---

# 25. Responsive Interface Requirements

## 25.1 Desktop

Desktop is the primary experience for:

- Pipeline Overview.
- Opportunity Assessment.
- PADF.
- SWOT.
- TOWS.
- Historical comparison.

Use multi-column layouts where they improve comparison and analytical comprehension.

## 25.2 Tablet

Tablet layouts should:

- Reduce multi-column cards to fewer columns.
- Preserve navigation accessibility.
- Allow evidence drawers to become full-height panels.
- Retain core assessment information.

## 25.3 Mobile

Mobile layouts should prioritize:

1. Opportunity context.
2. Winability and assessment status.
3. Executive Summary.
4. Priority risks.
5. Priority actions.
6. Evidence details.
7. PADF and SWOT details.
8. History.

Recommended mobile structure:

```text
+------------------------------+
| Opportunity Name             |
| Customer / Value / Stage     |
+------------------------------+
| Base Winability              |
| Risk-Adjusted Winability     |
+------------------------------+
| Executive Summary            |
+------------------------------+
| Priority Risks               |
+------------------------------+
| Priority Actions             |
+------------------------------+
| Assessment Sections          |
|                              |
| PADF                         |
| Evidence                     |
| SWOT                         |
| TOWS & Strategy               |
| History                      |
+------------------------------+
```

Complex comparison tables should become stacked cards or horizontally scrollable regions where appropriate.

---

# 26. Frontend State Management and Data Fetching

## 26.1 State Management Principles

The frontend must distinguish:

- Current opportunity state.
- Latest completed assessment.
- Assessment currently processing.
- Historical assessment.
- Unsaved user input.
- Backend validation errors.

An in-progress assessment must not replace the last completed assessment in the UI.

## 26.2 Recommended Data Fetching Pattern

When a user opens an opportunity:

```text
Open Opportunity Workspace
          |
          v
Load Opportunity Context
          |
          v
Load Latest Completed Assessment
          |
          +-------------------------+
          |                         |
          v                         v
Load Summary               Load Supporting Sections
                                    |
                      +-------------+-------------+
                      |             |             |
                      v             v             v
                     PADF         Evidence        SWOT
                      |             |             |
                      +-------------+-------------+
                                    |
                                    v
                             Load Risks
                                    |
                                    v
                             Load Strategies
                                    |
                                    v
                             Load History
```

Sections should load independently where practical.

A failure in historical data retrieval should not prevent the Executive Summary from being displayed.

## 26.3 Caching

The frontend may cache:

- Opportunity summary.
- Latest completed assessment.
- Configuration display metadata.
- Historical summaries.

However:

- A new assessment must invalidate relevant cached results.
- Evidence changes must refresh affected evidence and assessment status.
- Historical snapshots must remain immutable.
- Configuration changes must not silently change an already completed assessment.

---

# 27. Processing Performance and Scalability

## 27.1 Performance Objectives

Initial targets:

| Operation | Target |
|---|---|
| Pipeline Overview | Under 5 seconds under normal operating conditions |
| Opportunity Summary | Under 3 seconds under normal operating conditions |
| Historical Comparison | Under 10 seconds under normal operating conditions |
| Standard Full Assessment | Target under 60 seconds where model and processing complexity permit |

These are initial performance targets, not guaranteed service-level commitments.

Performance must be measured in the deployed environment.

## 27.2 Performance Strategy

Implement:

- Server-side filtering and pagination.
- Indexed opportunity and assessment queries.
- Efficient configuration caching.
- Reuse of validated configuration assets.
- Parallel retrieval of independent data.
- Controlled Gemini context assembly.
- Asynchronous processing for longer assessments.
- Avoidance of unnecessary full reassessments.
- Lazy loading of detailed evidence and history.
- Frontend component-level loading states.

## 27.3 Assessment Processing Strategy

For potentially long-running assessments:

1. Accept the assessment request.
2. Create the assessment record.
3. Return the assessment ID and processing status.
4. Execute the orchestration workflow.
5. Persist intermediate stage status.
6. Persist final output.
7. Notify or allow the frontend to retrieve completion status.

The frontend should not rely on one long-running browser request for the entire assessment.

## 27.4 Gemini Cost and Context Management

To control AI cost and processing time:

- Send only relevant evidence.
- Avoid repeating unchanged historical information.
- Use structured context payloads.
- Keep system prompts version-controlled.
- Avoid unnecessary repeated model calls.
- Separate deterministic processing from AI reasoning.
- Reuse completed deterministic results when inputs and versions have not changed.
- Apply retry limits and timeout policies.

---

# 28. Security and Multi-Tenant Architecture

## 28.1 Authentication

Use the existing Supabase Auth architecture.

All Pipeline Assessment operations must require an authenticated user unless explicitly defined as a secure internal system operation.

## 28.2 Tenant Isolation

Every tenant-owned opportunity, evidence record, assessment, risk, strategy, and action must be associated with the correct tenant.

Supabase Row Level Security (RLS) must enforce tenant-level access.

The backend must also validate access before executing privileged operations.

## 28.3 Role-Based Access

Recommended logical roles:

| Role | Access |
|---|---|
| Sales Representative | Own or authorized opportunities; evidence and action management |
| Sales Manager | Team opportunities; assessment and risk review |
| Sales Executive | Portfolio-level intelligence and executive summaries |
| RevOps Administrator | Configuration governance and assessment diagnostics |
| System Administrator | Authorized system-level operations |

Actual permissions should follow the existing RevOS role and authorization model.

## 28.4 Data Protection

Requirements:

- Secure authentication.
- Tenant isolation.
- RLS policies.
- Secure file access.
- Server-side API secrets.
- Input validation.
- Output validation.
- Audit logging.
- Appropriate retention controls.
- Protection of customer and commercial information.

## 28.5 Audit Requirements

Record:

- Opportunity creation and updates.
- Evidence creation and updates.
- Assessment requests.
- Assessment execution.
- Configuration changes.
- Rule version changes.
- Gemini reasoning execution.
- Strategy creation.
- Action assignment and completion.
- User corrections and overrides.

---

# 29. Configuration Governance and Version Control

## 29.1 Versioned Assets

Every assessment must record the versions of:

- Industry Configuration.
- Evidence Knowledge Base.
- Pipeline Assessment Rules.
- Reasoning Strategy Specification.
- Gemini System Prompt.
- Relevant inheritance mapping contract.
- Assessment output schema.

## 29.2 Configuration Registry

The Configuration Governance Service should maintain:

- Asset name.
- Asset version.
- File reference.
- Validation status.
- Approval status.
- Activation status.
- Effective date.
- Created date.
- Change reference.
- Compatibility metadata.

## 29.3 Configuration Activation

Configuration activation must be controlled.

The system must not automatically replace an active production configuration simply because a newer JSON file has been uploaded.

A controlled activation process should include:

1. Asset registration.
2. JSON validation.
3. Identifier validation.
4. Compatibility validation.
5. Regression testing.
6. Approval.
7. Activation.
8. Version traceability.

## 29.4 Historical Reproducibility

An existing assessment must retain its original configuration references.

A later configuration update must not rewrite an earlier assessment snapshot.

If a historical opportunity is reassessed using a newer configuration, the new result must be stored as a new assessment.

---

# 30. Error Handling and Recovery Architecture

## 30.1 Error Categories

The system should distinguish:

| Error Category | Example |
|---|---|
| Authentication | User session invalid |
| Authorization | User cannot access opportunity |
| Data Validation | Required opportunity information missing |
| Configuration | JSON invalid or incompatible |
| Evidence | Evidence relationship cannot be resolved |
| Rules Engine | Deterministic assessment failure |
| Gemini | Model timeout or invalid response |
| Persistence | Database write failure |
| Integration | Opportunity Qualification retrieval failure |
| Lifecycle | Invalid assessment transition |

## 30.2 Partial Completion

The system should support controlled partial completion where the architecture permits.

Examples:

- Deterministic assessment succeeds but Gemini fails.
- Executive Summary is unavailable but PADF results are available.
- Historical comparison fails while the current assessment remains available.

A partial result must clearly identify unavailable components.

The system must never display an incomplete assessment as fully completed.

## 30.3 Retry Strategy

Retry only operations that are safe to retry.

Recommended behavior:

- Retry transient network failures.
- Retry transient Gemini errors within a defined limit.
- Do not repeatedly retry invalid configuration.
- Do not duplicate assessment records.
- Use idempotency controls for persistence.
- Preserve failed execution details for diagnosis.

---

# 31. Observability and Technical Monitoring

## 31.1 System Monitoring

Monitor:

- Edge Function execution time.
- API response time.
- Database query latency.
- Database error rate.
- Storage access errors.
- Assessment processing time.
- Assessment completion rate.
- Assessment failure rate.

## 31.2 AI Monitoring

Monitor:

- Gemini request duration.
- Token usage.
- Model identifier.
- Prompt version.
- Output validation success.
- Retry count.
- Timeout rate.
- Reasoning completion rate.

## 31.3 Intelligence Monitoring

Monitor:

- Evidence processing completion.
- Evidence mapping coverage.
- Active factor resolution.
- PADF output completeness.
- SWOT output completeness.
- Formal risk output completeness.
- TOWS generation status.
- Strategy output completeness.
- Historical comparison availability.

## 31.4 Business Monitoring

Potential business-level metrics include:

- Recommendation acceptance.
- Action completion.
- Assessment frequency.
- Winability movement.
- Risk mitigation progress.
- Closed Won / Closed Lost outcomes.
- Forecast accuracy.

These metrics should be calculated only where the underlying data and approved methodology support them.

---

# 32. Testing and Quality Assurance

## 32.1 Testing Strategy

The implementation must include:

1. Unit testing.
2. Configuration validation testing.
3. Identifier and compatibility testing.
4. Evidence mapping testing.
5. Rules Engine testing.
6. Gemini output validation testing.
7. API integration testing.
8. Database and RLS testing.
9. Frontend component testing.
10. End-to-end workflow testing.
11. Historical reproducibility testing.
12. Performance testing.
13. Security testing.
14. Regression testing.

## 32.2 Critical Test Scenarios

### Scenario 1 — Standard Opportunity Assessment

Verify:

- Opportunity retrieval.
- Qualification inheritance.
- Configuration resolution.
- Evidence processing.
- Eight PADF dimensions.
- Active SWOT factor resolution.
- Deterministic assessment.
- Base winability.
- Risk evaluation.
- Risk-adjusted winability.
- TOWS integration.
- Winning Strategy.
- Gemini reasoning.
- Snapshot persistence.

### Scenario 2 — Missing Evidence

Verify:

- Missing evidence is represented as unknown or a gap.
- Missing evidence is not converted into negative evidence.
- No unsupported factor conclusion is generated.
- The UI clearly identifies evidence gaps.

### Scenario 3 — Contradictory Evidence

Verify:

- Supporting and contradicting evidence are both retained.
- Runtime relationship and polarity are preserved.
- Gemini explains the contradiction.
- The Rules Engine applies the approved logic.

### Scenario 4 — Unmapped SWOT Factor

Verify:

- No mapping is fabricated.
- The factor remains traceable.
- The UI identifies the absence of an approved mapping.
- No unsupported assessment conclusion is generated.

### Scenario 5 — Configuration Inheritance

Verify:

- Universal baseline resolution.
- Revenue-motion override.
- Industry override.
- Correct active factor set.
- Correct precedence.
- Canonical identifier resolution.

### Scenario 6 — Gemini Failure

Verify:

- Deterministic outputs remain preserved.
- Gemini status is marked failed or incomplete.
- No fabricated narrative is displayed.
- Retry is controlled.
- The assessment record remains traceable.

### Scenario 7 — Historical Reassessment

Verify:

- Earlier snapshot remains immutable.
- New assessment receives a new identifier.
- Configuration versions are recorded.
- Changes are attributed correctly.
- Historical comparison works.

### Scenario 8 — Multi-Tenant Security

Verify:

- Users cannot access unauthorized opportunities.
- Users cannot retrieve another tenant's evidence.
- Storage access respects tenant authorization.
- Backend functions enforce authorization independently of frontend controls.

---

# 33. Implementation Phases

The implementation should follow a controlled sequence.

## Phase 1 — Architecture and Source Validation

Tasks:

- Review the existing RevOS architecture.
- Review the approved product design.
- Validate all authoritative JSON assets.
- Confirm configuration versions.
- Confirm Rules v1.1 validation and activation status.
- Review existing Supabase schema.
- Review existing authentication and RLS.
- Define the implementation contracts.

Deliverables:

- Technical architecture confirmation.
- Data model mapping.
- Configuration validation report.
- Implementation backlog.

## Phase 2 — Core Data and Integration

Tasks:

- Implement opportunity data structures.
- Implement Opportunity Qualification inheritance.
- Implement evidence records.
- Implement assessment records.
- Implement historical snapshots.
- Implement configuration registry.
- Implement secure backend interfaces.

Deliverables:

- Core data architecture.
- Inheritance service.
- Evidence management service.
- Configuration loading service.

## Phase 3 — Intelligence and Rules Integration

Tasks:

- Implement context resolution.
- Implement evidence evaluation.
- Implement PADF processing.
- Implement SWOT integration.
- Implement Rules Engine orchestration.
- Integrate base winability.
- Integrate formal Risk Intelligence.
- Integrate TOWS and Winning Strategy.

Deliverables:

- Deterministic assessment pipeline.
- Structured assessment outputs.
- Evidence and factor lineage.

## Phase 4 — Gemini Reasoning Integration

Tasks:

- Implement prompt assembly.
- Integrate Gemini API.
- Validate structured outputs.
- Implement reasoning traceability.
- Implement timeout and retry handling.
- Record model and prompt versions.

Deliverables:

- Gemini reasoning service.
- Validated reasoning output.
- AI execution logs.

## Phase 5 — Frontend Implementation

Tasks:

- Pipeline Overview.
- Opportunity Assessment Workspace.
- Executive Summary.
- PADF interface.
- Evidence Intelligence interface.
- SWOT interface.
- Risk interface.
- TOWS and Winning Strategy interface.
- History and comparison interface.
- Responsive behavior.

Deliverables:

- Integrated Pipeline Assessment frontend.

## Phase 6 — Validation and Production Readiness

Tasks:

- Full regression testing.
- Rules and configuration validation.
- Gemini output testing.
- Security and RLS testing.
- Performance testing.
- Historical reproducibility testing.
- User acceptance testing.

Deliverables:

- Test results.
- Known issue register.
- Production readiness assessment.
- Approved deployment.

---

# 34. Technical Acceptance Criteria

The implementation will be considered technically acceptable when the following conditions are satisfied.

| Area | Acceptance Criteria |
|---|---|
| Opportunity Integration | Qualified opportunities can enter Pipeline Assessment with traceable inherited context. |
| Configuration | Industry and revenue-motion configuration resolves correctly. |
| Evidence | Actual evidence records are separate from reusable knowledge objects. |
| Evidence Relationships | All supported relationship and polarity values are preserved. |
| PADF | All eight authoritative dimensions are implemented. |
| SWOT | The correct opportunity-specific active factor set is resolved. |
| Rules | Deterministic outputs are generated according to the approved Rules contract. |
| Winability | Base and risk-adjusted winability remain separate. |
| Risk | Formal risks are distinguished from SWOT signals. |
| TOWS | SO, WO, ST, and WT relationships are supported without forced combinations. |
| Strategy | TOWS enriches the existing Winning Strategy process. |
| Gemini | Gemini interprets and explains authoritative inputs without replacing deterministic calculations. |
| Explainability | Important conclusions can be traced to evidence and assessment outputs. |
| History | Completed assessment snapshots remain immutable. |
| Governance | Configuration, Rules, and prompt versions are recorded. |
| Security | Authentication, tenant isolation, and RLS are enforced. |
| UI | The frontend implements the approved Asset 3 information architecture and interface layouts. |
| Performance | Initial performance targets are measured and evaluated. |
| Reliability | Errors and partial completion are clearly represented. |

---

# 35. Technical Implementation Boundaries and Governance

The following boundaries are mandatory.

## 35.1 Do Not Redesign Existing Intelligence Methodology

The implementation must preserve:

- PADF v1.0.
- PADIF v1.0.
- Existing winability methodology.
- Existing Risk Intelligence methodology.
- Existing Winning Strategy engine.
- Existing assessment lifecycle.
- Existing deterministic output contracts.

SWOT Intelligence is an integration and enrichment capability, not a replacement architecture.

## 35.2 Do Not Invent Configuration Relationships

The implementation must not invent:

- Evidence mappings.
- Factor definitions.
- Factor-to-dimension relationships.
- Risk crosswalks.
- Strategy crosswalks.
- Scoring formulas.
- Thresholds.
- Confidence conversions.

Where a crosswalk remains unresolved, preserve the unresolved state and do not create an assumed mapping.

## 35.3 Preserve Identifier Integrity

The implementation must use explicit canonical identifiers and approved compatibility registries.

Internal identifiers should be retained in the data layer even where the user interface displays friendly labels.

## 35.4 Preserve AI and Deterministic Boundaries

Gemini may:

- Explain.
- Interpret.
- Connect.
- Contextualize.
- Recommend.
- Identify implications.

Gemini may not:

- Calculate deterministic winability.
- Replace Rules Engine outputs.
- Invent evidence.
- Invent factor mappings.
- Create unsupported formal risks.
- Invent strategy identifiers.
- Override deterministic assessment results.

## 35.5 Preserve Historical Integrity

Every completed assessment must be reproducible in terms of its recorded inputs, configuration versions, rule versions, prompt version, and outputs.

The system must never silently rewrite a historical assessment because a newer configuration or model has become available.

---

# 36. Final Technical Architecture Principle

The RevOS Pipeline Assessment Engine must be implemented as:

**An evidence-driven, configuration-governed, deterministic and AI-reasoning-integrated pipeline intelligence system.**

It must not become:

- A traditional CRM opportunity scoring application.
- A generic AI-generated sales report.
- A static SWOT template.
- A standalone risk register.
- A second, competing winability engine.

Its architecture must preserve the following relationship:

```text
OPPORTUNITY CONTEXT
        |
        v
EVIDENCE INTELLIGENCE
        |
        v
PADF + SWOT ASSESSMENT
        |
        v
DETERMINISTIC RULES
        |
        v
WINABILITY + RISK INTELLIGENCE
        |
        v
TOWS + WINNING STRATEGY
        |
        v
GEMINI BUSINESS REASONING
        |
        v
EXECUTION ACTIONS
        |
        v
HISTORICAL LEARNING
```

The final technical objective is to enable RevOS to continuously understand the commercial reality of every qualified opportunity, explain why it is likely to win or lose, identify what threatens the outcome, and guide sales teams toward better strategic decisions and execution.

**Pipeline Assessment should therefore operate as a continuous pipeline winability intelligence and optimization engine—not merely as an assessment tool.**