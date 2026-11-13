# Pipeline Product Design Specification v1.1

## Document Control

| Field | Value |
|---|---|
| Product | RevOS — Revenue Operating System |
| Module | Pipeline Assessment |
| Document | Pipeline Product Design Specification |
| Version | 1.1 |
| Status | Draft for Owner Review |
| Supersedes | Pipeline Product Design Specification v1.0 |
| Reasoning Methodology | Pipeline Reasoning Strategy Specification v1.1 |
| AI Reasoning | Gemini Pipeline Reasoning System Prompt v1.1 |
| Industry Configuration | Pipeline Industry Configuration v1.1 |
| Evidence Asset | Pipeline Evidence Knowledge Base v1.1 |
| Execution Asset | Pipeline Assessment Rules v1.1 |
| Related Frameworks | PADF v1.0; PADIF v1.0; SWOT Intelligence Master Schema v1.0 |

---

# Document Purpose

This specification defines the product experience, user journey, information architecture, interaction model, workspace design, visualization framework, and interface requirements for the RevOS Pipeline Assessment module.

It translates the Pipeline Assessment intelligence architecture into a practical user experience.

The specification describes how users interact with Pipeline Assessment intelligence from the moment a qualified opportunity enters the pipeline until Closed Won or Closed Lost.

It covers:

- Pipeline Intelligence Dashboard.
- Pipeline Assessment Workspace.
- PADF Dimension Intelligence.
- Evidence Intelligence Center.
- SWOT Intelligence Workspace.
- TOWS Strategic Intelligence.
- Risk and Winning Strategy Workspace.
- Pipeline Evolution Timeline.
- Governance and Learning Center.
- AI interaction experience.
- Mobile experience.
- Notifications and alerts.
- Closed Won / Closed Lost experience.

The product should enable users to:

- Understand pipeline health.
- Understand current winability.
- Identify the factors influencing winning.
- Understand the evidence behind assessment conclusions.
- Identify strengths, weaknesses, opportunities, and threats.
- Discover strategic responses through TOWS.
- Identify risks and evidence gaps.
- Execute winning strategies.
- Track pipeline evolution.
- Make better sales and executive decisions.

This document defines the intended product experience and interface behavior. The exact data structures, calculations, identifiers, status values, and machine-readable output contracts remain governed by the authoritative JSON assets and Rules Engine.

---

# 1. Product Vision

## 1.1 Product Mission

Traditional CRM systems primarily answer:

"What opportunities exist?"

Pipeline Assessment answers:

"How likely are we to win, why, what could prevent us from winning, and what should we do next?"

The Pipeline Assessment workspace transforms pipeline management from:

Pipeline Visibility

↓

Pipeline Understanding

↓

Pipeline Intelligence

↓

Pipeline Optimization

↓

Pipeline Winability Management

The objective is to move beyond passive opportunity tracking and enable continuous, evidence-driven management of opportunity outcomes.

## 1.2 Product Positioning

Pipeline Assessment is an:

**AI-native Pipeline Intelligence Operating System**

It combines:

- Revenue intelligence.
- Evidence-based assessment.
- Contextual SWOT intelligence.
- AI reasoning.
- Deterministic assessment.
- Risk management.
- Strategic recommendation.
- Execution management.
- Historical learning.

It is not another CRM interface.

It is the intelligence and decision-support layer that helps sales professionals and revenue leaders understand and improve the probability and quality of winning.

## 1.3 Core User Experience Principle

The entire product should be organized around five questions:

1. Where do we stand?
2. Why do we stand there?
3. What evidence supports or contradicts the assessment?
4. What prevents us from winning?
5. What should we do next?

Every major workspace should help users answer one or more of these questions.

## 1.4 Product Experience Principles

### Principle 1 — Intelligence First

Present the most important assessment findings before exposing detailed analytical information.

Users should understand the opportunity's current condition within seconds.

### Principle 2 — Evidence Before Conclusions

Every material assessment conclusion must allow users to inspect the supporting evidence.

Users should be able to navigate from a conclusion to its evidence source.

### Principle 3 — Explainable Intelligence

Do not present scores, risk levels, or AI recommendations as unexplained outputs.

Show why the result exists and what it means for the opportunity.

### Principle 4 — Action Orientation

Every material weakness, threat, or risk should lead users toward a relevant response or evidence-validation action.

### Principle 5 — Progressive Disclosure

Show essential information first.

Provide access to detailed evidence, reasoning, factor definitions, and governance information when users need it.

Avoid overwhelming users with the entire analytical framework at once.

### Principle 6 — Continuous Intelligence

The interface should make it easy to understand what has changed since the previous assessment.

### Principle 7 — Human Control and Transparency

Users must be able to add evidence, correct information, review recommendations, and record justified overrides without silently changing deterministic results.

---

# 2. Target Users and User Objectives

Pipeline Assessment serves four primary user groups.

## 2.1 Sales Representative

### User Goal

Win the opportunity.

### Main Questions

- What should I do next?
- Why is this opportunity weak?
- Which customer engagement should I prioritize?
- What evidence is missing?
- Which competitor is threatening the deal?
- What can I do to improve the opportunity?

### Primary Workspace

Pipeline Assessment Workspace.

### Important Interface Features

- Opportunity assessment summary.
- Winability and pipeline health.
- PADF dimension assessment.
- SWOT findings.
- Evidence gaps.
- Risk alerts.
- Winning strategy.
- Prioritized action list.
- AI Pipeline Intelligence Advisor.

## 2.2 Sales Manager

### User Goal

Improve team pipeline performance.

### Main Questions

- Which opportunities are at risk?
- Which deals are deteriorating?
- Where should I intervene?
- Which opportunities require coaching?
- Are sales strategies being executed?
- Which deals have insufficient evidence?

### Primary Workspace

Pipeline Management Cockpit.

### Important Interface Features

- Team pipeline dashboard.
- Winability distribution.
- Pipeline health distribution.
- Risk concentration.
- Momentum analysis.
- SWOT pattern analysis.
- Critical action tracking.
- Opportunity comparison.

## 2.3 Sales Executive / VP Sales

### User Goal

Optimize revenue predictability, strategic allocation, and pipeline performance.

### Main Questions

- Can we achieve revenue targets?
- Which opportunities require executive intervention?
- Where are systemic weaknesses?
- Which opportunities deserve additional resources?
- What are the major threats to revenue delivery?
- Which strategic actions can improve revenue outcomes?

### Primary Workspace

Executive Pipeline Intelligence Dashboard.

### Important Interface Features

- Portfolio-level pipeline intelligence.
- Winability distribution.
- Risk concentration.
- Strategic opportunity ranking.
- Revenue exposure.
- Pipeline momentum.
- Executive intervention recommendations.
- Resource allocation insights.

## 2.4 Revenue Operations Leader

### User Goal

Improve revenue process effectiveness and intelligence governance.

### Main Questions

- Are qualification and assessment processes effective?
- Which evidence patterns are associated with successful outcomes?
- Are assessment results sufficiently supported?
- Which configurations or mappings need review?
- Are AI recommendations useful?
- Are users following the assessment process?

### Primary Workspace

Revenue Intelligence Governance Center.

### Important Interface Features

- Assessment audit.
- Evidence coverage.
- Evidence-gap analysis.
- Configuration version visibility.
- Assessment quality.
- Rule execution status.
- AI reasoning traceability.
- Human overrides.
- Outcome learning.

---

# 3. Product Information Architecture

The Pipeline Assessment product consists of six primary experience areas.

The v1.1 design expands the original architecture while preserving its six major workspaces.

## 3.1 Overall Information Architecture

```text
Pipeline Assessment Platform
│
├── 1. Pipeline Intelligence Dashboard
│
├── 2. Pipeline Assessment Workspace
│     │
│     ├── Assessment Overview
│     ├── PADF Dimension Intelligence
│     ├── SWOT Intelligence
│     ├── TOWS Strategic Intelligence
│     └── Assessment Explanation
│
├── 3. Evidence Intelligence Center
│     │
│     ├── Evidence Library
│     ├── Evidence Explorer
│     ├── Evidence-to-Factor Mapping
│     ├── Evidence Gap Management
│     └── Evidence Timeline
│
├── 4. Risk & Winning Strategy Workspace
│     │
│     ├── Risk Intelligence
│     ├── TOWS Strategy Canvas
│     ├── Winning Strategy
│     └── Action Management
│
├── 5. Pipeline Evolution Timeline
│     │
│     ├── Assessment History
│     ├── Winability Evolution
│     ├── SWOT Evolution
│     ├── Risk Evolution
│     └── Strategy Effectiveness
│
└── 6. Governance & Learning Center
      │
      ├── Assessment Audit
      ├── Evidence Governance
      ├── Human Review and Override
      ├── Configuration and Version Trace
      └── Closed Won / Closed Lost Learning
```

## 3.2 Global Navigation

The main navigation should provide access to the six experience areas.

Recommended navigation:

```text
Pipeline Assessment
│
├── Pipeline Dashboard
│
├── Opportunities
│
├── Evidence Intelligence
│
├── Strategy & Actions
│
├── Evolution
│
└── Governance
```

### Navigation Behavior

**Pipeline Dashboard**

Opens the portfolio-level intelligence dashboard.

**Opportunities**

Opens the opportunity list and Pipeline Assessment workspace.

**Evidence Intelligence**

Opens the evidence management and exploration workspace.

**Strategy & Actions**

Opens the consolidated risk, TOWS, winning strategy, and action workspace.

**Evolution**

Opens historical assessment and pipeline evolution.

**Governance**

Opens audit, version, override, and learning capabilities.

The navigation should remain consistent across the module.

Users should not need to return to the dashboard to move between related analytical views.

## 3.3 Opportunity-Level Navigation

When a user opens an individual opportunity, provide a secondary navigation bar.

Recommended structure:

```text
Opportunity Name
│
├── Overview
├── Dimensions
├── SWOT
├── Evidence
├── Risks
├── Strategy & Actions
└── History
```

This creates a consistent navigation experience around an individual opportunity.

The user can move from the overall assessment to detailed analysis without losing the selected opportunity context.

---

# 4. Overall User Journey

The main user journey is:

```text
Qualified Opportunity Entry
        ↓
Pipeline Initialization
        ↓
AI Initial Assessment
        ↓
Pipeline Intelligence Review
        ↓
Evidence Validation and Enhancement
        ↓
PADF and SWOT Assessment Review
        ↓
Risk Discovery
        ↓
TOWS Strategic Analysis
        ↓
Winning Strategy Development
        ↓
Action Approval and Execution
        ↓
Continuous Reassessment
        ↓
Closed Won / Closed Lost
        ↓
Outcome Learning
```

## 4.1 Initial Assessment Experience

When a qualified opportunity enters Pipeline Assessment:

1. Create the Pipeline Assessment workspace.
2. Display inherited Opportunity Qualification information.
3. Resolve the applicable industry and revenue-motion context.
4. Load the active intelligence configuration.
5. Execute the initial assessment.
6. Generate evidence, PADF, SWOT, winability, and risk intelligence according to the Rules execution dependencies.
7. Present the assessment summary.
8. Highlight missing evidence and unresolved dependencies.
9. Guide the user toward the most important next actions.

The initial assessment should not require users to manually recreate information already inherited from Opportunity Qualification.

## 4.2 Continuous Assessment Experience

During the opportunity lifecycle:

- Users add or update evidence.
- The system identifies material evidence changes.
- Assessment is refreshed through the governed execution process.
- Users review changes in PADF and SWOT.
- Risk and strategy outputs are updated according to their authoritative engines.
- Actions are monitored.
- Historical assessment records are retained.

Users should always be able to distinguish the current assessment from previous assessments.

---

# 5. Workspace 1 — Pipeline Intelligence Dashboard

## 5.1 Purpose

Provide a portfolio-level view of pipeline health, winability, risk, and strategic priorities.

Primary users:

- Sales executives.
- Sales managers.
- Revenue operations leaders.

The dashboard should answer:

- How healthy is the current pipeline?
- How much pipeline is realistically winnable?
- Which opportunities are improving or deteriorating?
- Where are the major risks concentrated?
- Which opportunities require management intervention?
- What should the organization prioritize?

## 5.2 Dashboard Layout

Recommended desktop layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ Pipeline Intelligence Dashboard                             │
│                                                             │
│ Period [Current Quarter ▼]   Team [All ▼]   Owner [All ▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Total Pipeline     Active Deals     Winability     At Risk  │
│  €XX.XM             XXX              XX%            XX       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PIPELINE HEALTH             WINABILITY DISTRIBUTION        │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │                      │    │                          │   │
│  │  Health Distribution │    │  High / Medium / Low      │   │
│  │                      │    │  Winability               │   │
│  │                      │    │                          │   │
│  └──────────────────────┘    └──────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PIPELINE MOMENTUM           RISK CONCENTRATION             │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │ Improving            │    │ Critical Risks           │   │
│  │ Stable               │    │ Emerging Risks           │   │
│  │ Declining            │    │ Top Risk Categories      │   │
│  └──────────────────────┘    └──────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AI EXECUTIVE INTELLIGENCE                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Key portfolio observations                             │  │
│  │ Major revenue threats                                  │  │
│  │ Strategic intervention recommendations                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OPPORTUNITIES REQUIRING ATTENTION                           │
│  Opportunity | Value | Winability | Risk | Momentum | Action │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 5.3 Dashboard Components

### A. Pipeline Overview Cards

Display:

- Total pipeline value.
- Number of active opportunities.
- Base winability, where an aggregate is defined by the portfolio calculation contract.
- Number of opportunities requiring attention.
- Number of critical risks.

All numerical values must come from validated system outputs.

Do not calculate portfolio metrics independently in the frontend.

### B. Pipeline Health Distribution

Display the distribution of opportunities by their authoritative pipeline health classification.

Users should be able to click a health category to see the corresponding opportunities.

### C. Winability Distribution

Display the distribution of opportunities across the configured winability categories.

The visualization should distinguish:

- High winability.
- Medium winability.
- Low winability.

The exact classification thresholds must come from the authoritative Rules configuration.

### D. Pipeline Momentum

Display:

- Improving opportunities.
- Stable opportunities.
- Declining opportunities.

Momentum must be based on comparable historical assessment information.

Where historical comparison is unavailable, display an appropriate empty or baseline state.

### E. Risk Concentration

Display:

- Critical risks.
- Emerging risks.
- Risk categories.
- Opportunities affected by major risks.

Users should be able to navigate directly to the relevant risk records.

### F. AI Executive Intelligence

Gemini generates concise portfolio-level explanations.

Example:

"Pipeline quality is deteriorating primarily because several strategic opportunities have unresolved executive sponsorship and commercial approval dependencies."

The insight should include:

- Observation.
- Supporting portfolio evidence.
- Business implication.
- Recommended management intervention.

Portfolio-level AI insights must not be presented as deterministic calculations.

### G. Opportunities Requiring Attention

Recommended table:

| Opportunity | Value | Winability | Risk | Momentum | Required Attention |
|---|---:|---:|---|---|---|
| Opportunity A | €X | System result | High | Declining | Executive engagement |
| Opportunity B | €X | System result | Medium | Stable | Budget validation |
| Opportunity C | €X | System result | High | Improving | Competitive strategy |

The table should support:

- Sorting.
- Filtering.
- Search.
- Opportunity navigation.
- Risk filtering.
- Owner filtering.
- Stage filtering.

---

# 6. Workspace 2 — Pipeline Assessment Workspace

## 6.1 Purpose

The Pipeline Assessment Workspace is the core user experience.

It provides a consolidated view of an individual opportunity's health, winability, evidence, SWOT, risks, strategy, and actions.

The user should be able to understand the opportunity without navigating through multiple disconnected reports.

## 6.2 Workspace Layout

Recommended desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Opportunity Name                              [Reassess]     │
│ Customer | Industry | Revenue Motion | Stage | Owner          │
│ Deal Value | Expected Close Date | Last Assessment            │
├──────────────────────────────────────────────────────────────┤
│ Overview | Dimensions | SWOT | Evidence | Risks | Strategy   │
│ History | Governance                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CURRENT PIPELINE ASSESSMENT                                 │
│                                                              │
│  Winability          Pipeline Health       Confidence        │
│  [Result]            [Result]               [Result]          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  AI ASSESSMENT SUMMARY                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Current opportunity position                           │  │
│  │ Primary winability drivers                             │  │
│  │ Critical constraints                                   │  │
│  │ Most important strategic implication                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  PADF DIMENSION HEALTH          SWOT INTELLIGENCE             │
│  ┌─────────────────────────┐    ┌──────────────────────────┐  │
│  │                         │    │ Strengths                │  │
│  │ Eight-dimension         │    │ Weaknesses               │  │
│  │ assessment visualization│    │ Opportunities            │  │
│  │                         │    │ Threats                  │  │
│  └─────────────────────────┘    └──────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CRITICAL RISKS                 EVIDENCE GAPS                 │
│  ┌─────────────────────────┐    ┌──────────────────────────┐  │
│  │ Risk 1                  │    │ Missing evidence 1       │  │
│  │ Risk 2                  │    │ Missing evidence 2       │  │
│  │ Risk 3                  │    │ Missing evidence 3       │  │
│  └─────────────────────────┘    └──────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  WINNING STRATEGY AND PRIORITY ACTIONS                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Strategic objective                                    │  │
│  │ Key strategic responses                                │  │
│  │ Priority actions                                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 6.3 Pipeline Header

The header should remain visible at the top of the opportunity workspace.

Display:

- Opportunity name.
- Customer.
- Industry.
- Revenue motion.
- Deal value.
- Currency.
- Current sales stage.
- Expected close date.
- Opportunity owner.
- Last assessment timestamp.

Primary actions:

- Reassess.
- Add Evidence.
- View History.
- More Actions.

### Header Interaction

Clicking the customer opens customer context.

Clicking the sales stage or close date should not automatically change CRM data unless an authorized integration and editing workflow is implemented.

The Reassess action triggers the governed assessment workflow.

The interface must show the assessment execution state and completion status.

## 6.4 Current Assessment Summary

The top-level summary should display three distinct information elements:

### Winability

The authoritative current winability result.

### Pipeline Health

The authoritative pipeline health result.

### Assessment Confidence

The reliability and completeness of the assessment.

These three concepts must remain visually and semantically distinct.

Do not use one metric as a substitute for another.

## 6.5 AI Assessment Summary

The summary should provide:

**Current Position**

A concise explanation of the opportunity's current condition.

**Positive Drivers**

The most important factors supporting winning.

**Critical Constraints**

The most important factors limiting winning.

**Strategic Implication**

What the findings mean for the sales approach.

**Recommended Next Focus**

The most important action or validation priority.

The summary should be concise and expandable.

Users can open the detailed assessment explanation when they need further analysis.

---

# 7. PADF Dimension Intelligence Workspace

## 7.1 Purpose

Provide a detailed view of the eight Pipeline Assessment Dimensions.

PADF remains the primary opportunity assessment framework.

The interface must preserve all eight dimensions and their existing identifiers.

## 7.2 Dimension Visualization

Recommended layout:

```text
┌────────────────────────────────────────────────────────────┐
│ PADF DIMENSION INTELLIGENCE                                 │
│                                                            │
│ Overall Dimension Assessment                               │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │          Eight-Dimension Radar Chart                 │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ DIMENSION ASSESSMENT                                       │
│                                                            │
│ Customer Value & Urgency                 [Status] [Open]    │
│ Buying Center & Influence                [Status] [Open]    │
│ Buying Process & Decision Control        [Status] [Open]    │
│ Solution & Value Proposition              [Status] [Open]    │
│ Competitive Position                     [Status] [Open]    │
│ Commercial & Deal Structure               [Status] [Open]    │
│ Sales Execution & Deal Readiness           [Status] [Open]    │
│ Deal Momentum, Risk & Closeability        [Status] [Open]    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 7.3 Eight PADF Dimensions

The interface must use the canonical dimension identifiers and labels:

| ID | Dimension |
|---|---|
| `PA1_Customer_Value_and_Urgency` | Customer Value & Urgency |
| `PA2_Buying_Center_and_Influence` | Buying Center & Influence |
| `PA3_Buying_Process_and_Decision_Control` | Buying Process & Decision Control |
| `PA4_Solution_and_Value_Proposition` | Solution & Value Proposition |
| `PA5_Competitive_Position` | Competitive Position |
| `PA6_Commercial_and_Deal_Structure` | Commercial & Deal Structure |
| `PA7_Sales_Execution_and_Deal_Readiness` | Sales Execution & Deal Readiness |
| `PA8_Deal_Momentum_Risk_and_Closeability` | Deal Momentum, Risk & Closeability |

## 7.4 Dimension Detail Panel

When users click a dimension, open a detail panel or dedicated detail view.

Recommended layout:

```text
┌────────────────────────────────────────────────────────────┐
│ Commercial & Deal Structure                         [Close] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ CURRENT ASSESSMENT                                          │
│ [Authoritative Result]                                     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ AI EXPLANATION                                              │
│                                                            │
│ Explanation of current commercial condition.                │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ SUPPORTING EVIDENCE                                         │
│                                                            │
│ Evidence item 1                         [View Evidence]     │
│ Evidence item 2                         [View Evidence]     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ CONTRADICTORY / QUALIFYING EVIDENCE                         │
│                                                            │
│ Evidence item 3                         [View Evidence]     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ RELATED SWOT FACTORS                                        │
│                                                            │
│ Weakness factor 1                      [View Factor]        │
│ Threat factor 1                        [View Factor]        │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ EVIDENCE GAPS                                                │
│                                                            │
│ Missing evidence 1                      [Request Evidence]  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ BUSINESS IMPACT                                             │
│                                                            │
│ Explanation of implications for winning.                    │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ RECOMMENDED IMPROVEMENT                                     │
│                                                            │
│ Recommended action                         [View Action]    │
└────────────────────────────────────────────────────────────┘
```

## 7.5 Dimension Interaction

Users should be able to:

- Inspect the current dimension assessment.
- Review supporting evidence.
- Review contradictory evidence.
- Understand related SWOT factors.
- Identify evidence gaps.
- Understand the business implications.
- Navigate to relevant actions.
- Compare the dimension with previous assessments.

### Important Visualization Rule

The radar chart is a visualization of existing dimension outputs.

It must not introduce new scoring logic.

If the underlying assessment provides numeric values, display those values.

If it provides only categorical results, use a suitable categorical visualization instead.

Never invent numeric values to populate a radar chart.

---

# 8. Workspace 3 — SWOT Intelligence

## 8.1 Purpose

Provide an interactive and evidence-driven view of the opportunity's internal strengths and weaknesses and external opportunities and threats.

This is a major new capability in v1.1.

SWOT should not be presented as a simple four-quadrant brainstorming exercise.

It should be an evidence-backed intelligence workspace where users can understand:

- Which factors are relevant.
- Which factors are supported by evidence.
- Which factors are uncertain.
- Which factors have changed.
- How factors affect PADF.
- How factors influence strategic responses.

## 8.2 SWOT Workspace Layout

Recommended desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ SWOT INTELLIGENCE                                            │
│                                                              │
│ Active Factors: 16             Evidence Coverage: [Result]    │
│ Configuration: [Version]       Last Assessment: [Timestamp]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ STRENGTHS                       WEAKNESSES                    │
│ ┌──────────────────────────┐    ┌──────────────────────────┐  │
│ │ Factor 1                 │    │ Factor 1                 │  │
│ │ Evidence Status          │    │ Evidence Status          │  │
│ │ Priority                 │    │ Priority                 │  │
│ │ [View Details]           │    │ [View Details]           │  │
│ │                          │    │                          │  │
│ │ Factor 2                 │    │ Factor 2                 │  │
│ │ ...                      │    │ ...                      │  │
│ └──────────────────────────┘    └──────────────────────────┘  │
│                                                              │
│ OPPORTUNITIES                    THREATS                      │
│ ┌──────────────────────────┐    ┌──────────────────────────┐  │
│ │ Factor 1                 │    │ Factor 1                 │  │
│ │ Evidence Status          │    │ Evidence Status          │  │
│ │ Priority                 │    │ Priority                 │  │
│ │ [View Details]           │    │ [View Details]           │  │
│ │                          │    │                          │  │
│ │ Factor 2                 │    │ Factor 2                 │  │
│ │ ...                      │    │ ...                      │  │
│ └──────────────────────────┘    └──────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ FACTOR CHANGES                                               │
│ New | Improved | Deteriorated | Unchanged | Unverified       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ SWOT EXECUTIVE INTERPRETATION                                │
│                                                              │
│ Gemini explanation of the most important SWOT findings.      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 8.3 Factor Cards

Each factor should be displayed as an interactive card.

Recommended information:

- Factor name.
- Canonical factor ID.
- SWOT classification.
- Factor evaluation result.
- Evidence status.
- Priority, where available.
- Relevant PADF dimensions.
- Change indicator.
- Last assessment timestamp.

Example:

```text
┌────────────────────────────────────────────┐
│ WEAKNESS                                   │
│                                            │
│ Limited Executive Access                  │
│                                            │
│ Factor ID: [Canonical ID]                  │
│ Evidence: Partially Supported              │
│ Priority: [Configured Priority]            │
│                                            │
│ PADF: Buying Center & Influence             │
│                                            │
│ [View Evidence]  [View Assessment]          │
└────────────────────────────────────────────┘
```

Factor names and definitions must come from the resolved Industry Configuration.

The UI must not hard-code factor names for different industries.

## 8.4 Factor Detail View

Clicking a factor opens a detailed analytical view.

Recommended layout:

```text
┌────────────────────────────────────────────────────────────┐
│ FACTOR DETAIL                                      [Close]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Factor Name                                                │
│ Canonical Factor ID                                        │
│ SWOT Classification                                        │
│ Configuration Layer: Universal / Revenue Motion / Industry │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ FACTOR DEFINITION                                           │
│                                                            │
│ Configured description and evaluation expectations.        │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ CURRENT ASSESSMENT                                          │
│                                                            │
│ Factor evaluation and supporting rationale.                │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ EVIDENCE RELATIONSHIPS                                      │
│                                                            │
│ SUPPORTS                                                    │
│ Evidence item A                                             │
│                                                            │
│ CONTRADICTS                                                 │
│ Evidence item B                                             │
│                                                            │
│ QUALIFIES / CONTEXTUALIZES                                  │
│ Evidence item C                                             │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ EVIDENCE QUALITY AND CONFIDENCE                             │
│                                                            │
│ Source credibility                                          │
│ Customer confirmation                                       │
│ Specificity and verifiability                               │
│ Recency                                                     │
│ Consistency                                                 │
│ Directness                                                  │
│ Completeness                                                │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ EVIDENCE GAPS                                               │
│                                                            │
│ Missing or insufficient evidence.                           │
│ [Request Evidence]                                          │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ PADF RELATIONSHIPS                                          │
│                                                            │
│ Related PADF dimensions and rationale.                      │
│ [Open Dimension]                                            │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ STRATEGIC IMPLICATION                                       │
│                                                            │
│ Business implications and potential TOWS relationships.     │
│ [View TOWS]                                                 │
└────────────────────────────────────────────────────────────┘
```

## 8.5 Evidence Status Visualization

The interface should distinguish between:

- Supported.
- Partially supported.
- Contradicted or weakened.
- Unverified or insufficient.
- Not applicable.
- Unable to assess.

These are explanatory UI states.

The underlying system status must remain governed by the authoritative configuration and Rules contract.

Do not invent new machine-readable status enums.

### Important Design Distinction

A factor may be configured but not yet supported by opportunity evidence.

The UI must make this distinction clear.

A configured factor should not automatically appear as a confirmed strength, weakness, opportunity, or threat.

## 8.6 Factor Evaluation Visualization

Where the source provides evaluation values, display the six configured evaluation dimensions:

- `strategic_impact`
- `evidence_confidence`
- `relevance`
- `urgency`
- `manageability`
- `winability_influence`

Use the configured 1–5 ordinal scale.

Recommended display:

```text
FACTOR EVALUATION

Strategic Impact       [1–5]
Evidence Confidence    [1–5]
Relevance              [1–5]
Urgency                [1–5]
Manageability          [1–5]
Winability Influence   [1–5]
```

The visualization may use compact horizontal indicators or an expandable evaluation panel.

Do not calculate a composite score.

Do not combine these dimensions into an invented overall SWOT score.

## 8.7 SWOT Filter and Search

Users should be able to filter by:

- SWOT classification.
- Evidence status.
- Priority.
- PADF dimension.
- Factor change.
- Evidence availability.

Search should support factor name and canonical factor ID.

---

# 9. Evidence Intelligence Center

## 9.1 Purpose

The Evidence Intelligence Center allows users to understand why the system reached its conclusions and manage opportunity-specific evidence.

It should make evidence traceability a visible product capability.

## 9.2 Evidence Center Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ EVIDENCE INTELLIGENCE CENTER                                 │
│                                                              │
│ [Search Evidence]  [Filter ▼]                 [Add Evidence]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Evidence Overview                                            │
│                                                              │
│ Total Evidence Items | Verified | Needs Review | Gaps        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ EVIDENCE LIST                                                │
│                                                              │
│ Evidence | Source | Date | Quality | Related Factors | Status│
│                                                              │
│ Evidence A                                                  │
│ Evidence B                                                  │
│ Evidence C                                                  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ EVIDENCE RELATIONSHIP EXPLORER                               │
│                                                              │
│ Evidence Instance                                           │
│       ↓                                                      │
│ Evidence Object                                              │
│       ↓                                                      │
│ Approved Mapping                                             │
│       ↓                                                      │
│ SWOT Factor / PADF Dimension                                 │
│       ↓                                                      │
│ Assessment Implication                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 9.3 Evidence List

Each evidence instance should display:

- Evidence title or description.
- Source.
- Source date.
- Evidence owner, where available.
- Evidence type.
- Related reusable evidence object.
- Related factor or dimension.
- Evidence relationship.
- Evidence status.
- Last updated timestamp.

The evidence list should support:

- Search.
- Filtering.
- Sorting.
- Evidence detail inspection.
- Evidence addition.
- Evidence update.
- Evidence correction.

## 9.4 Evidence Detail View

Recommended layout:

```text
┌────────────────────────────────────────────────────────────┐
│ EVIDENCE DETAIL                                   [Close]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Evidence Title                                              │
│ Source / Date / Owner                                       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ ORIGINAL EVIDENCE                                           │
│                                                            │
│ User-provided statement, document, record, or observation. │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ EVIDENCE CLASSIFICATION                                     │
│                                                            │
│ Reusable Evidence Object                                    │
│ Evidence Object ID                                          │
│ Approved Mapping Reference                                  │
│ Mapping Strength                                            │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ RUNTIME INTERPRETATION                                      │
│                                                            │
│ Relationship Type                                           │
│ Polarity                                                    │
│ Quality                                                    │
│ Confidence, where supplied                                  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ RELATED FACTORS                                             │
│                                                            │
│ SWOT Factor A                                               │
│ PADF Dimension B                                             │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ ASSESSMENT IMPACT                                            │
│                                                            │
│ Explanation of how this evidence contributes to assessment. │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 9.5 Evidence Relationship Explorer

This is an important visualization.

Users should be able to navigate through the evidence-to-assessment relationship:

```text
Actual Opportunity Evidence
          │
          ↓
Reusable Evidence Object
          │
          ↓
Approved Evidence Mapping
          │
          ↓
Canonical SWOT Factor
          │
          ↓
Factor Assessment
          │
          ├──────────→ PADF Dimension
          │
          └──────────→ TOWS Strategic Input
```

The relationship explorer should allow users to click each element and inspect its details.

### Evidence Relationship Types

Display the actual runtime relationship:

- `SUPPORTS`
- `CONTRADICTS`
- `QUALIFIES`
- `CONTEXTUALIZES`
- `GAP_SIGNAL`
- `CHANGE_SIGNAL`

Do not assign relationship types based only on reusable evidence definitions.

The actual evidence instance and its context determine the relationship.

### Evidence Polarity

Where applicable, display:

- `POSITIVE`
- `NEGATIVE`
- `MIXED`
- `NEUTRAL`
- `UNDETERMINED`

Polarity must remain separate from mapping strength, quality, confidence, and SWOT classification.

## 9.6 Evidence Quality Visualization

Use a structured quality panel.

Display:

- Source credibility.
- Customer confirmation.
- Specificity and verifiability.
- Recency and temporal relevance.
- Consistency with other evidence.
- Directness of observation.
- Completeness and context.

The UI should distinguish quality dimensions from the mapping strength.

Mapping strength values:

- `DIRECT`
- `SUPPORTING`
- `INDIRECT`

Do not present mapping strength as a quality rating.

## 9.7 Evidence Gap Management

Provide a dedicated evidence-gap panel.

The five configured gap types are:

- `missing_evidence`
- `insufficient_evidence`
- `conflicting_evidence`
- `outdated_evidence`
- `unverified_assumption`

Recommended layout:

```text
┌────────────────────────────────────────────────────────────┐
│ EVIDENCE GAP MANAGEMENT                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Critical Evidence Gaps                                      │
│                                                            │
│ Gap 1                                                      │
│ Type: Missing Evidence                                      │
│ Affected Factor: [Factor Name]                              │
│ Why It Matters: [Explanation]                               │
│ Recommended Validation: [Question]                          │
│                                                            │
│ [Request Evidence]  [Mark for Review]                        │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Gap 2                                                      │
│ Type: Conflicting Evidence                                  │
│ Affected Dimension: [Dimension Name]                        │
│                                                            │
│ [Review Conflict]                                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Evidence Request Interaction

When users select Request Evidence, open a structured form containing:

- Evidence requested.
- Reason for request.
- Related factor.
- Related PADF dimension, where applicable.
- Validation question.
- Suggested source.
- Priority.
- Suggested owner, if available.

The exact fields and requiredness must follow the authoritative evidence-gap contract.

### Unmapped Factors

Where a factor has no approved evidence mapping:

- Show an evidence coverage warning.
- Display the factor's evidence expectations.
- Allow the user to provide relevant opportunity-specific evidence through an approved input path.
- Do not invent an evidence mapping.
- Do not represent the factor as invalid simply because it is unmapped.

The Evidence Knowledge Base currently retains 14 unmapped factor references.

The UI must preserve these gaps transparently.

## 9.8 Evidence Timeline

Display evidence development over time.

Example:

```text
JAN
Customer business problem identified
        │
        ↓
FEB
Technical validation completed
        │
        ↓
MAR
Budget uncertainty emerged
        │
        ↓
APR
Economic buyer confirmation received
```

Users should be able to inspect:

- New evidence.
- Updated evidence.
- Withdrawn evidence.
- Evidence that became outdated.
- Evidence that resolved a previous gap.
- Evidence that introduced a contradiction.

---

# 10. Workspace 4 — TOWS Strategic Intelligence

## 10.1 Purpose

Translate supported SWOT findings into structured strategic responses.

This is a major new interface capability introduced by v1.1.

TOWS should be presented as a strategic reasoning workspace rather than simply another SWOT chart.

Its purpose is to help users understand how strengths, weaknesses, opportunities, and threats can be combined to develop a winning approach.

## 10.2 TOWS Workspace Layout

Recommended layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ TOWS STRATEGIC INTELLIGENCE                                  │
│                                                              │
│ Evidence-supported strategic combinations                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ SO STRATEGIES                  WO STRATEGIES                  │
│ Strength + Opportunity        Weakness + Opportunity          │
│                                                              │
│ ┌────────────────────────┐    ┌──────────────────────────┐   │
│ │ Strategy Candidate 1   │    │ Strategy Candidate 1     │   │
│ │ Supporting Factors     │    │ Supporting Factors       │   │
│ │ Strategic Objective    │    │ Strategic Objective      │   │
│ │ [View Details]         │    │ [View Details]           │   │
│ └────────────────────────┘    └──────────────────────────┘   │
│                                                              │
│ ST STRATEGIES                  WT STRATEGIES                  │
│ Strength + Threat             Weakness + Threat               │
│                                                              │
│ ┌────────────────────────┐    ┌──────────────────────────┐   │
│ │ Strategy Candidate 1   │    │ Strategy Candidate 1     │   │
│ │ Supporting Factors     │    │ Supporting Factors       │   │
│ │ Strategic Objective    │    │ Strategic Objective      │   │
│ │ [View Details]         │    │ [View Details]           │   │
│ └────────────────────────┘    └──────────────────────────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ STRATEGIC SYNTHESIS                                          │
│                                                              │
│ Gemini explanation of the most important strategic options. │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 10.3 Four TOWS Categories

### SO — Strengths and Opportunities

Use internal strengths to capture external opportunities.

### WO — Weaknesses and Opportunities

Address internal weaknesses to unlock external opportunities.

### ST — Strengths and Threats

Use internal strengths to counter external threats.

### WT — Weaknesses and Threats

Reduce exposure by addressing internal weaknesses and external threats.

## 10.4 TOWS Candidate Card

Each candidate should display:

- TOWS type.
- Strategy title.
- Supporting SWOT factors.
- Supporting evidence.
- Strategic objective.
- Strategic rationale.
- Feasibility.
- Dependencies.
- Expected directional winability influence.
- Handoff status.

Example:

```text
┌────────────────────────────────────────────┐
│ ST — STRENGTH / THREAT                     │
│                                            │
│ Defend Competitive Position Through Value  │
│                                            │
│ Strength: Proven Technical Differentiation│
│ Threat: Strong Incumbent Competitor        │
│                                            │
│ Objective:                                 │
│ Strengthen executive preference through   │
│ measurable business differentiation.      │
│                                            │
│ Supporting Evidence:  [View Evidence]      │
│                                            │
│ [View Strategic Rationale]                 │
│ [Open Strategy Details]                    │
└────────────────────────────────────────────┘
```

The example illustrates presentation only. Actual factor names and relationships must be derived from the opportunity's configured factors and evidence.

## 10.5 TOWS Detail View

Recommended sections:

1. Strategic combination.
2. Contributing SWOT factors.
3. Supporting evidence.
4. Strategic rationale.
5. Strategic objective.
6. Required actions.
7. Resources and dependencies.
8. Feasibility considerations.
9. Expected directional impact.
10. Strategy handoff status.

The interface should make the evidence-to-strategy relationship visible.

## 10.6 Strategy Handoff Status

Display the handoff state clearly.

Possible UI descriptions include:

- Candidate generated.
- Awaiting validation.
- Crosswalk unresolved.
- Payload validation failed.
- Eligible for handoff.
- Accepted by existing strategy engine.

These are presentation descriptions.

The underlying machine-readable status values must come from the authoritative Rules and integration contract.

### Important Governance Rule

TOWS does not replace the existing Winning Strategy engine.

The UI must distinguish:

**TOWS Strategic Candidate**

from:

**Approved Winning Strategy Engine Output**

An unresolved strategy crosswalk must remain visible.

The interface must not offer a misleading action that bypasses the strategy handoff gate.

---

# 11. Workspace 5 — Risk & Winning Strategy Workspace

## 11.1 Purpose

Transform assessment findings into strategic execution.

This workspace combines:

- Existing Risk Intelligence.
- TOWS strategic inputs.
- Existing Winning Strategy outputs.
- Recommended actions.
- Execution monitoring.

These components should be presented together while preserving their separate responsibilities.

## 11.2 Workspace Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ RISK & WINNING STRATEGY                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ RISK INTELLIGENCE                                             │
│                                                              │
│ Critical Risks | Emerging Risks | Active Risks                │
│                                                              │
│ Risk 1                                                       │
│ Risk 2                                                       │
│ Risk 3                                                       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ WINNING STRATEGY                                             │
│                                                              │
│ Current Opportunity Position                                │
│          ↓                                                   │
│ Strategic Objective                                          │
│          ↓                                                   │
│ Strategic Approach                                           │
│          ↓                                                   │
│ Execution Actions                                            │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ PRIORITY ACTIONS                                             │
│                                                              │
│ Action | Priority | Owner | Due Date | Status | Objective    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ STRATEGY EXECUTION PROGRESS                                  │
│                                                              │
│ Completed | In Progress | Blocked | Not Started              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 11.3 Risk Intelligence Panel

Each formal risk should display:

- Risk name.
- Risk identifier, where available.
- Risk category.
- Severity or priority.
- Current status.
- Supporting evidence.
- Business impact.
- Mitigation recommendation.
- Related SWOT context, where applicable.

Clicking a risk opens its detailed view.

### Risk Detail View

Display:

- Risk description.
- Trigger.
- Supporting evidence.
- Potential impact.
- Existing severity and likelihood outputs.
- Current mitigation.
- Recommended mitigation.
- Risk status.
- Historical changes.

The existing Risk Intelligence engine remains authoritative.

The UI must not automatically create a formal risk from every SWOT weakness or threat.

## 11.4 Winning Strategy Canvas

The Winning Strategy Canvas should provide a clear visual relationship:

```text
CURRENT OPPORTUNITY CONDITION
             │
             ↓
STRATEGIC OBJECTIVE
             │
             ↓
WINNING APPROACH
             │
             ↓
STRATEGIC ACTIONS
             │
             ↓
EXPECTED EVIDENCE OF IMPROVEMENT
             │
             ↓
ASSESSMENT RE-EVALUATION
```

The canvas should allow users to understand:

- Why the strategy was recommended.
- Which evidence supports it.
- Which SWOT findings contribute to it.
- Which risks it addresses.
- Which actions must be executed.
- How improvement will be observed.

## 11.5 Action Management

Each action should display, where supported:

- Action title.
- Strategic objective.
- Related issue or factor.
- Priority.
- Owner.
- Due date.
- Status.
- Expected impact.
- Success indicator.
- Dependencies.

Recommended action statuses for the UI:

- Not Started.
- In Progress.
- Completed.
- Blocked.
- Cancelled.

The underlying action-status contract must determine the actual stored values.

## 11.6 Action Detail View

Users should be able to:

- View the action rationale.
- Inspect supporting evidence.
- Review the related strategy.
- Assign or update ownership where permitted.
- Update execution status.
- Record completion evidence.
- Add comments or observations.
- Review historical changes.

Human updates must be recorded with appropriate provenance.

## 11.7 Action-to-Assessment Feedback

When an action is completed, the interface should allow the user to record the evidence of completion or the resulting customer/business change.

Completion alone does not prove that the underlying opportunity condition improved.

For example:

An executive meeting may be completed, but executive sponsorship may remain unconfirmed.

The assessment should change only when supported by new evidence and the governed reassessment process.

---

# 12. Workspace 6 — Pipeline Evolution Timeline

## 12.1 Purpose

Enable longitudinal intelligence.

Users should understand how an opportunity has evolved and whether previous actions have improved its position.

## 12.2 Evolution Workspace Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ PIPELINE EVOLUTION                                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ASSESSMENT HISTORY                                           │
│                                                              │
│ Assessment 1 ─── Assessment 2 ─── Assessment 3 ─── Current   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ WINABILITY EVOLUTION                                         │
│                                                              │
│ Historical trend using authoritative assessment results.    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ DIMENSION EVOLUTION                                          │
│                                                              │
│ PADF dimension changes over time.                             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ SWOT EVOLUTION                                               │
│                                                              │
│ New factors | Improved | Deteriorated | Unverified           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ RISK EVOLUTION                                               │
│                                                              │
│ New risks | Escalated | Mitigated | Closed                    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ STRATEGY EFFECTIVENESS                                       │
│                                                              │
│ Recommended actions | Completed actions | Observed outcomes  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 12.3 Assessment History

Display:

- Assessment number.
- Timestamp.
- Winability.
- Pipeline health.
- Assessment confidence.
- Major findings.
- Configuration and Rules versions.

Users should be able to select an assessment and inspect its historical snapshot.

## 12.4 Evolution Explanation

Gemini should explain material changes.

Example:

"Winability improved because executive sponsorship was established and procurement uncertainty was reduced. However, competitive positioning remains a material constraint."

The explanation should identify:

- What changed.
- What evidence changed.
- Which dimensions changed.
- Which SWOT factors changed.
- Which risks changed.
- Why the change matters.

Do not present a historical score difference as a causal explanation unless the underlying evidence supports that explanation.

## 12.5 Strategy Effectiveness Tracking

Show the relationship between:

- Recommended action.
- Action execution.
- New evidence.
- Assessment change.
- Business outcome.

Do not assume that an action caused an improvement merely because it occurred before the improvement.

## 12.6 Methodology Change Awareness

When historical and current assessments use different methodology or configuration versions, display a comparability notice.

Users should be able to distinguish:

- Actual opportunity changes.
- Evidence changes.
- Configuration changes.
- Rules changes.
- Methodology changes.

Historical results must not be silently recalculated.

---

# 13. Workspace 7 — Governance & Learning Center

## 13.1 Purpose

Ensure transparency, assessment quality, traceability, and controlled improvement.

Primary users:

- Revenue Operations.
- Sales leadership.
- Authorized administrators.

## 13.2 Governance Workspace Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ GOVERNANCE & LEARNING CENTER                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ASSESSMENT AUDIT                                             │
│                                                              │
│ Assessment ID | Date | Status | Rule Version | AI Version    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ EVIDENCE GOVERNANCE                                          │
│                                                              │
│ Evidence coverage | Missing evidence | Conflicts             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ CONFIGURATION AND VERSION TRACE                              │
│                                                              │
│ Industry Configuration                                       │
│ Evidence Knowledge Base                                      │
│ Rules                                                        │
│ PADF / PADIF                                                 │
│ Gemini prompt version                                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ HUMAN REVIEW AND OVERRIDES                                   │
│                                                              │
│ Review requests | Overrides | Justifications                 │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ OUTCOME LEARNING                                             │
│                                                              │
│ Closed Won | Closed Lost | Prediction Review                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 13.3 Assessment Audit

Display:

- Assessment ID.
- Opportunity ID.
- Assessment timestamp.
- Execution status.
- Source asset versions.
- Rule execution information.
- Evidence references.
- AI reasoning version.
- Assessment output version.
- Human review history.

Users should be able to inspect the lineage of a material conclusion.

## 13.4 Human Review and Override

Authorized users may:

- Add evidence.
- Correct source information.
- Challenge an assessment conclusion.
- Request reassessment.
- Record a human override where supported.

Every override must preserve:

- Original value.
- New value.
- User identity.
- User role, where available.
- Timestamp.
- Justification.
- Relevant assessment version.

The interface must distinguish a human override from an AI-generated assessment result.

Overrides must not silently rewrite the underlying deterministic output.

## 13.5 Configuration and Version Trace

Display the versions used for each assessment:

- Industry Configuration.
- Evidence Knowledge Base.
- Rules.
- PADF.
- PADIF.
- SWOT Master Schema.
- Gemini system prompt.
- Relevant AI model/version information, where available.

This is essential for reproducibility and historical interpretation.

## 13.6 Closed Won / Closed Lost Learning

At closure, provide an Outcome Review workspace.

### Closed Won

Capture:

- Actual outcome.
- Winning factors.
- Effective strategies.
- Supporting evidence.
- Successful actions.
- Important customer decisions.
- Relevant TOWS findings.

### Closed Lost

Capture:

- Loss reason.
- Missing or weak evidence.
- Realized risks.
- Competitive factors.
- Strategy failures.
- Customer decision factors.
- Important missed signals.

### Outcome Review Layout

```text
┌────────────────────────────────────────────────────────────┐
│ OPPORTUNITY OUTCOME REVIEW                                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Final Outcome: Closed Won / Closed Lost                     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ORIGINAL ASSESSMENT                                         │
│                                                            │
│ Winability | Confidence | Key Findings                     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ACTUAL OUTCOME                                              │
│                                                            │
│ What happened?                                              │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ WINNING / LOSS FACTORS                                      │
│                                                            │
│ Evidence | SWOT | Risk | Strategy                           │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ LEARNING OBSERVATIONS                                       │
│                                                            │
│ What should the organization learn?                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Outcome learning must follow controlled governance.

Users should not be able to silently modify evidence mappings, factor definitions, rules, or model behavior through an outcome review.

---

# 14. AI Interaction Design

## 14.1 AI Product Role

Gemini acts as the:

**Pipeline Intelligence Advisor**

It should not be presented as a generic chatbot.

Its purpose is to help users understand the opportunity and make better decisions.

## 14.2 AI Interaction Entry Point

Provide an AI interaction panel accessible throughout the individual opportunity workspace.

Recommended layout:

```text
┌──────────────────────────────────────────────┐
│ PIPELINE INTELLIGENCE ADVISOR                │
├──────────────────────────────────────────────┤
│                                              │
│ Ask about this opportunity                   │
│                                              │
│ [What is preventing us from winning?]        │
│                                              │
│ Suggested Questions:                         │
│                                              │
│ • What are the most critical weaknesses?     │
│ • What evidence is missing?                  │
│ • Why did winability change?                 │
│ • Which threat should we address first?      │
│ • What is our strongest TOWS strategy?       │
│ • What should I do next?                     │
│                                              │
│ [Type your question...]              [Send]  │
│                                              │
└──────────────────────────────────────────────┘
```

## 14.3 Context-Aware Interaction

The AI Advisor should understand the current context.

For example:

- From the overview page, it should understand the entire opportunity.
- From a PADF dimension page, it should focus on that dimension.
- From a SWOT factor detail page, it should focus on the selected factor.
- From the evidence center, it should focus on evidence relationships.
- From the TOWS workspace, it should focus on strategic combinations.
- From the risk workspace, it should focus on risk and mitigation.
- From the history page, it should focus on changes over time.

Users should not need to repeat information already available in the selected context.

## 14.4 Standard AI Response Structure

Material AI responses should follow:

**Assessment**

What is the current condition?

**Evidence**

What evidence supports the conclusion?

**Reasoning**

Why does the evidence lead to this interpretation?

**Business Impact**

Why does it matter?

**Recommended Action**

What should the user do next?

For strategic questions, include the relevant TOWS or Winning Strategy context where applicable.

## 14.5 AI Response Interaction

Users should be able to:

- Expand supporting evidence.
- Open related factors.
- Navigate to related PADF dimensions.
- Open relevant risks.
- Inspect TOWS candidates.
- Convert an approved recommendation into an action, where supported.
- Ask follow-up questions.

The AI response should link to actual system records wherever possible.

Do not display fabricated references.

## 14.6 AI Transparency

When an AI explanation uses:

- Evidence.
- SWOT factors.
- PADF results.
- Risk records.
- TOWS candidates.
- Historical assessments.

The interface should make these references inspectable.

Users should be able to distinguish:

- Deterministic system output.
- AI interpretation.
- Human input.
- Unverified assumption.
- Recommendation.

---

# 15. Product Intelligence Visualization Principles

## Principle 1 — Every Score Must Explain Itself

No black-box scoring.

Users should be able to inspect the meaning and supporting evidence behind a displayed result.

## Principle 2 — Every Risk Must Connect to Evidence

A formal risk should link to its supporting evidence and mitigation information.

## Principle 3 — Every SWOT Factor Must Show Its Evidence State

Configured factors must not appear as confirmed findings without opportunity-specific evidence.

## Principle 4 — Every TOWS Strategy Must Show Its Strategic Basis

Users should understand which strengths, weaknesses, opportunities, and threats support the proposed response.

## Principle 5 — Every Recommendation Must Connect to an Improvement Objective

Actions should address a specific weakness, threat, risk, strategic objective, or evidence gap.

## Principle 6 — Every Opportunity Must Have Historical Memory

Users should be able to inspect how the opportunity evolved.

## Principle 7 — Every User Action Should Improve Intelligence

Evidence updates, action completion, corrections, and outcome records should contribute to a more accurate assessment history.

## 15.1 Visualization Types

Recommended visualization choices:

| Information | Recommended Visualization |
|---|---|
| Pipeline health | Distribution chart |
| Winability distribution | Bar or segmented distribution |
| Pipeline momentum | Trend indicators |
| PADF dimensions | Radar chart or dimension cards |
| SWOT | Four-quadrant factor workspace |
| Factor evaluation | Compact ordinal indicators |
| Evidence relationships | Relationship map |
| Evidence gaps | Prioritized gap list |
| TOWS | Four-quadrant strategic board |
| Risk concentration | Risk category distribution |
| Strategy execution | Action status board |
| Historical assessment | Timeline and trend chart |
| Evidence evolution | Chronological timeline |

## 15.2 Color and Status Semantics

Use a consistent visual language across the module.

Recommended semantic conventions:

- Green: positive or improving.
- Amber: attention required or uncertain.
- Red: critical or adverse.
- Blue: informational or neutral.
- Grey: unavailable, inactive, or not assessed.

These colors are visual conventions only.

The underlying status and classification must come from the authoritative source.

Do not use color alone to communicate meaning.

Always include labels, icons, or explanatory text.

## 15.3 Avoid Misleading Visualizations

Do not:

- Invent numeric scores.
- Convert ordinal values into percentages.
- Treat missing evidence as negative.
- Combine unrelated metrics into one composite score.
- Present an AI interpretation as a deterministic calculation.
- Present an unvalidated TOWS candidate as an approved strategy.
- Show stale information without a timestamp or status.

---

# 16. Mobile Experience

## 16.1 Mobile Priority

The mobile experience should prioritize sales execution and rapid intelligence access.

Mobile users are more likely to need:

- Opportunity summary.
- Current winability.
- Critical risks.
- Important evidence gaps.
- Recommended actions.
- Upcoming activities.
- AI assistance.

## 16.2 Mobile Navigation

Use a compact navigation model.

Recommended primary mobile navigation:

```text
┌──────────────────────────────┐
│ RevOS                        │
├──────────────────────────────┤
│ Dashboard                    │
│ Opportunities                │
│ Evidence                     │
│ Strategy                     │
│ More                         │
└──────────────────────────────┘
```

The detailed opportunity navigation should be available through a compact tab or secondary menu.

## 16.3 Mobile Opportunity Overview

Recommended layout:

```text
┌──────────────────────────────┐
│ Opportunity Name             │
│ Customer | Stage             │
├──────────────────────────────┤
│ Winability                   │
│ [Result]                     │
│                              │
│ Pipeline Health              │
│ [Result]                     │
├──────────────────────────────┤
│ AI Assessment Summary        │
│                              │
│ Key opportunity findings     │
├──────────────────────────────┤
│ Critical Risks               │
│                              │
│ Risk 1                       │
│ Risk 2                       │
├──────────────────────────────┤
│ Evidence Gaps                │
│                              │
│ Gap 1                        │
│ Gap 2                        │
├──────────────────────────────┤
│ Priority Actions             │
│                              │
│ Action 1                     │
│ Action 2                     │
├──────────────────────────────┤
│ [Ask AI Advisor]             │
└──────────────────────────────┘
```

## 16.4 Mobile Interaction Principles

- Prioritize vertical information flow.
- Use collapsible detail sections.
- Keep critical actions easily accessible.
- Avoid wide analytical tables.
- Use simplified charts.
- Support evidence review and action updates.
- Provide access to the AI Advisor.
- Maintain readable factor and risk details.

Complex evidence relationship graphs and detailed TOWS analysis may use simplified mobile presentations.

---

# 17. Notification Intelligence

## 17.1 Purpose

Provide proactive alerts when important opportunity conditions change.

Notifications should be based on validated system events, evidence updates, or configured triggers.

Gemini may generate explanatory narratives, but the notification trigger itself must follow the authoritative Rules and event logic.

## 17.2 Notification Categories

### Risk Alert

Example:

"Executive sponsorship risk increased because no executive interaction has been recorded during the configured monitoring period."

### Opportunity Alert

Example:

"Competitive position improved after customer validation confirmed a measurable differentiation advantage."

### Evidence Alert

Example:

"New customer evidence contradicts the previously recorded budget assumption."

### Evidence Gap Alert

Example:

"Economic buyer confirmation remains outstanding and continues to constrain commercial readiness."

### Strategy Alert

Example:

"The recommended executive engagement action remains incomplete."

### Momentum Alert

Example:

"Opportunity momentum has deteriorated compared with the previous assessment."

## 17.3 Notification Interface

Recommended notification panel:

```text
┌────────────────────────────────────────────┐
│ NOTIFICATIONS                              │
├────────────────────────────────────────────┤
│                                            │
│ CRITICAL RISK                              │
│ Executive sponsorship risk increased.     │
│ [View Opportunity]                         │
│                                            │
│ EVIDENCE UPDATE                             │
│ New evidence contradicts budget assumption.│
│ [Review Evidence]                          │
│                                            │
│ ACTION REMINDER                            │
│ Executive engagement action overdue.      │
│ [View Action]                              │
│                                            │
└────────────────────────────────────────────┘
```

Users should be able to:

- Open the related opportunity.
- Open the related evidence.
- Review the relevant risk.
- Navigate to the action.
- Mark the notification as read.

Notification frequency and delivery channels should be configurable where the product supports them.

---

# 18. Interface States and User Feedback

The interface must clearly communicate the state of the assessment and its underlying data.

## 18.1 Assessment States

Display appropriate states such as:

- Not Started.
- Initializing.
- Processing.
- Completed.
- Completed with Limitations.
- Failed.
- Requires Review.

These are UI descriptions.

The actual stored status values must follow the Rules and implementation contract.

## 18.2 Loading Experience

When an assessment is running:

- Show the current processing state.
- Identify the relevant assessment being processed.
- Avoid displaying a new result as final before execution completes.
- Preserve the last valid assessment snapshot.
- Display an appropriate message if processing is delayed.

Where the runtime provides safe progress information, show it to the user.

Do not invent processing percentages.

## 18.3 Partial Completion

If a non-critical integration branch fails:

- Preserve valid completed assessment outputs.
- Identify the incomplete component.
- Explain which information is unavailable.
- Prevent incomplete results from appearing as completed findings.
- Provide a retry or review action where supported.

For example, a SWOT integration failure should not automatically invalidate otherwise valid existing Pipeline Assessment outputs if the Rules contract defines isolated failure behavior.

## 18.4 Empty States

Examples:

**No Historical Assessment**

"This is the initial Pipeline Assessment baseline. Historical comparisons will become available after subsequent assessments."

**No Supporting Evidence**

"No opportunity-specific evidence has been recorded for this factor."

**No TOWS Candidate**

"No evidence-supported TOWS strategy has been identified for this assessment."

**Unresolved Crosswalk**

"This strategic candidate cannot yet be transferred to the existing Winning Strategy engine because its strategy mapping has not been validated."

**No Active Risks**

"No formal active risks are currently recorded by the Risk Intelligence engine."

Do not interpret an empty list as proof that no underlying risk or issue exists.

## 18.5 Error and Validation States

Display clear explanations for:

- Missing required data.
- Invalid configuration.
- Unresolved identifiers.
- Unavailable evidence references.
- Unresolved mappings.
- Failed assessment execution.
- Failed strategy handoff.
- Incomplete historical comparison.

Avoid exposing raw technical error messages to ordinary users.

Authorized administrators should have access to detailed diagnostics.

---

# 19. Interaction and Usability Requirements

## 19.1 Cross-Workspace Navigation

Users must be able to move naturally between related information.

Examples:

- Assessment conclusion → supporting evidence.
- PADF dimension → related SWOT factors.
- SWOT factor → evidence instances.
- SWOT factors → TOWS candidate.
- TOWS candidate → Winning Strategy.
- Risk → supporting evidence.
- Action → related strategy.
- Historical change → relevant previous assessment.

The user should not need to search manually for related information.

## 19.2 Context Preservation

When navigating between related workspaces:

- Preserve the selected opportunity.
- Preserve relevant filters where appropriate.
- Preserve the selected factor or dimension context.
- Provide a clear route back to the previous view.

## 19.3 Progressive Disclosure

The default overview should be concise.

Detailed information should open through:

- Expandable sections.
- Detail panels.
- Tabs.
- Drill-down views.
- Evidence relationship explorers.

Avoid placing all evidence, mappings, factors, rules, and historical records on one screen.

## 19.4 Search and Filtering

Search and filtering should be available in:

- Opportunity lists.
- Evidence lists.
- SWOT factors.
- Risks.
- Actions.
- Assessment history.
- Governance records.

Filters should reflect the actual data and supported query capabilities.

## 19.5 Accessibility

The interface should support:

- Keyboard navigation.
- Clear focus states.
- Readable typography.
- Sufficient contrast.
- Screen-reader labels.
- Accessible chart descriptions.
- Text alternatives for color-coded statuses.

---

# 20. Product Data Presentation and Integrity

The product must clearly distinguish between different types of information.

## 20.1 Information Categories

| Information Type | Presentation |
|---|---|
| CRM or inherited data | Source data |
| Actual opportunity evidence | Evidence instance |
| Reusable KB definition | Evidence object |
| Approved evidence mapping | Mapping relationship |
| Deterministic assessment | System result |
| AI interpretation | AI explanation |
| Human correction | User-provided update |
| Human override | Governed override |
| TOWS result | Strategic candidate or validated input |
| Winning Strategy output | Existing strategy-engine result |

These categories must not be visually or semantically confused.

## 20.2 Confidence Presentation

Keep the following concepts distinct:

- Evidence confidence from the Knowledge Base.
- Factor-level evidence confidence.
- Assessment confidence.
- Winability.

Do not use one generic confidence badge for all four.

Where the underlying scales differ, show the relevant scale and its meaning.

## 20.3 Source and Version Presentation

For material findings, users should be able to inspect:

- Source.
- Timestamp.
- Evidence object.
- Mapping reference.
- Factor identifier.
- PADF dimension.
- Configuration version.
- Rules version.

Not all technical identifiers need to appear in the default view.

However, they should be accessible in the detail or audit view.

---

# 21. Product Success Metrics

Measure the effectiveness of Pipeline Assessment across four dimensions.

## 21.1 Pipeline Improvement

- Win rate improvement.
- Reduced stalled pipeline.
- Improved opportunity progression.
- Reduced forecast error.
- Improved pipeline predictability.
- Improved deal quality and margin.

These are business outcome measures, not guaranteed effects of product usage.

## 21.2 User Adoption

- Assessment completion.
- Evidence updates.
- Evidence-gap resolution.
- Recommendation acceptance.
- Action execution.
- Reassessment frequency.
- Workspace engagement.

## 21.3 AI Effectiveness

- Recommendation acceptance.
- Recommendation usefulness.
- Evidence-grounding quality.
- Risk detection accuracy.
- Assessment explanation usefulness.
- TOWS strategic relevance.
- AI output validation success.

## 21.4 Governance and Quality

- Evidence traceability.
- Evidence coverage.
- Assessment completeness.
- Human override frequency.
- Configuration compatibility.
- Rule execution reliability.
- Historical comparability.
- Strategy handoff validation.

---

# 22. Product Design Acceptance Criteria

The Product Design Specification v1.1 is acceptable when the following requirements are satisfied.

## 22.1 Product Architecture

1. The six original experience areas remain represented.
2. The four original user groups remain supported.
3. The opportunity-level navigation is consistent.
4. The product supports the complete opportunity lifecycle.
5. The interface connects assessment, evidence, strategy, execution, and evolution.

## 22.2 Assessment Workspace

6. The workspace provides an integrated opportunity overview.
7. Winability, pipeline health, and assessment confidence remain distinct.
8. The eight PADF dimensions remain unchanged.
9. Dimension detail views provide evidence and explanation.
10. Users can navigate between dimensions and related factors.

## 22.3 SWOT Intelligence

11. The interface presents all four SWOT classifications.
12. Only the resolved active factor set is treated as applicable.
13. Factor cards expose evidence status and assessment information.
14. Factor details provide evidence traceability.
15. Evidence quality and confidence are not confused with mapping strength.
16. Missing evidence is not presented as negative evidence.
17. Unmapped factors remain visible without fabricated mappings.
18. Factor evaluation does not introduce a composite SWOT score.

## 22.4 Evidence Intelligence

19. Evidence instances are distinguished from reusable evidence objects.
20. Approved mappings are inspectable.
21. Runtime relationships are displayed correctly.
22. Runtime polarity remains separate from factor classification.
23. Evidence gaps are managed through a dedicated experience.
24. Evidence provenance and history are accessible.

## 22.5 TOWS and Strategy

25. SO, WO, ST, and WT are supported.
26. TOWS candidates display their contributing factors and evidence.
27. Strategic rationale is inspectable.
28. Unresolved strategy crosswalks remain visible.
29. TOWS candidates are distinguished from approved Winning Strategy outputs.
30. The existing Winning Strategy engine remains authoritative.

## 22.6 Risk and Winability

31. Existing Risk Intelligence outputs are displayed.
32. SWOT findings are not automatically converted into formal risks.
33. Base winability and risk-adjusted winability remain distinct.
34. Deterministic outputs are not recalculated by the frontend.
35. Material risks link to evidence and mitigation.

## 22.7 Longitudinal Intelligence and Governance

36. Historical assessments are accessible.
37. Changes in evidence, factors, dimensions, and risks can be inspected.
38. Methodology changes are distinguished from opportunity changes.
39. Human overrides preserve audit information.
40. Closed Won / Closed Lost learning is supported.

## 22.8 Usability

41. Desktop and mobile experiences are defined.
42. Cross-workspace navigation preserves opportunity context.
43. Loading, empty, error, and partial-completion states are defined.
44. AI interactions are context-aware.
45. The interface distinguishes deterministic results, AI explanations, and human input.

---

# 23. Product Design Governance and Dependencies

The following source assets govern the product's data and behavior.

| Asset | Responsibility |
|---|---|
| Pipeline Reasoning Strategy Specification v1.1 | Reasoning methodology and intelligence architecture |
| Gemini Pipeline Reasoning System Prompt v1.1 | Gemini reasoning instructions |
| Pipeline Industry Configuration v1.1 | Contextual SWOT factors, evaluation criteria, and TOWS definitions |
| Pipeline Evidence Knowledge Base v1.1 | Evidence definitions and approved mappings |
| Pipeline Assessment Rules v1.1 | Deterministic execution, assessment, integration, and governance |
| PADF v1.0 | Eight opportunity assessment dimensions |
| PADIF v1.0 | Inherited Opportunity Qualification data framework |

## 23.1 Source of Truth

The UI must not become an independent source of business logic.

The interface displays and facilitates interaction with authoritative system outputs.

It must not independently redefine:

- Factor definitions.
- Evidence mappings.
- Assessment thresholds.
- PADF dimensions.
- Winability calculations.
- Risk severity.
- Risk aggregation.
- Strategy eligibility.
- Strategy prioritization.
- Lifecycle transitions.

## 23.2 Rules v1.1 Governance Status

Rules v1.1 remains a draft pending Stage 6 validation.

Therefore, the product design defines the intended experience and integration behavior but does not imply that every corresponding runtime function is already implemented or production-ready.

The implementation must respect the validated runtime contracts when available.

## 23.3 Unresolved Crosswalks

Two integration areas remain unresolved:

- Evidence Knowledge Base strategy categories to Industry Configuration strategy identifiers.
- Evidence Knowledge Base risk triggers to Industry Configuration risk patterns.

The product must expose unresolved integration status rather than presenting fabricated mappings.

## 23.4 Version Compatibility

When a source asset changes:

- Review the affected interface components.
- Review affected data presentations.
- Review related interactions.
- Review historical compatibility.
- Update the design specification where required.

A change to an authoritative JSON asset does not automatically authorize a change to the product's user-facing semantics.

---

# 24. Recommended Implementation Sequence

The following sequence is a product implementation recommendation, not a replacement for the technical execution plan or Rules orchestration.

## Phase 1 — Core Opportunity Workspace

Implement:

- Opportunity list.
- Opportunity header.
- Assessment overview.
- AI assessment summary.
- Winability and health presentation.
- Eight PADF dimension views.

## Phase 2 — Evidence Intelligence

Implement:

- Evidence list.
- Evidence detail.
- Evidence relationship explorer.
- Evidence quality presentation.
- Evidence gap management.
- Evidence timeline.

## Phase 3 — SWOT Intelligence

Implement:

- Four-quadrant SWOT workspace.
- Dynamic factor cards.
- Factor detail view.
- Factor evaluation visualization.
- PADF relationships.
- Factor evolution.

## Phase 4 — TOWS and Strategy

Implement:

- TOWS workspace.
- Four strategic categories.
- TOWS detail view.
- Strategy handoff status.
- Existing Winning Strategy integration.
- Action management.

## Phase 5 — Risk and Evolution

Implement:

- Risk intelligence workspace.
- Risk detail.
- Historical assessment timeline.
- Winability evolution.
- SWOT evolution.
- Risk evolution.
- Strategy effectiveness tracking.

## Phase 6 — Governance and Executive Intelligence

Implement:

- Portfolio dashboard.
- Executive insights.
- Governance center.
- Assessment audit.
- Human overrides.
- Outcome review.
- Mobile optimization.

Each phase should include integration testing against the authoritative Rules and data contracts before being considered complete.

---

# 25. Final Product Principle

Pipeline Assessment should not be experienced as a collection of assessment reports or disconnected AI features.

It should operate as one integrated revenue intelligence workspace.

Users should be able to move naturally through:

**Opportunity Understanding**

↓

**Evidence Intelligence**

↓

**PADF and SWOT Assessment**

↓

**TOWS Strategic Reasoning**

↓

**Risk and Winability Intelligence**

↓

**Winning Strategy**

↓

**Action Execution**

↓

**Continuous Improvement**

The central product experience should always help users understand:

- Where the opportunity stands.
- Why it stands there.
- What evidence supports the conclusion.
- Which factors influence winning.
- What could prevent winning.
- What strategic response is appropriate.
- What actions should be taken.
- Whether those actions are improving the opportunity.

The ultimate objective is:

> Enable sales professionals, managers, and executive leaders to actively understand, govern, and improve the probability and quality of winning every material pipeline opportunity through continuous, evidence-driven revenue intelligence.

---

## End of Document

**Pipeline Product Design Specification v1.1 — Draft for Owner Review**