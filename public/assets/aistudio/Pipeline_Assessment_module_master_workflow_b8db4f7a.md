# RevOS Pipeline Assessment Module
# Master Workflow Specification

**Document Name:** `Pipeline_Assessment_module_master_workflow.md`  
**Document Version:** 1.1  
**Product:** RevOS — Revenue Operating System  
**Module:** Pipeline Assessment  
**Document Type:** Master Workflow Specification  
**Status:** Draft for implementation alignment  
**Supersedes:** Pipeline Assessment Master Workflow v1.0, if applicable

---

# 1. Document Purpose

## 1.1 Purpose

This document defines the end-to-end master workflow of the RevOS Pipeline Assessment module.

It consolidates the approved product design, technical architecture, reasoning methodology, evidence intelligence framework, deterministic assessment rules, and user interaction model into one coordinated workflow.

The purpose is to establish a single reference for how Pipeline Assessment operates, from opportunity initiation and inherited qualification data through evidence evaluation, opportunity assessment, winability determination, risk analysis, strategy generation, and continuous pipeline monitoring.

It is intended to guide:

- Frontend implementation.
- Backend orchestration.
- Supabase Edge Function development.
- Gemini reasoning integration.
- Assessment Rules execution.
- UI workflow implementation.
- Data persistence and historical tracking.
- Functional and regression testing.

## 1.2 Governing Design Principle

Pipeline Assessment is not a one-time opportunity scoring tool.

It is a continuous, evidence-driven pipeline intelligence and winability optimization system.

The module must answer five fundamental business questions:

1. How winnable is this opportunity according to the established winability methodology?
2. Why does the opportunity have its current assessment and winability status?
3. What evidence supports, contradicts, qualifies, or contextualizes the assessment?
4. Which weaknesses, threats, risks, and evidence gaps could affect the outcome?
5. What strategic actions should be taken to improve winability and deal quality?

The workflow must connect evidence, deterministic assessment, AI reasoning, risk intelligence, and actionable strategy without allowing any individual component to replace another component's responsibilities.

---

# 2. Governing Assets and Frameworks

The following assets govern the Pipeline Assessment workflow.

## 2.1 Core Configuration Assets

| Asset | Version | Responsibility |
|---|---|---|
| `Pipeline_industry_configuration_JSON.json` | v1.1 | Industry and revenue-motion configuration, SWOT factor definitions, contextual overrides, factor evaluation configuration, and TOWS-related configuration |
| `Pipeline_evidence_knowledge_base.json` | v1.1 | Reusable evidence objects and evidence-to-SWOT-factor mapping catalogue |
| `Pipeline_Assessment_Rules.json` | v1.1 | Deterministic assessment orchestration, evaluation rules, winability, risk, strategy, lifecycle, and output governance |

**Important status note:** Pipeline Assessment Rules v1.1 remains a draft pending Stage 6 validation. Implementation must preserve this status and must not represent the Rules asset as production-validated until the required validation is completed.

## 2.2 Governing Methodology and Design Assets

| Asset | Responsibility |
|---|---|
| Pipeline Assessment Dimensions Framework (PADF) v1.0 | Defines the eight core opportunity assessment dimensions |
| Pipeline Assessment Data Inheritance Framework (PADIF) v1.0 | Defines inherited qualification data and its treatment within Pipeline Assessment |
| SWOT Intelligence Master Schema v1.0 | Defines the structured SWOT intelligence model |
| Pipeline Reasoning Strategy Specification v1.1 | Defines the business reasoning methodology and intelligence workflow |
| Gemini Pipeline Reasoning System Prompt v1.1 | Defines Gemini's reasoning responsibilities and constraints |
| Pipeline Product Design Specification v1.1 | Defines product experience, information architecture, and UI behavior |
| Pipeline Technical Design Specification v1.1 | Defines technical architecture, orchestration, interfaces, and data management |

The Master Workflow must remain consistent with all these assets.

If a conflict is discovered, the relevant governing framework or authoritative JSON configuration must be reviewed. This document must not silently redefine an existing methodology, rule, or data contract.

---

# 3. Core Architecture and Workflow Separation

The Pipeline Assessment module operates through three coordinated but distinct workflow layers.

## 3.1 Layer 1 — Business Lifecycle Workflow

This represents the complete user-facing business process.

It describes what users do and what business outcomes the module produces.

The lifecycle contains ten major stages:

1. Opportunity initiation.
2. Qualification data inheritance.
3. Opportunity context confirmation.
4. Evidence collection and validation.
5. Opportunity assessment and SWOT intelligence.
6. Base winability determination.
7. Risk evaluation and risk-adjusted winability.
8. TOWS strategic analysis.
9. Winning Strategy generation and execution.
10. Continuous monitoring, reassessment, and outcome closure.

## 3.2 Layer 2 — Intelligence and Reasoning Workflow

This represents how the system transforms opportunity information into business intelligence.

Its major components are:

- Qualification context inheritance.
- Opportunity-specific evidence collection.
- Industry and revenue-motion context resolution.
- Evidence-to-factor mapping.
- Evidence interpretation.
- PADF dimension assessment.
- SWOT factor assessment.
- Cross-dimension analysis.
- Winability analysis.
- Risk intelligence.
- TOWS strategic synthesis.
- Winning Strategy generation.
- Gemini narrative reasoning.
- Historical intelligence and reassessment.

This layer explains how the different intelligence engines work together.

## 3.3 Layer 3 — Deterministic Runtime Execution

This represents the controlled execution sequence governed by Pipeline Assessment Rules v1.1.

The ten runtime domains are:

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

These ten runtime domains are not the same as the ten business lifecycle stages.

The business lifecycle describes the user's journey and the evolution of an opportunity.

The runtime execution sequence describes how the system processes and validates information.

The three layers must remain coordinated without being merged into one sequence.

## 3.4 Overall Architecture

```text
                  USER / SALES TEAM
                         |
                         v
              PIPELINE ASSESSMENT UI
                         |
                         v
              BUSINESS LIFECYCLE LAYER
                         |
       +-----------------+-----------------+
       |                 |                 |
       v                 v                 v
  Opportunity       Evidence          Monitoring &
  Initiation        Management        Reassessment
       |                 |                 |
       +-----------------+-----------------+
                         |
                         v
              INTELLIGENCE WORKFLOW
                         |
       +-----------------+-----------------+
       |                 |                 |
       v                 v                 v
  Qualification     Evidence &         Industry /
  Inheritance       SWOT Mapping       Motion Context
       |                 |                 |
       +-----------------+-----------------+
                         |
                         v
                 PADF ASSESSMENT
                         |
                         v
                SWOT INTELLIGENCE
                         |
                         v
               DETERMINISTIC RULES
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
      Winability       Risk           Strategy
      Assessment     Intelligence    Orchestration
          |              |              |
          +--------------+--------------+
                         |
                         v
                  TOWS ANALYSIS
                         |
                         v
                WINNING STRATEGY
                         |
                         v
                 GEMINI REASONING
                         |
                         v
             VALIDATION AND OUTPUT
                         |
                         v
              SNAPSHOT AND HISTORY
                         |
                         v
                USER WORKSPACE
                         |
                         v
              CONTINUOUS IMPROVEMENT
```

---

# 4. Business Lifecycle Workflow

This section defines the ten major business stages.

## Stage 1 — Opportunity Initiation

### Objective

Create or select an opportunity for Pipeline Assessment.

### User Actions

The user enters the Pipeline Assessment module and selects an existing opportunity or initiates a new assessment.

The system identifies the opportunity and determines whether upstream Opportunity Qualification data is available.

### Required Information

The opportunity record should contain, where available:

- Opportunity name.
- Customer/account.
- Opportunity owner.
- Opportunity value.
- Currency.
- Sales stage.
- Expected close date.
- Industry.
- Revenue motion.
- Associated Opportunity Qualification record.
- Assessment status.

### System Actions

1. Retrieve the opportunity record.
2. Identify the associated Opportunity Qualification record.
3. Retrieve the applicable qualification output.
4. Check whether a previous Pipeline Assessment exists.
5. Determine whether the workflow is a first assessment or reassessment.
6. Initialize the assessment context.

### Output

An initialized Pipeline Assessment workspace.

### Important Rule

Pipeline Assessment must not begin its substantive assessment process without the mandatory SQL-QIP inherited input defined in the approved data inheritance framework.

If the required qualification output is unavailable, the system must identify the missing dependency and prevent the user from interpreting an incomplete assessment as a completed one.

---

## Stage 2 — Qualification Data Inheritance

### Objective

Bring upstream qualification intelligence into Pipeline Assessment.

The SQL Qualification Intelligence Profile (SQL-QIP) is a mandatory inherited input.

It provides the initial opportunity intelligence baseline.

### Inheritance Principle

The system follows the three inheritance operations:

| Operation | Meaning |
|---|---|
| Inherit | Preserve validated upstream information that remains applicable |
| Extend | Add new opportunity-specific information or evidence |
| Revalidate | Reassess inherited information when circumstances or evidence have changed |

### Inherited Information

The inherited data may include:

- Validated business problem.
- Customer value and expected outcomes.
- Business metrics and success criteria.
- Stakeholder information.
- Buying-center intelligence.
- Decision criteria.
- Buying process.
- Commercial readiness.
- Competitive information.
- Opportunity momentum.
- Previously identified risks.
- Existing recommendations.
- Supporting evidence.
- Qualification history and provenance.

The exact inherited fields must follow PADIF v1.0 and the approved data contract.

### System Workflow

```text
SQL-QIP
   |
   v
Retrieve Qualification Output
   |
   v
Validate Source and Version
   |
   v
Apply PADIF
   |
   +-------------------------------+
   |                               |
   v                               v
INHERIT                         REVALIDATE
   |                               |
   v                               v
Preserve Validated              Identify Changed /
Information                     Stale Information
   |                               |
   +---------------+---------------+
                   |
                   v
             EXTEND WITH
         Opportunity Evidence
                   |
                   v
         Pipeline Assessment
          Baseline Context
```

### Critical Rules

1. SQL-QIP is a mandatory input.
2. Validated inherited evidence must retain its source and provenance.
3. Inherited risks and recommendations must remain traceable.
4. Inherited information must not automatically be treated as current without considering its validity and relevance.
5. Opportunity-level scores and assessments must be independently calculated by Pipeline Assessment.
6. Pipeline Assessment must not simply copy upstream qualification scores.
7. Historical qualification information must remain accessible.

### Output

A structured inherited opportunity intelligence baseline.

---

## Stage 3 — Opportunity Context Confirmation

### Objective

Establish the correct assessment context before evaluating evidence.

### Context Inputs

The system resolves:

- Industry.
- Revenue motion.
- Opportunity characteristics.
- Applicable universal configuration.
- Revenue-motion configuration.
- Industry-specific configuration.
- Applicable assessment configuration versions.

### Configuration Hierarchy

The configuration resolution hierarchy is:

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
Resolved Opportunity Configuration
```

More-specific configuration takes precedence over less-specific configuration.

The system must use explicit canonical identifiers and alias registries.

It must not rely on array position, approximate string matching, or unsupported fuzzy identification.

### Canonical Revenue Motion IDs

| Canonical ID | Revenue Motion |
|---|---|
| `RM01_Digital_Solution_Selling` | Digital Solution Selling |
| `RM02_Professional_Solution_Services` | Professional & Solution Services |
| `RM03_Digital_Transformation_OT` | Digital Transformation & OT |
| `RM04_Engineering_Project_Solutions` | Engineering & Project Solutions |
| `RM05_Project_Procurement` | Project & Procurement |
| `RM06_Generic_Solution_Selling` | Generic Solution Selling |

### SWOT Factor Resolution

The complete configuration catalogue contains 96 SWOT factor references:

- 8 universal factors.
- 24 revenue-motion factors.
- 64 industry-specific factors.

For a resolved opportunity, the intended active factor set is 16:

- 8 universal factors.
- 4 revenue-motion factors.
- 4 industry-specific factors.

The active set must be resolved from the authoritative configuration rather than selected by hard-coded array positions.

### Important Distinction

A configured SWOT factor is an assessment lens or hypothesis.

It is not evidence and must not be presented as proof that a particular strength, weakness, opportunity, or threat exists.

### Output

A resolved opportunity assessment context containing the applicable configuration and active factor set.

---

## Stage 4 — Evidence Collection and Validation

### Objective

Build a reliable evidence foundation for opportunity assessment.

Pipeline Assessment must evaluate actual opportunity evidence rather than rely exclusively on generic industry assumptions or preconfigured factors.

### Evidence Sources

Evidence may originate from:

1. Inherited SQL-QIP evidence.
2. New opportunity-specific evidence supplied by the user.
3. Additional evidence obtained through supported RevOS integrations or workflows.
4. Updated or corrected evidence from existing opportunity records.

The availability of a source must be determined by the implemented product capabilities.

### Evidence Management Process

```text
Inherited SQL-QIP Evidence
           |
           v
New Opportunity Evidence
           |
           v
Evidence Registration
           |
           v
Source / Date / Ownership
           |
           v
Evidence Validation
           |
           v
Evidence Knowledge Base
           |
           v
Evidence-to-SWOT Mapping
           |
           v
Runtime Interpretation
           |
           v
PADF / SWOT Assessment
```

### Evidence Knowledge Base

The v1.1 Evidence Knowledge Base contains:

- 48 reusable evidence objects.
- 373 evidence-to-SWOT mappings.
- 169 DIRECT mappings.
- 87 SUPPORTING mappings.
- 117 INDIRECT mappings.

The mapping catalogue covers 82 of the 96 configured factors.

Fourteen factors are intentionally unmapped in the current catalogue.

Six evidence objects are not referenced in the mapping catalogue.

These coverage characteristics must not be silently altered by the runtime.

### Evidence Mapping Rules

The system must distinguish:

- Reusable evidence object.
- Opportunity-specific evidence instance.
- Evidence-to-factor mapping.
- Runtime evidence interpretation.
- Factor assessment.

The mapping catalogue's `evidenceId` and evidence objects' `evidenceObjectId` fields must be connected through an explicit compatibility or normalization contract.

The system must not assume that these fields are interchangeable without that contract.

### Mapping Strength

The mapping catalogue supports three mapping strengths:

| Mapping Strength | Meaning |
|---|---|
| DIRECT | Strong and direct relevance to the configured factor |
| SUPPORTING | Provides supporting information relevant to the factor |
| INDIRECT | Provides contextual or indirect relevance |

Mapping strength represents the predefined relationship between an evidence type and a factor.

It does not represent the quality or confidence of the actual opportunity evidence.

### Runtime Relationship

The runtime interpretation must distinguish the following relationships:

| Runtime Relationship | Meaning |
|---|---|
| `SUPPORTS` | Evidence supports the factor or assessment |
| `CONTRADICTS` | Evidence conflicts with the factor or assessment |
| `QUALIFIES` | Evidence adds conditions or limitations |
| `CONTEXTUALIZES` | Evidence provides additional context |
| `GAP_SIGNAL` | Evidence indicates missing or insufficient information |
| `CHANGE_SIGNAL` | Evidence indicates a change in the opportunity situation |

### Runtime Polarity

| Polarity | Meaning |
|---|---|
| `POSITIVE` | Positive implication |
| `NEGATIVE` | Negative implication |
| `MIXED` | Both positive and negative implications |
| `NEUTRAL` | No clear directional implication |
| `UNDETERMINED` | Insufficient information to establish direction |

### Evidence Quality and Confidence

Evidence quality and evidence confidence must be treated as separate concepts.

The system must not confuse:

- Mapping relevance.
- Evidence quality.
- Evidence confidence.
- Runtime relationship.
- Runtime polarity.
- Factor assessment.

The Evidence Knowledge Base confidence scale of 0–100 must not be directly equated with the Industry Configuration factor `evidence_confidence` scale of 1–5.

Any transformation requires an explicitly approved mapping contract.

### Critical Evidence Rules

1. Missing evidence means unknown, not negative.
2. A configured factor does not prove the factor exists.
3. An evidence mapping does not prove the evidence is valid.
4. Mapping relevance is not evidence confidence.
5. Contradictory evidence must remain visible.
6. Evidence provenance must be preserved.
7. Reusable evidence objects must not carry a fixed opportunity-specific polarity.
8. Unmapped factors must not receive fabricated evidence mappings.

### Output

A validated opportunity evidence register with traceable evidence relationships and runtime interpretation.

---

## Stage 5 — Opportunity Assessment and SWOT Intelligence

### Objective

Evaluate the opportunity across the eight PADF dimensions while developing complementary SWOT intelligence.

PADF and SWOT are two complementary assessment perspectives.

They must not be merged into one assessment framework.

## 5.1 PADF Assessment

The Pipeline Assessment Dimensions Framework contains eight dimensions.

| ID | Assessment Dimension |
|---|---|
| `PA1_Customer_Value_and_Urgency` | Customer Value & Urgency |
| `PA2_Buying_Center_and_Influence` | Buying Center & Influence |
| `PA3_Buying_Process_and_Decision_Control` | Buying Process & Decision Control |
| `PA4_Solution_and_Value_Proposition` | Solution & Value Proposition |
| `PA5_Competitive_Position` | Competitive Position |
| `PA6_Commercial_and_Deal_Structure` | Commercial & Deal Structure |
| `PA7_Sales_Execution_and_Deal_Readiness` | Sales Execution & Deal Readiness |
| `PA8_Deal_Momentum_Risk_and_Closeability` | Deal Momentum, Risk & Closeability |

Each dimension must be evaluated using the applicable deterministic assessment rules.

### PADF Assessment Process

1. Retrieve inherited qualification context.
2. Retrieve current opportunity evidence.
3. Evaluate evidence relevance and validity.
4. Identify evidence supporting the dimension.
5. Identify contradictory or qualifying evidence.
6. Identify information gaps.
7. Execute applicable dimension assessment rules.
8. Produce the dimension-level assessment.
9. Preserve assessment rationale and provenance.

### PADF Output

Each dimension should provide, where supported by the authoritative Rules output:

- Assessment result or status.
- Deterministic score, if defined.
- Supporting evidence.
- Contradictory evidence.
- Evidence gaps.
- Key observations.
- Relevant risks.
- Historical comparison.
- Assessment rationale.

The UI must not invent a score or threshold where none is defined by the governing Rules.

## 5.2 SWOT Intelligence Assessment

SWOT provides a second perspective that identifies the opportunity's internal and external strategic conditions.

The active factor set contains 16 configured factors:

| Factor Layer | Active Factor Count |
|---|---:|
| Universal | 8 |
| Revenue Motion | 4 |
| Industry | 4 |
| **Total** | **16** |

Each factor must be evaluated using actual opportunity evidence and the applicable configuration.

### SWOT Evaluation Process

```text
Resolved Active Factors
          |
          v
Evidence-to-Factor Mapping
          |
          v
Opportunity Evidence Retrieval
          |
          v
Runtime Evidence Interpretation
          |
          v
Factor Evaluation
          |
          v
Evidence-Supported SWOT Result
          |
          v
SWOT Intelligence Output
```

### Factor Assessment

For each active factor, the system should determine:

- Whether the factor is supported.
- Whether it is contradicted.
- Whether the evidence qualifies or contextualizes it.
- Whether information is insufficient.
- Which evidence supports the interpretation.
- Which evidence challenges the interpretation.
- What implications the factor has for the opportunity.

The system must preserve the configuration layer and source provenance.

### SWOT Categories

- Strengths.
- Weaknesses.
- Opportunities.
- Threats.

### PADF and SWOT Integration

SWOT enriches PADF through contextual and many-to-many relationships.

It does not:

- Create additional PADF dimensions.
- Replace PADF assessment.
- Independently replace the winability engine.
- Automatically create formal risks.
- Replace the existing Winning Strategy engine.

### Output

A structured SWOT intelligence assessment linked to evidence and PADF dimensions.

---

## Stage 6 — Base Winability Determination

### Objective

Determine the opportunity's base winability using the existing authoritative winability methodology.

### Inputs

- PADF dimension assessment outputs.
- Validated evidence.
- Relevant cross-dimension relationships.
- Inherited opportunity context.
- Applicable deterministic assessment rules.

### System Process

1. Retrieve completed PADF assessment outputs.
2. Retrieve applicable cross-dimension evaluation results.
3. Execute the existing deterministic winability methodology.
4. Calculate the base winability output.
5. Record the underlying assessment rationale and rule provenance.
6. Preserve the result for subsequent risk evaluation.

### Critical Rule

The existing winability engine remains authoritative.

Neither Gemini nor the SWOT intelligence layer may independently replace or recalculate the established winability result.

### Base Winability vs Risk-Adjusted Winability

The workflow must distinguish:

**Base Winability**

The result produced by the established winability methodology before the applicable risk adjustment.

**Risk-Adjusted Winability**

The result after the authoritative Risk Intelligence process has evaluated relevant risks and applied the approved risk-adjustment rules.

These two results must not be presented as interchangeable.

### Output

A deterministic base winability result with its assessment provenance.

---

## Stage 7 — Risk Evaluation and Risk-Adjusted Winability

### Objective

Identify and evaluate formal opportunity risks and determine their implications for winability.

### Risk Inputs

- Existing inherited risks.
- Current opportunity evidence.
- PADF assessment outputs.
- SWOT weaknesses and threats.
- Relevant risk triggers.
- Applicable Industry Configuration risk patterns.
- Existing Risk Intelligence rules.

### Risk Evaluation Process

```text
Inherited Risks
       |
       v
Current Opportunity Evidence
       |
       v
PADF / SWOT Signals
       |
       v
Risk Trigger Evaluation
       |
       v
Risk Intelligence Engine
       |
       v
Formal Risk Assessment
       |
       v
Risk Evaluation and Prioritization
       |
       v
Risk Adjustment Rules
       |
       v
Risk-Adjusted Winability
```

### Formal Risk Assessment

Where supported by the authoritative risk output, each formal risk should include:

- Risk description.
- Risk category.
- Source or trigger.
- Related evidence.
- Severity.
- Likelihood.
- Business impact.
- Risk status.
- Mitigation requirements.
- Owner.
- Review status.
- Historical changes.

The system must use the actual deterministic output schema and must not invent additional scoring dimensions or thresholds.

### Important SWOT-to-Risk Distinction

A SWOT threat or weakness is not automatically a formal risk.

A SWOT factor may indicate a potential risk signal that requires further evaluation.

The Risk Intelligence engine remains responsible for determining whether that signal becomes a formal risk under the applicable rules.

### Risk-Adjusted Winability

After formal risk evaluation:

1. Retrieve the base winability result.
2. Retrieve applicable formal risk outputs.
3. Execute the approved risk-adjustment rules.
4. Produce risk-adjusted winability.
5. Preserve the base and adjusted results separately.
6. Record the rationale and contributing risk factors.

### Output

Formal opportunity risk assessment and risk-adjusted winability.

---

## Stage 8 — TOWS Strategic Analysis

### Objective

Translate evidence-supported SWOT intelligence into structured strategic responses.

SWOT identifies the opportunity's strategic conditions.

TOWS converts those conditions into possible strategic actions.

### TOWS Matrix

| Strategy Type | Strategic Logic | Objective |
|---|---|---|
| SO | Strengths + Opportunities | Use strengths to capture opportunities |
| WO | Weaknesses + Opportunities | Address weaknesses to unlock opportunities |
| ST | Strengths + Threats | Use strengths to respond to threats |
| WT | Weaknesses + Threats | Reduce exposure arising from weaknesses and threats |

### TOWS Workflow

```text
Evidence-Supported SWOT
          |
          v
Identify Relevant Factor Combinations
          |
          v
Evaluate Strategic Relationships
          |
          v
Generate TOWS Strategies
          |
          v
Evaluate Strategic Rationale
          |
          v
Check Evidence and Configuration Support
          |
          v
Produce TOWS Strategic Candidates
```

### TOWS Strategy Requirements

Each strategy candidate should include, where supported:

- TOWS category.
- Related Strength factors.
- Related Weakness factors.
- Related Opportunity factors.
- Related Threat factors.
- Supporting evidence.
- Strategic rationale.
- Intended business objective.
- Relevant risks.
- Expected directional impact.
- Implementation considerations.

### Strategy Integrity

The system must not fabricate factor combinations or mappings.

If the available evidence does not support a meaningful strategic combination, the system should explain why a TOWS strategy cannot be confidently generated.

### Relationship with Winning Strategy

TOWS enriches and informs the existing Winning Strategy engine.

It does not replace the existing strategy engine or independently redefine its strategy categories.

Any strategy category-to-industry strategy ID crosswalk must follow an approved mapping contract.

Unresolved crosswalks must not be guessed.

### Output

A structured set of evidence-supported TOWS strategic candidates.

---

## Stage 9 — Winning Strategy Generation and Execution

### Objective

Convert the assessment, winability, risk, and TOWS intelligence into an actionable opportunity-winning strategy.

### Inputs

- PADF assessment.
- Base winability.
- Risk-adjusted winability.
- Formal risk assessment.
- SWOT intelligence.
- TOWS strategic candidates.
- Existing Winning Strategy engine outputs.
- Opportunity context.
- Historical assessment information.

### Strategy Generation Workflow

```text
PADF Assessment
       |
       v
Winability Assessment
       |
       v
Risk Intelligence
       |
       v
SWOT Intelligence
       |
       v
TOWS Strategic Candidates
       |
       v
Existing Winning Strategy Engine
       |
       v
Strategy Evaluation
       |
       v
Winning Strategy Output
       |
       v
Execution Actions
```

### Winning Strategy Output

The final strategy should be organized around actionable business priorities.

Where supported by the authoritative strategy output, each strategic recommendation should include:

- Strategic objective.
- Strategic rationale.
- Supporting evidence.
- Relevant PADF dimensions.
- Related SWOT factors.
- Related formal risks.
- Recommended action.
- Expected directional impact.
- Priority.
- Dependencies.
- Suggested timing.
- Responsible owner, if known.
- Success indicators.
- Execution status.

### Action Orientation

Recommendations should address specific opportunity weaknesses and risks rather than provide generic sales advice.

Examples of strategic action themes may include:

- Strengthening executive sponsorship.
- Improving customer value justification.
- Addressing competitive positioning.
- Reducing commercial exposure.
- Improving buying-process control.
- Resolving evidence gaps.
- Accelerating decision progress.
- Improving deal quality.

These are illustrative action themes, not additional deterministic strategy categories.

### Output

A structured Winning Strategy with prioritized actions and execution tracking.

---

## Stage 10 — Continuous Monitoring, Reassessment, and Outcome Closure

### Objective

Maintain an evolving view of opportunity health and winability throughout the opportunity lifecycle.

Pipeline Assessment must not treat the initial assessment as the final truth.

Opportunity conditions change.

Evidence changes.

Stakeholder relationships change.

Competition changes.

Risks emerge or disappear.

Customer priorities and decision processes evolve.

The assessment must evolve accordingly.

### Reassessment Triggers

Reassessment may be initiated when:

1. New opportunity evidence is added.
2. Existing evidence is updated.
3. Inherited information changes.
4. A significant stakeholder change occurs.
5. Customer requirements change.
6. Buying-process information changes.
7. Competitive positioning changes.
8. A new risk emerges.
9. An existing risk is mitigated or escalated.
10. An important strategic action is completed or delayed.
11. The opportunity advances to a new sales stage.
12. The expected close date changes.
13. The opportunity is closed.

The implementation must support the triggers actually enabled by the product and its integrations.

### Reassessment Process

```text
Previous Assessment Snapshot
             |
             v
       Detect Changes
             |
             v
       Identify Impacted Areas
             |
             v
       Update Evidence
             |
             v
       Re-run Applicable Rules
             |
             v
       Reassess PADF / SWOT
             |
             v
       Recalculate Winability
             |
             v
       Reevaluate Risks
             |
             v
       Update TOWS / Strategy
             |
             v
       Generate New Assessment
             |
             v
       Compare With Previous
             |
             v
       Save New Snapshot
```

### Historical Comparison

The system must preserve and compare:

- Evidence changes.
- PADF dimension changes.
- SWOT factor interpretation changes.
- Risk changes.
- Base winability changes.
- Risk-adjusted winability changes.
- TOWS strategy changes.
- Winning Strategy changes.
- Action execution progress.
- Opportunity stage changes.
- Final opportunity outcome.

### Methodology and Configuration Changes

The system must distinguish business changes from methodology changes.

For example:

- A new customer commitment is a business evidence change.
- A revised industry configuration is a configuration change.
- A new Rules version is a methodology or execution change.

Historical comparisons must preserve the relevant asset versions so that changes can be interpreted correctly.

### Outcome Closure

When the opportunity reaches Closed Won or Closed Lost:

1. Capture the final opportunity status.
2. Preserve the final assessment snapshot.
3. Record final winability and risk-adjusted winability where available.
4. Preserve the final risk and strategy states.
5. Record the opportunity outcome.
6. Retain the assessment history.
7. Make the outcome available for future analysis where supported.

### Output

A complete longitudinal opportunity intelligence record.

---

# 5. Deterministic Runtime Orchestration

This section defines how the backend executes the assessment workflow.

The runtime must follow the authoritative orchestration and rules defined in Pipeline Assessment Rules v1.1.

## 5.1 Runtime Execution Sequence

The ten deterministic execution domains are:

| Sequence | Runtime Domain | Responsibility |
|---|---|---|
| 1 | Context Resolution | Resolve opportunity context, configuration hierarchy, and active factors |
| 2 | Data Validation | Validate inputs, identifiers, versions, dependencies, and required data |
| 3 | Evidence Evaluation | Resolve evidence objects, mappings, relationships, polarity, and evidence interpretation |
| 4 | Dimension Assessment | Execute PADF dimension assessment |
| 5 | Cross-Dimension Adjustment | Apply approved relationships and cross-dimension adjustments |
| 6 | Winability | Calculate base winability using the existing methodology |
| 7 | Risk | Evaluate formal risks and calculate risk-adjusted winability |
| 8 | Strategy | Execute TOWS integration and existing Winning Strategy orchestration |
| 9 | Lifecycle | Manage assessment state, reassessment, and lifecycle transitions |
| 10 | Output | Validate, persist, version, and return assessment results |

This sequence represents runtime execution domains.

It does not redefine the business lifecycle stages.

## 5.2 Detailed Runtime Workflow

```text
                    ASSESSMENT REQUEST
                           |
                           v
                 1. CONTEXT RESOLUTION
                           |
                           v
                  2. DATA VALIDATION
                           |
                           v
                  3. EVIDENCE EVALUATION
                           |
                           v
                 4. PADF DIMENSION
                    ASSESSMENT
                           |
                           v
                 5. CROSS-DIMENSION
                     ADJUSTMENT
                           |
                           v
                    6. WINABILITY
                     CALCULATION
                           |
                           v
                     7. RISK ENGINE
                           |
                           v
                RISK-ADJUSTED WINABILITY
                           |
                           v
                    8. STRATEGY
                     ORCHESTRATION
                           |
                 +---------+---------+
                 |                   |
                 v                   v
             SWOT / TOWS       WINNING STRATEGY
                 |                   |
                 +---------+---------+
                           |
                           v
                    GEMINI REASONING
                           |
                           v
                    OUTPUT VALIDATION
                           |
                           v
                   9. LIFECYCLE UPDATE
                           |
                           v
                     10. OUTPUT
                           |
                +----------+----------+
                |                     |
                v                     v
           SAVE SNAPSHOT         RETURN RESULT
                |                     |
                +----------+----------+
                           |
                           v
                     UI REFRESH
```

The diagram illustrates the intended functional dependencies. Actual execution order between parallelizable subcomponents must remain governed by the Rules and Technical Design specifications.

## 5.3 Runtime Responsibility Matrix

| Component | Primary Responsibility | Must Not |
|---|---|---|
| Opportunity Context Resolver | Resolve context and configuration | Guess industry or revenue-motion identifiers |
| Data Inheritance Processor | Apply PADIF | Copy upstream scores as Pipeline Assessment scores |
| Evidence Processor | Normalize and evaluate evidence | Treat missing evidence as negative |
| Evidence Mapping Engine | Resolve approved mappings | Fabricate missing mappings |
| PADF Assessment Engine | Assess eight dimensions | Create additional dimensions |
| SWOT Intelligence Engine | Evaluate active SWOT factors | Replace PADF or winability |
| Winability Engine | Calculate base winability | Be replaced by Gemini |
| Risk Intelligence Engine | Evaluate formal risks | Automatically promote all SWOT threats into risks |
| Risk Adjustment Engine | Calculate risk-adjusted winability | Change the authoritative base result |
| TOWS Engine | Generate strategic candidates | Invent unsupported factor combinations |
| Winning Strategy Engine | Produce opportunity strategy | Be replaced by TOWS or Gemini |
| Gemini Reasoning Layer | Interpret and explain authoritative results | Recalculate deterministic outputs |
| Validation Layer | Check output integrity | Silently correct unsupported data |
| Snapshot Manager | Persist versioned assessments | Overwrite historical snapshots |

---

# 6. Gemini Reasoning Workflow

## 6.1 Purpose

Gemini provides the interpretive reasoning layer that turns structured assessment outputs into meaningful business intelligence.

It is not the deterministic assessment engine.

It must work with the actual opportunity evidence, authoritative configuration assets, and deterministic outputs.

## 6.2 Gemini Input

Gemini may receive:

- Opportunity context.
- Inherited SQL-QIP information.
- Current opportunity evidence.
- Evidence-to-factor mappings.
- Runtime evidence interpretations.
- PADF assessment outputs.
- SWOT factor assessment outputs.
- Base winability result.
- Formal risk assessment.
- Risk-adjusted winability.
- TOWS strategic candidates.
- Winning Strategy outputs.
- Historical comparison information.
- Relevant asset and rule versions.

The exact request and response structures must follow the approved technical design and system prompt.

## 6.3 Gemini Reasoning Responsibilities

Gemini should:

1. Explain the current opportunity assessment.
2. Identify the most important supporting evidence.
3. Explain contradictory evidence.
4. Explain significant evidence gaps.
5. Interpret the implications of PADF and SWOT results.
6. Explain why the opportunity has its current winability status.
7. Explain the business implications of formal risks.
8. Interpret TOWS strategic candidates.
9. Explain the logic behind the Winning Strategy.
10. Identify changes since the previous assessment.
11. Produce concise executive-level summaries.
12. Translate assessment outputs into understandable sales actions.

## 6.4 Required Reasoning Structure

Where applicable, explanations should follow:

```text
Evidence
   |
   v
Evidence Interpretation
   |
   v
Factor / Dimension Implication
   |
   v
Business Impact
   |
   v
Assessment Implication
   |
   v
Strategic Response
```

## 6.5 Reasoning Integrity

Gemini must distinguish:

- Verified facts.
- Evidence-based interpretations.
- Inferences.
- Assumptions.
- Unknowns.
- Recommendations.

It must not:

- Invent evidence.
- Invent mappings.
- Fabricate scores.
- Create unsupported thresholds.
- Calculate or replace winability.
- Create unsupported risk IDs.
- Invent strategy IDs or crosswalks.
- Convert incompatible confidence scales.
- Interpret missing evidence as negative evidence.
- Claim a configured factor is proven.
- Produce unsupported numeric winability uplift.

## 6.6 Gemini Output

The output should be structured and consumable by the UI.

It should include, as appropriate:

- Executive summary.
- Assessment explanation.
- Key opportunity strengths.
- Key opportunity weaknesses.
- External opportunities.
- External threats.
- Critical evidence gaps.
- Key risk explanations.
- Strategic implications.
- Priority actions.
- Historical change explanation.
- Confidence and uncertainty qualifications.

The output must retain references to the underlying authoritative results.

---

# 7. End-to-End Data Flow

## 7.1 Input Data

The workflow uses the following major input categories.

| Input Category | Source | Purpose |
|---|---|---|
| Opportunity Record | RevOS opportunity data | Opportunity identity and commercial context |
| SQL-QIP | Opportunity Qualification | Mandatory inherited qualification intelligence |
| New Evidence | User or supported data source | Current opportunity evidence |
| Industry Configuration | Industry Configuration JSON v1.1 | Context and active SWOT factors |
| Evidence Knowledge Base | Evidence KB v1.1 | Evidence objects and approved mappings |
| Assessment Rules | Rules JSON v1.1 | Deterministic execution |
| PADF | PADF v1.0 | Eight-dimension assessment methodology |
| PADIF | PADIF v1.0 | Inheritance methodology |
| SWOT Schema | SWOT Intelligence Master Schema v1.0 | SWOT data structure |
| Historical Assessments | Pipeline Assessment records | Longitudinal analysis |

## 7.2 Processing Data

The workflow generates intermediate data such as:

- Resolved opportunity context.
- Inherited qualification context.
- Evidence instances.
- Evidence validation results.
- Evidence mapping results.
- Runtime evidence relationships.
- Runtime polarity.
- PADF assessment results.
- SWOT factor assessment results.
- Cross-dimension results.
- Base winability.
- Formal risk assessment.
- Risk-adjusted winability.
- TOWS candidates.
- Winning Strategy outputs.
- Gemini reasoning outputs.

Intermediate data must retain the appropriate identifiers, provenance, and version references.

## 7.3 Final Output

The final Pipeline Assessment output should contain:

1. Opportunity assessment summary.
2. PADF assessment.
3. Evidence register and interpretation.
4. SWOT intelligence.
5. Base winability.
6. Formal risk assessment.
7. Risk-adjusted winability.
8. TOWS strategic analysis.
9. Winning Strategy.
10. Priority actions.
11. Historical comparison.
12. Assessment provenance and version information.

The actual output structure must follow the approved technical data contract.

---

# 8. UI and Interface Workflow Design

This section translates the master workflow into the user-facing product experience.

The UI must make the complete assessment process understandable without exposing unnecessary technical complexity.

The experience should support both operational users who manage opportunities and executives who need a concise view of pipeline health and winability.

## 8.1 Main Navigation Structure

Recommended opportunity-level navigation:

```text
Pipeline Assessment
│
├── Pipeline Overview
│
└── Opportunity Workspace
      │
      ├── Executive Summary
      ├── PADF Assessment
      ├── Evidence
      ├── SWOT Intelligence
      ├── Risk Intelligence
      ├── TOWS & Winning Strategy
      └── History & Changes
```

Configuration and execution diagnostics should be available through a separate administrative or authorized technical interface.

The normal sales user should not need to navigate internal rule IDs or technical JSON structures.

## 8.2 Pipeline Overview

### Purpose

Provide a portfolio-level view of opportunities and their current assessment status.

### Recommended Layout

```text
+---------------------------------------------------------------+
| PIPELINE ASSESSMENT                                           |
| Continuous Pipeline Intelligence & Winability Optimization   |
+---------------------------------------------------------------+
|                                                               |
| [Total Opportunities] [Pipeline Value] [Winability Overview] |
| [Risk Exposure]       [Assessment Coverage]                   |
|                                                               |
+---------------------------------------------------------------+
| FILTERS                                                       |
| Industry | Revenue Motion | Stage | Owner | Close Date        |
| Assessment Status | Risk Status                               |
+---------------------------------------------------------------+
|                                                               |
| OPPORTUNITY PORTFOLIO                                         |
|                                                               |
| Opportunity | Customer | Value | Stage | Winability | Risk    |
|---------------------------------------------------------------|
| Opportunity A | Customer A | ... | ... | ... | ...            |
| Opportunity B | Customer B | ... | ... | ... | ...            |
| Opportunity C | Customer C | ... | ... | ... | ...            |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
| SELECTED OPPORTUNITY                                          |
| [View Assessment] [Reassess]                                  |
|                                                               |
+---------------------------------------------------------------+
```

### KPI Requirements

The portfolio may display:

- Total opportunities.
- Total pipeline value.
- Weighted pipeline value, if supported by an approved calculation.
- Winability distribution.
- Risk exposure.
- Assessment coverage.
- Opportunities requiring attention.

All calculated metrics must originate from approved deterministic outputs or explicitly approved aggregation logic.

The UI must not invent portfolio-level formulas.

## 8.3 Opportunity Workspace

### Purpose

Provide a unified workspace for understanding and managing one opportunity.

### Header Layout

```text
+---------------------------------------------------------------+
| Opportunity Name                              [Reassess]      |
| Customer | Owner | Industry | Revenue Motion                  |
|                                                               |
| Value | Sales Stage | Expected Close Date                     |
+---------------------------------------------------------------+
| BASE WINABILITY       | RISK-ADJUSTED WINABILITY              |
| [Authoritative value] | [Authoritative value]                 |
|                                                               |
| Assessment Status | Evidence Status | Risk Status             |
+---------------------------------------------------------------+
| Executive Summary | PADF | Evidence | SWOT | Risk             |
| TOWS & Strategy | History                                  |
+---------------------------------------------------------------+
```

### Header Requirements

The header must show:

- Opportunity identity.
- Customer.
- Value and currency.
- Owner.
- Sales stage.
- Expected close date.
- Industry.
- Revenue motion.
- Last assessment date.
- Assessment status.

Where available, show base and risk-adjusted winability separately.

The interface must clearly distinguish these two results.

## 8.4 Executive Summary

### Purpose

Provide an executive-level understanding of the opportunity.

### Recommended Layout

```text
+---------------------------------------------------------------+
| EXECUTIVE SUMMARY                                             |
+---------------------------------------------------------------+
|                                                               |
| OVERALL OPPORTUNITY ASSESSMENT                                |
| Gemini-generated explanation based on validated outputs      |
|                                                               |
+---------------------------------------------------------------+
| KEY STRENGTHS              | KEY WEAKNESSES                    |
| Evidence-backed items      | Evidence-backed items            |
+---------------------------------------------------------------+
| KEY OPPORTUNITIES          | KEY THREATS                       |
| Evidence-backed items      | Evidence-backed items            |
+---------------------------------------------------------------+
|                                                               |
| WINABILITY EXPLANATION                                        |
| Why does the opportunity have its current assessment?        |
|                                                               |
+---------------------------------------------------------------+
| CRITICAL RISKS                                                |
| Formal risks and business implications                       |
+---------------------------------------------------------------+
| PRIORITY ACTIONS                                              |
| Recommended actions and execution status                     |
+---------------------------------------------------------------+
|                                                               |
| [View Evidence] [View Detailed Assessment] [View Strategy]    |
+---------------------------------------------------------------+
```

### Design Requirements

- Executive-level narrative should be concise.
- Every material conclusion should be traceable.
- Evidence gaps must be visible.
- Important uncertainties must not be hidden.
- Priority actions should be prominent.
- AI-generated interpretations must be distinguishable from deterministic outputs.

## 8.5 PADF Assessment Interface

### Purpose

Show the eight assessment dimensions and explain the current state of each.

### Recommended Layout

```text
+---------------------------------------------------------------+
| PADF ASSESSMENT                                               |
+---------------------------------------------------------------+
|                                                               |
| PA1 Customer Value & Urgency                [Assessment]      |
| PA2 Buying Center & Influence               [Assessment]      |
| PA3 Buying Process & Decision Control       [Assessment]      |
| PA4 Solution & Value Proposition            [Assessment]      |
| PA5 Competitive Position                    [Assessment]      |
| PA6 Commercial & Deal Structure             [Assessment]      |
| PA7 Sales Execution & Deal Readiness        [Assessment]      |
| PA8 Deal Momentum, Risk & Closeability      [Assessment]      |
|                                                               |
+---------------------------------------------------------------+
| SELECTED DIMENSION                                            |
|                                                               |
| Assessment Result                                             |
| Supporting Evidence                                           |
| Contradictory Evidence                                        |
| Evidence Gaps                                                 |
| Related SWOT Factors                                          |
| Historical Changes                                            |
| Reasoning and Implications                                    |
+---------------------------------------------------------------+
```

### Interaction

Users should be able to:

- Open a dimension.
- Review its assessment.
- Inspect supporting evidence.
- Inspect contradictory evidence.
- Identify missing information.
- Navigate to linked SWOT factors.
- Compare its current and previous state.

## 8.6 Evidence Interface

### Purpose

Make the evidence foundation transparent and manageable.

### Recommended Layout

```text
+---------------------------------------------------------------+
| EVIDENCE REGISTER                                             |
+---------------------------------------------------------------+
| Search | Relationship | Polarity | Source | Date | Factor     |
+---------------------------------------------------------------+
| Evidence Item | Source | Quality | Relationship | Factors     |
|---------------------------------------------------------------|
| Evidence A    | ...    | ...     | SUPPORTS     | ...         |
| Evidence B    | ...    | ...     | CONTRADICTS  | ...         |
| Evidence C    | ...    | ...     | QUALIFIES    | ...         |
+---------------------------------------------------------------+
|                                                               |
| EVIDENCE DETAIL                                               |
|                                                               |
| Evidence Statement                                            |
| Source / Date / Owner                                         |
| Verification Status                                           |
| Evidence Quality / Confidence                                 |
| Mapping Strength                                              |
| Runtime Relationship                                          |
| Runtime Polarity                                              |
| Linked Factors                                                |
| Linked PADF Dimensions                                        |
| Provenance and History                                        |
+---------------------------------------------------------------+
```

### Design Requirements

The UI must distinguish mapping strength from evidence quality and runtime confidence.

It must also show when evidence is inherited from SQL-QIP rather than newly entered for Pipeline Assessment.

Users should be able to identify:

- Evidence that supports an assessment.
- Evidence that contradicts an assessment.
- Evidence that qualifies an assessment.
- Evidence that contextualizes an assessment.
- Evidence gaps.
- Evidence requiring revalidation.

## 8.7 SWOT Intelligence Interface

### Purpose

Present the opportunity's evidence-supported SWOT intelligence.

### Recommended Layout

```text
+---------------------------------------------------------------+
| SWOT INTELLIGENCE                                             |
+---------------------------------------------------------------+
| Active Factors: 16                                            |
| Universal: 8 | Revenue Motion: 4 | Industry: 4                |
+---------------------------------------------------------------+
|                                                               |
| STRENGTHS                 | WEAKNESSES                         |
|                           |                                   |
| Factor Card               | Factor Card                        |
| Factor Card               | Factor Card                        |
| Factor Card               | Factor Card                        |
|                           |                                   |
+---------------------------------------------------------------+
| OPPORTUNITIES             | THREATS                            |
|                           |                                   |
| Factor Card               | Factor Card                        |
| Factor Card               | Factor Card                        |
| Factor Card               | Factor Card                        |
|                           |                                   |
+---------------------------------------------------------------+
| SELECTED FACTOR                                                |
|                                                               |
| Factor Definition                                             |
| Configuration Layer                                           |
| Evidence Mapping                                              |
| Supporting Evidence                                           |
| Contradictory Evidence                                        |
| Runtime Interpretation                                        |
| PADF Relationships                                            |
| Related Risks                                                 |
| Strategic Implications                                        |
+---------------------------------------------------------------+
```

### Factor Card Requirements

Each factor card should display:

- Factor name.
- SWOT category.
- Configuration layer.
- Assessment status.
- Evidence coverage.
- Key interpretation.
- Relevant evidence links.

The UI must not imply that all 96 configured factors are active for the selected opportunity.

It must show the actual resolved active factor set.

## 8.8 Risk Intelligence Interface

### Purpose

Show formal risks and their implications for opportunity winability.

### Recommended Layout

```text
+---------------------------------------------------------------+
| RISK INTELLIGENCE                                              |
+---------------------------------------------------------------+
| Base Winability          | Risk-Adjusted Winability           |
+---------------------------------------------------------------+
|                                                               |
| FORMAL RISK REGISTER                                          |
|                                                               |
| Risk | Severity | Likelihood | Impact | Status | Owner        |
|---------------------------------------------------------------|
| Risk A | ...    | ...        | ...    | ...    | ...          |
| Risk B | ...    | ...        | ...    | ...    | ...          |
+---------------------------------------------------------------+
| SELECTED RISK                                                  |
|                                                               |
| Risk Description                                              |
| Evidence / Trigger                                            |
| Related SWOT Factors                                          |
| Business Impact                                               |
| Mitigation Action                                             |
| Owner / Status                                                |
| Historical Changes                                            |
+---------------------------------------------------------------+
```

### Design Requirements

The UI should distinguish:

- Formal risks.
- Potential risk signals.
- Evidence gaps.
- Mitigated risks.
- Escalated risks.

A SWOT threat must not automatically appear as a formal risk.

## 8.9 TOWS and Winning Strategy Interface

### Purpose

Translate intelligence into strategic responses and execution actions.

### Recommended Layout

```text
+---------------------------------------------------------------+
| TOWS & WINNING STRATEGY                                        |
+---------------------------------------------------------------+
|                                                               |
| TOWS MATRIX                                                   |
|                                                               |
| SO STRATEGIES             | WO STRATEGIES                      |
| Strength + Opportunity   | Weakness + Opportunity             |
|                           |                                   |
+---------------------------------------------------------------+
| ST STRATEGIES             | WT STRATEGIES                      |
| Strength + Threat        | Weakness + Threat                  |
|                           |                                   |
+---------------------------------------------------------------+
|                                                               |
| WINNING STRATEGY                                              |
|                                                               |
| Strategic Objective                                           |
| Strategic Rationale                                           |
| Priority Actions                                              |
| Supporting Evidence                                           |
| Related Risks                                                 |
| Dependencies                                                  |
| Success Indicators                                            |
| Execution Status                                              |
+---------------------------------------------------------------+
```

### Design Requirements

- TOWS strategies must show their factor relationships.
- Supporting evidence must be accessible.
- Strategic rationale must be understandable.
- Existing Winning Strategy outputs must remain identifiable.
- TOWS recommendations must not be presented as automatically approved execution actions.
- Action progress must be tracked separately from strategy generation.

## 8.10 History and Changes Interface

### Purpose

Show how the opportunity assessment evolves over time.

### Recommended Layout

```text
+---------------------------------------------------------------+
| ASSESSMENT HISTORY                                            |
+---------------------------------------------------------------+
|                                                               |
| TIMELINE                                                      |
|                                                               |
| Assessment V1                                                 |
|   Initial opportunity assessment                              |
|                                                               |
| Assessment V2                                                 |
|   New evidence added                                          |
|   PADF changes                                                |
|   Winability changes                                          |
|                                                               |
| Assessment V3                                                 |
|   New risk identified                                         |
|   Risk-adjusted winability changed                            |
|   Winning Strategy updated                                    |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
| COMPARE ASSESSMENTS                                           |
|                                                               |
| Evidence Changes                                              |
| PADF Changes                                                  |
| SWOT Changes                                                  |
| Risk Changes                                                  |
| Winability Changes                                            |
| Strategy Changes                                              |
| Configuration / Rules Version Changes                         |
+---------------------------------------------------------------+
```

### Design Requirements

The history view must distinguish:

- Business evidence changes.
- Assessment changes.
- Risk changes.
- Strategy changes.
- Configuration changes.
- Rules version changes.

The UI must never imply that an assessment changed because the business changed when the underlying cause was actually a methodology or configuration change.

---

# 9. Workflow States and Exception Handling

The workflow must explicitly support incomplete, invalid, and exceptional conditions.

## 9.1 Assessment States

Recommended assessment lifecycle states:

| State | Meaning |
|---|---|
| NOT_STARTED | Assessment has not been initiated |
| INITIALIZING | Required context and inherited information are being retrieved |
| INPUT_REQUIRED | Required information is missing |
| IN_PROGRESS | Assessment processing is underway |
| PROCESSING | Deterministic or reasoning execution is active |
| COMPLETED | Required assessment outputs have been successfully generated and validated |
| PARTIALLY_COMPLETED | Some outputs are available, but required components remain incomplete |
| REASSESSMENT_REQUIRED | Relevant information has changed and reassessment is needed |
| FAILED | Assessment execution failed |
| CLOSED | Opportunity lifecycle has reached its final state |

These labels are recommended product-level states. Their exact persisted values and transition rules must follow the technical implementation contract and authoritative Rules asset.

## 9.2 Exception Scenarios

### Scenario A — Missing SQL-QIP

**Condition:** Mandatory inherited qualification data cannot be retrieved.

**Expected behavior:**

- Stop the substantive assessment workflow.
- Show the missing dependency.
- Identify the required upstream record.
- Do not generate a misleading completed assessment.

### Scenario B — Missing Opportunity Evidence

**Condition:** Evidence is insufficient for a particular dimension or factor.

**Expected behavior:**

- Identify the evidence gap.
- Preserve the unknown state.
- Request additional evidence where appropriate.
- Do not infer a negative assessment simply because evidence is missing.

### Scenario C — Contradictory Evidence

**Condition:** Evidence supports and contradicts the same factor or assessment.

**Expected behavior:**

- Preserve both evidence items.
- Display the contradiction.
- Explain its significance.
- Avoid silently selecting one interpretation.

### Scenario D — No Approved Evidence Mapping

**Condition:** A configured factor has no approved mapping in the current Evidence Knowledge Base.

**Expected behavior:**

- Identify the factor.
- Show that no approved evidence mapping is available.
- Preserve the factor and its configuration provenance.
- Do not create an unsupported mapping.
- Where appropriate, make the gap visible to an authorized administrator.

### Scenario E — Configuration Resolution Failure

**Condition:** Industry or revenue-motion context cannot be resolved.

**Expected behavior:**

- Report the missing or invalid identifier.
- Do not guess a replacement.
- Do not silently fall back to an unrelated industry configuration.
- Require correction or an explicitly approved fallback mechanism.

### Scenario F — Deterministic Rules Execution Failure

**Condition:** A required Rules component fails.

**Expected behavior:**

- Record the failed execution stage.
- Preserve diagnostic information.
- Do not generate a false completed assessment.
- Avoid using Gemini to replace the missing deterministic result.

### Scenario G — Gemini Failure

**Condition:** Gemini reasoning fails or times out.

**Expected behavior:**

- Preserve valid deterministic results.
- Display available assessment data.
- Mark narrative reasoning as unavailable or incomplete.
- Allow the user to retry the reasoning step.
- Do not discard successful deterministic outputs.

### Scenario H — Partial Completion

**Condition:** Some assessment components succeed while others fail.

**Expected behavior:**

- Display completed components.
- Clearly identify incomplete components.
- Prevent incomplete outputs from being represented as a fully completed assessment.
- Preserve execution status and diagnostics.

### Scenario I — Stale Inherited Information

**Condition:** Previously inherited information may no longer reflect the current opportunity situation.

**Expected behavior:**

- Identify the inherited information.
- Show its source and timestamp.
- Flag it for revalidation where appropriate.
- Preserve the original historical record.

### Scenario J — Rules or Configuration Version Change

**Condition:** The governing Rules or configuration asset changes.

**Expected behavior:**

- Preserve the version used in each historical assessment.
- Identify whether reassessment is required.
- Do not silently reinterpret historical outputs under the latest configuration.

---

# 10. Reassessment and Dependency Management

## 10.1 Reassessment Principle

A change in one part of the opportunity may affect multiple downstream assessment components.

The system should identify impacted components and execute the appropriate reassessment workflow.

## 10.2 Dependency Relationships

| Change Event | Potentially Impacted Components |
|---|---|
| New evidence added | Evidence evaluation, PADF, SWOT, winability, risk, TOWS, strategy |
| Evidence updated | Evidence evaluation and all dependent assessments |
| Industry changed | Context resolution, active factors, evidence mapping, PADF/SWOT, downstream outputs |
| Revenue motion changed | Context resolution, active factors, evidence mapping, downstream outputs |
| Stakeholder information changed | Relevant PADF dimensions, SWOT factors, risk, winability, strategy |
| Buying process changed | Relevant PADF dimensions, risk, winability, strategy |
| Competitive position changed | PADF, SWOT, risk, TOWS, strategy |
| New risk identified | Risk Intelligence, risk-adjusted winability, strategy |
| Risk mitigated | Risk Intelligence, risk-adjusted winability, strategy |
| Strategy action completed | Strategy execution status and relevant monitoring outputs |
| Rules version changed | Applicable deterministic reassessment |
| Configuration version changed | Applicable context and factor reassessment |

This table identifies potential dependencies. The actual execution scope must be controlled by approved Rules and technical dependency definitions.

## 10.3 Incremental vs Full Reassessment

The architecture should support reassessing impacted components rather than unnecessarily rerunning every component.

However, incremental reassessment must only be implemented where dependency integrity can be guaranteed.

If the impact of a change cannot be reliably isolated, the system should execute the appropriate broader reassessment.

The system must preserve:

- Previous assessment snapshot.
- Triggering change.
- Impacted components.
- Rules and configuration versions.
- Execution status.
- New output.
- Difference from the previous assessment.

---

# 11. Assessment Output and Persistence

## 11.1 Assessment Snapshot

Each successfully completed assessment must create a traceable snapshot.

The snapshot should preserve:

- Opportunity identity.
- Assessment identifier.
- Assessment timestamp.
- Assessment lifecycle state.
- SQL-QIP reference and version.
- Inherited context.
- Evidence references and versions.
- Industry configuration version.
- Evidence Knowledge Base version.
- Rules version.
- PADF version.
- PADIF version.
- Active SWOT factors.
- PADF outputs.
- SWOT outputs.
- Base winability.
- Formal risk outputs.
- Risk-adjusted winability.
- TOWS outputs.
- Winning Strategy outputs.
- Gemini reasoning output and prompt version.
- Validation status.
- Execution provenance.

The exact persisted structure must follow the Technical Design Specification.

## 11.2 Historical Integrity

Historical snapshots must be immutable from the perspective of normal assessment operations.

A new assessment creates a new version.

It must not silently overwrite the previous assessment.

Corrections or administrative changes must follow an explicit, auditable process.

## 11.3 Version Traceability

Each assessment must be traceable to the versions of the assets and methodologies used to produce it.

This is necessary to distinguish:

- A change in the opportunity.
- A change in evidence.
- A change in assessment logic.
- A change in industry configuration.
- A change in the reasoning prompt.

---

# 12. System Responsibility and Interface Boundaries

The following table defines the high-level responsibilities of the major system components.

| System Component | Main Responsibility | Output |
|---|---|---|
| Frontend UI | User interaction and presentation | User inputs and assessment views |
| Opportunity Data Layer | Opportunity record retrieval | Opportunity context |
| SQL-QIP Integration | Retrieve qualification output | Inherited qualification context |
| Inheritance Processor | Apply PADIF | Structured inherited data |
| Context Resolver | Resolve industry and revenue motion | Active configuration |
| Evidence Processor | Register and validate evidence | Evidence instances |
| Evidence Mapping Processor | Resolve approved evidence mappings | Evidence-factor relationships |
| PADF Engine | Assess eight dimensions | PADF outputs |
| SWOT Engine | Assess active factors | SWOT outputs |
| Rules Orchestrator | Control deterministic execution | Validated assessment results |
| Winability Engine | Calculate base winability | Base winability |
| Risk Intelligence Engine | Evaluate formal risks | Risk outputs |
| Risk Adjustment Engine | Apply approved risk adjustment | Risk-adjusted winability |
| TOWS Engine | Generate strategic candidates | TOWS outputs |
| Winning Strategy Engine | Generate strategic recommendations | Winning Strategy |
| Gemini Service | Interpret and explain results | Narrative reasoning |
| Validation Service | Validate output integrity | Validation result |
| Snapshot Service | Persist assessment history | Versioned snapshot |
| History Service | Retrieve and compare assessments | Historical comparison |

The frontend must not independently calculate deterministic assessment results.

The Gemini service must not replace deterministic Rules execution.

The Rules orchestrator must remain the authority for execution sequence and rule-governed outputs.

---

# 13. Workflow Implementation Sequence

The following implementation sequence is recommended for building and integrating the module.

## Phase 1 — Opportunity and Inheritance Foundation

Implement:

1. Opportunity retrieval.
2. SQL-QIP retrieval.
3. PADIF inheritance.
4. Inherited data provenance.
5. Opportunity context initialization.
6. First assessment and reassessment identification.

**Expected result:** The system can initialize a valid Pipeline Assessment context.

## Phase 2 — Configuration and Evidence Foundation

Implement:

1. Industry configuration loading.
2. Revenue-motion resolution.
3. Industry resolution.
4. Active factor resolution.
5. Evidence Knowledge Base loading.
6. Evidence registration and validation.
7. Explicit ID and alias compatibility.
8. Evidence-to-factor mapping.
9. Runtime relationship and polarity handling.

**Expected result:** The system can build a context-aware and evidence-grounded assessment input.

## Phase 3 — PADF and SWOT Intelligence

Implement:

1. Eight-dimension PADF assessment.
2. Evidence-supported dimension outputs.
3. SWOT active factor evaluation.
4. Evidence-to-factor traceability.
5. PADF-SWOT contextual relationships.
6. Evidence gap identification.
7. Assessment provenance.

**Expected result:** The system can produce the structured opportunity assessment and SWOT intelligence.

## Phase 4 — Winability and Risk Intelligence

Implement:

1. Existing base winability engine integration.
2. Formal risk evaluation.
3. Risk trigger processing.
4. Risk-adjustment rules.
5. Risk-adjusted winability.
6. Base and adjusted result separation.

**Expected result:** The system can produce authoritative winability and risk outputs.

## Phase 5 — TOWS and Winning Strategy

Implement:

1. Evidence-supported factor combination evaluation.
2. TOWS strategic candidates.
3. TOWS-to-Winning Strategy integration.
4. Existing Winning Strategy engine execution.
5. Strategy rationale and provenance.
6. Action output and execution status.

**Expected result:** The system can translate assessment intelligence into actionable opportunity strategy.

## Phase 6 — Gemini Reasoning Integration

Implement:

1. Gemini request construction.
2. Authoritative output packaging.
3. System prompt integration.
4. Structured reasoning response.
5. Output validation.
6. Narrative presentation.
7. Error handling and retry.

**Expected result:** The system can generate understandable business reasoning based on validated deterministic results.

## Phase 7 — Assessment Persistence and History

Implement:

1. Assessment snapshot creation.
2. Version tracking.
3. Evidence history.
4. Assessment history.
5. Winability history.
6. Risk history.
7. Strategy history.
8. Assessment comparison.
9. Closed Won/Lost outcome capture.

**Expected result:** The module supports longitudinal pipeline intelligence.

## Phase 8 — UI Integration and End-to-End Testing

Implement:

1. Pipeline Overview.
2. Opportunity Workspace.
3. Executive Summary.
4. PADF interface.
5. Evidence interface.
6. SWOT interface.
7. Risk interface.
8. TOWS and Winning Strategy interface.
9. History interface.
10. Responsive layouts.
11. Loading, empty, error, and partial-completion states.

**Expected result:** Users can operate the complete Pipeline Assessment workflow through the RevOS interface.

---

# 14. Testing and Validation Requirements

Testing must validate both individual components and the complete end-to-end workflow.

## 14.1 Inheritance Tests

Verify:

- SQL-QIP is mandatory.
- Inherited data is preserved.
- Inherited provenance is maintained.
- Inherit, Extend, and Revalidate operations work correctly.
- Pipeline Assessment calculates its own outputs.
- Historical qualification information remains traceable.

## 14.2 Context Resolution Tests

Verify:

- Universal configuration is loaded.
- Revenue-motion overrides are applied.
- Industry overrides are applied.
- More-specific configuration takes precedence.
- Canonical IDs are resolved correctly.
- Alias mappings are explicit.
- Active factor count is correct for a valid resolved context.
- Invalid identifiers are handled safely.

## 14.3 Evidence Tests

Verify:

- Evidence objects are resolved correctly.
- Evidence instances are distinguishable from reusable evidence objects.
- Evidence mapping fields are normalized through the approved contract.
- DIRECT, SUPPORTING, and INDIRECT mappings remain distinct.
- All six runtime relationships are handled.
- All five polarity values are handled.
- Evidence quality and confidence are separate.
- Missing evidence remains unknown.
- Contradictory evidence remains visible.
- Unmapped factors do not receive fabricated mappings.

## 14.4 PADF and SWOT Tests

Verify:

- All eight PADF dimensions are present.
- No additional PADF dimensions are introduced.
- PADF results are deterministic.
- SWOT factors are resolved correctly.
- The correct active factor set is used.
- SWOT evidence relationships are traceable.
- SWOT does not replace PADF.
- SWOT does not independently replace winability.

## 14.5 Winability and Risk Tests

Verify:

- Base winability is produced by the existing methodology.
- Formal risk evaluation uses authoritative rules.
- SWOT signals are not automatically promoted to formal risks.
- Risk-adjusted winability is calculated through the approved adjustment rules.
- Base and risk-adjusted results remain separate.
- Gemini cannot override either result.

## 14.6 TOWS and Strategy Tests

Verify:

- TOWS uses evidence-supported factor relationships.
- SO, WO, ST, and WT categories are preserved.
- Unsupported factor combinations are not invented.
- Unresolved crosswalks are not guessed.
- Existing Winning Strategy logic remains authoritative.
- Strategy actions remain traceable to their rationale.

## 14.7 Gemini Tests

Verify:

- Gemini receives the required structured outputs.
- Gemini does not invent facts.
- Gemini distinguishes facts, inferences, assumptions, and unknowns.
- Gemini does not calculate winability.
- Gemini does not invent risk IDs or strategy IDs.
- Gemini does not convert incompatible confidence scales.
- Gemini output follows the approved response structure.
- Gemini failure does not invalidate successful deterministic results.

## 14.8 Historical and Reassessment Tests

Verify:

- Every completed assessment creates a snapshot.
- Previous snapshots are preserved.
- Reassessment identifies impacted components.
- Business changes and methodology changes are distinguishable.
- Historical comparisons use the correct asset versions.
- Final opportunity outcomes are retained.

---

# 15. End-to-End Acceptance Criteria

The Pipeline Assessment module is considered functionally complete when the following conditions are satisfied.

## 15.1 Business Workflow

- [ ] Users can initiate an assessment for an opportunity.
- [ ] Mandatory SQL-QIP inheritance is enforced.
- [ ] Opportunity context is resolved correctly.
- [ ] Users can review and supplement opportunity evidence through supported workflows.
- [ ] Users can access the complete assessment.
- [ ] Users can review formal risks and strategic actions.
- [ ] Users can initiate reassessment.
- [ ] Assessment history is available.

## 15.2 Intelligence Workflow

- [ ] PADF evaluates exactly eight dimensions.
- [ ] SWOT evaluates the resolved active factor set.
- [ ] Evidence relationships are traceable.
- [ ] Evidence gaps are visible.
- [ ] Base winability is generated by the existing engine.
- [ ] Formal risks are evaluated by the Risk Intelligence engine.
- [ ] Risk-adjusted winability is generated through approved rules.
- [ ] TOWS generates evidence-supported strategic candidates.
- [ ] Winning Strategy consumes the appropriate intelligence outputs.
- [ ] Gemini explains the validated results without replacing them.

## 15.3 Technical Integrity

- [ ] Rules v1.1 orchestration is respected.
- [ ] Industry Configuration v1.1 is respected.
- [ ] Evidence Knowledge Base v1.1 is respected.
- [ ] PADF and PADIF remain authoritative.
- [ ] Identifier compatibility is explicit.
- [ ] Data provenance is preserved.
- [ ] Assessment snapshots are versioned.
- [ ] Historical outputs are retained.
- [ ] Partial failures are handled safely.
- [ ] No unsupported calculations or mappings are introduced.

## 15.4 User Experience

- [ ] Pipeline Overview provides a clear portfolio view.
- [ ] Opportunity Workspace presents a coherent assessment.
- [ ] PADF dimensions are understandable.
- [ ] Evidence traceability is accessible.
- [ ] SWOT intelligence is clearly presented.
- [ ] Formal risks are distinguishable from potential risk signals.
- [ ] TOWS and Winning Strategy are connected.
- [ ] History and changes are understandable.
- [ ] Loading, empty, partial, and error states are handled.
- [ ] Desktop, tablet, and mobile experiences are usable.

---

# 16. Non-Negotiable Architecture and Methodology Constraints

The following constraints must be preserved throughout implementation.

### 16.1 PADF

- PADF remains an eight-dimension framework.
- SWOT does not create additional PADF dimensions.
- SWOT complements PADF rather than replacing it.

### 16.2 Evidence

- Evidence must be opportunity-specific and traceable.
- Missing evidence is unknown, not negative.
- Mapping relevance is not evidence quality or confidence.
- Configured factors are not proof.
- Contradictory evidence must remain visible.
- No unsupported mappings may be created.

### 16.3 Configuration

- Configuration inheritance follows Universal → Revenue Motion → Industry.
- More-specific overrides take precedence.
- Canonical IDs and explicit alias registries must be used.
- The active factor set must be resolved from the authoritative configuration.

### 16.4 Winability

- Existing winability methodology remains authoritative.
- Base winability and risk-adjusted winability must remain distinct.
- Gemini must not calculate or override winability.

### 16.5 Risk

- Formal risk assessment remains the responsibility of Risk Intelligence.
- SWOT threats and weaknesses are not automatically formal risks.
- Risk-adjustment logic must follow the approved Rules.

### 16.6 Strategy

- TOWS enriches the existing Winning Strategy engine.
- TOWS does not replace Winning Strategy.
- Unsupported crosswalks and strategic mappings must not be invented.

### 16.7 Gemini

- Gemini interprets and explains authoritative outputs.
- Gemini does not replace deterministic execution.
- Facts, interpretations, assumptions, and unknowns must remain distinguishable.
- Unsupported numerical claims must not be generated.

### 16.8 Historical Integrity

- Each completed assessment must be traceable.
- Historical snapshots must be preserved.
- Business changes must be distinguishable from configuration and methodology changes.

---

# 17. Final Master Workflow Summary

The complete Pipeline Assessment business workflow can be summarized as follows:

```text
1. OPPORTUNITY INITIATION
          |
          v
2. SQL-QIP INHERITANCE
          |
          v
3. CONTEXT CONFIRMATION
          |
          v
4. EVIDENCE COLLECTION
   AND VALIDATION
          |
          v
5. PADF ASSESSMENT
   + SWOT INTELLIGENCE
          |
          v
6. BASE WINABILITY
          |
          v
7. RISK INTELLIGENCE
   + RISK-ADJUSTED WINABILITY
          |
          v
8. TOWS STRATEGIC ANALYSIS
          |
          v
9. WINNING STRATEGY
   + EXECUTION ACTIONS
          |
          v
10. CONTINUOUS MONITORING
    REASSESSMENT
    OUTCOME CLOSURE
```

Throughout this lifecycle, the deterministic Rules engine governs the execution of assessment logic, while Gemini provides evidence-grounded interpretation and explanation.

The final product experience connects these processes into one continuous opportunity intelligence workspace.

**The ultimate purpose of Pipeline Assessment is not simply to score an opportunity. It is to establish why the opportunity is or is not winnable, identify what is changing its winability, and guide the sales team toward the actions most likely to improve the commercial outcome.**

---

**End of Document**

**Document:** `Pipeline_Assessment_module_master_workflow.md`  
**Version:** 1.1  
**Status:** Draft for implementation alignment