Pipeline_Assessment_Data_Inheritance_Framework_v1.0


1. Purpose
The Pipeline Assessment Data Inheritance Framework (PADIF) v1.0 defines what information, evidence, decisions, scores, context, and uncertainties are transferred from the Opportunity Qualification module into the Pipeline Assessment module when an SQL becomes a Qualified Opportunity.
Its purpose is to establish a reliable starting intelligence state for Pipeline Assessment without duplicating the upstream qualification process.
The framework ensures:
Opportunity Qualification establishes the opportunity's foundation; Pipeline Assessment inherits that foundation and continuously builds the current winability picture on top of it.

2. Fundamental Architecture
The inheritance relationship should be:
                 SQL
                  │
                  ▼
       Opportunity Qualification
                  │
                  │
          Qualification Engine
                  │
                  ▼
       Qualification Intelligence
              Package
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
  Qualification         Evidence
    Decision            Inventory
        │                   │
        └─────────┬─────────┘
                  ▼
        QUALIFIED OPPORTUNITY
                  │
                  ▼
      Pipeline Assessment
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 Inherited Intelligence   New Evidence
        │                   │
        └─────────┬─────────┘
                  ▼
        Current Opportunity
           Intelligence
                  │
                  ▼
        Pipeline Assessment
The important distinction is:
Inherited data establishes the baseline.
New Pipeline Assessment evidence establishes the current state.

3. The Data Inheritance Principle
Not everything produced by Opportunity Qualification should be treated equally downstream.
I recommend four inheritance classes.
Class	Meaning	Pipeline Assessment Treatment
I1 — Context	Stable opportunity context	Directly inherited
I2 — Validated Evidence	Evidence supporting qualification	Inherited as baseline evidence
I3 — Qualification Intelligence	AI interpretation generated upstream	Inherited as contextual intelligence, not ground truth
I4 — Qualification State	Qualification result, confidence, gaps, risks	Inherited as historical starting state
This creates an important rule:
Pipeline Assessment inherits the evidence and reasoning context, but does not inherit the upstream conclusion as a permanent truth.

4. I1 — Opportunity Context
These are foundational facts needed to initialize Pipeline Assessment.
Inherited fields
Opportunity Identity
•	Opportunity ID
•	Opportunity name
•	Account ID
•	Account name
•	Contact(s)
•	Opportunity owner
•	Sales team
•	Creation date
•	Qualification date
Commercial Context
•	Revenue motion
•	Industry
•	Geography
•	Region
•	Product/service category
•	Estimated opportunity value
•	Currency
•	Expected close date
Lifecycle Context
•	Current opportunity stage
•	Source
•	Lead origin
•	SQL origin
•	Opportunity creation date
Configuration Context
•	Revenue motion configuration ID
•	Industry configuration ID
•	Assessment framework version
•	Qualification framework version
These should be directly inherited because they establish the assessment context.

5. I2 — Validated Qualification Evidence
This is the most important inheritance category.
Pipeline Assessment should receive the evidence that established why the SQL became a qualified opportunity.
Examples:
Customer Need
•	Identified business problem
•	Customer pain
•	Business impact
•	Strategic initiative
•	Customer objectives
Buying Context
•	Known stakeholders
•	Decision maker
•	Champion
•	Buying process information
•	Decision timeline
Commercial Context
•	Budget information
•	Estimated deal value
•	Procurement information
•	Expected purchase timing
Solution Context
•	Customer requirements
•	Solution needs
•	Known fit
•	Technical requirements
Engagement Context
•	Meetings
•	Customer interactions
•	Responses
•	Evaluation activities
Each inherited evidence item should retain its provenance.

6. Evidence Provenance Is Mandatory
I strongly recommend that every inherited evidence item carry metadata such as:
Evidence ID
Evidence Type
Evidence Value
Source Module
Source Assessment
Source User
Captured At
Validated At
Confidence
Evidence Status
Freshness
For example:
Evidence:
"Customer plans to implement solution in Q4."

Source:
Opportunity Qualification

Captured:
2026-08-20

Confidence:
High

Status:
Validated

Freshness:
7 days
This allows Pipeline Assessment AI to reason differently from:
Validated 7 days ago
versus:
Assumed 6 months ago

7. I3 — Qualification Intelligence
Opportunity Qualification will also produce AI-generated intelligence.
Examples:
•	Qualification rationale
•	Strengths
•	Weaknesses
•	Missing evidence
•	Qualification risks
•	Qualification confidence
•	AI explanation
•	Qualification recommendation
These should be inherited, but with a critical restriction:
AI-generated qualification reasoning is contextual intelligence, not authoritative evidence.
For example:
Opportunity Qualification AI:

"Strong customer need and clear buying intent."
Pipeline Assessment should be able to see this.
But it should not treat that sentence as evidence equivalent to an actual customer statement.
Instead:
Source Type:
AI Interpretation

Source:
Opportunity Qualification

Underlying Evidence:
Evidence IDs 104, 117, 129

Confidence:
High
This preserves traceability.

8. I4 — Qualification State
Pipeline Assessment should inherit the complete qualification state at the point of conversion.
For example:
Qualification Status
Qualification Score
Qualification Confidence
Qualification Decision
Qualification Date
Qualification Model Version
Qualification Risks
Qualification Gaps
Qualification Conditions
This establishes the starting point:
"This is what we knew when the opportunity entered the pipeline."
That becomes extremely important for historical analysis.

9. Mapping Inherited Data into PADF
The inheritance framework should explicitly map upstream information to the eight PADF dimensions.
PADF Dimension	Potential Inherited Information
PA1 Customer Value & Urgency	Business problem, pain, impact, strategic initiative, urgency, expected outcomes
PA2 Buying Center & Influence	Known stakeholders, champion, decision maker, relationships
PA3 Buying Process & Decision Control	Buying process, decision criteria, timeline, procurement information
PA4 Solution & Value Proposition	Requirements, solution need, initial solution fit, technical context
PA5 Competitive Position	Known competitors, incumbent, alternatives, status quo information
PA6 Commercial & Deal Structure	Budget, estimated value, pricing context, procurement information
PA7 Sales Execution & Deal Readiness	Qualification activities, meetings, POC/evaluation information, internal readiness
PA8 Momentum, Risk & Closeability	Qualification risks, engagement history, timeline, known blockers, qualification confidence
But there is an important distinction:
The inherited information does not necessarily constitute a complete assessment of the dimension.
For example:
PA2 Buying Center & Influence

Inherited:
Economic buyer identified
Champion identified

Current Assessment:
Economic buyer engagement = weak
Champion influence = moderate
Stakeholder coverage = incomplete
Therefore, inherited information becomes baseline evidence, not the final PA2 assessment.

10. Inheritance Priority
I recommend the following hierarchy when Pipeline Assessment reasons over data:
Current Verified Evidence
        ↑
Recent Pipeline Assessment Evidence
        ↑
Inherited Qualification Evidence
        ↑
Historical Evidence
        ↑
AI Interpretation
        ↑
Assumption / Unknown
In other words:
Current evidence should normally override historical evidence when the two conflict.
For example:
Opportunity Qualification:
Champion = Strong

Three months later:

New evidence:
Champion transferred to another business unit.
Pipeline Assessment should not continue using:
"Strong Champion"
as the current state.
Instead:
Historical State:
Strong Champion

Current State:
Champion continuity at risk

Assessment Impact:
PA2 ↓
Risk ↑
Win Probability ↓

11. The "Inherited → Revalidated → Superseded" Lifecycle
This is another element I would freeze.
Inherited data should have a lifecycle:
INHERITED
    │
    ▼
CURRENT / REVALIDATED
    │
    ├───────────────┐
    ▼               ▼
SUPERSEDED       INVALIDATED
    │
    ▼
Historical Record
For example:
Champion identified
       │
       ▼
Inherited
       │
       ▼
Confirmed in customer meeting
       │
       ▼
Revalidated
       │
       ▼
Champion leaves project
       │
       ▼
Superseded
The system should never delete the original evidence.
This preserves the evolution of the opportunity.

12. What Should NOT Be Inherited as Current State
This is equally important.
Pipeline Assessment should not automatically inherit the following as current truth:
•	Old win probability
•	Old pipeline health
•	Old competitive position
•	Old stakeholder strength
•	Old momentum
•	Old closeability
•	Old sales execution score
If Opportunity Qualification happens to have produced such indicators, they should be stored as historical qualification-state information, not as the current Pipeline Assessment.
For example:
Qualification Confidence: 89%
is meaningful.
But:
Win Probability: 89%
should not be inherited because win probability belongs to Pipeline Assessment, not Opportunity Qualification.

13. Initial Pipeline Assessment State
When the opportunity enters Pipeline Assessment, RevOS should construct:
Initial Pipeline Intelligence State
Opportunity Context
        +
Inherited Evidence
        +
Qualification Intelligence
        +
Qualification State
        +
New Pipeline Evidence
        ↓
Initial Pipeline Assessment
This creates the Pipeline Assessment Baseline Snapshot.
I would make this snapshot mandatory.
It represents:
The state of the opportunity at the moment it entered the Pipeline Assessment lifecycle.

14. Initial Assessment Baseline
The baseline should contain:
Pipeline Assessment Baseline
────────────────────────────────

Opportunity Context

Inherited Evidence

Evidence Provenance

Qualification Decision

Qualification Confidence

Qualification Strengths

Qualification Risks

Qualification Gaps

Initial PADF Dimension State

Initial Win Probability

Assessment Confidence

Initial Win Drivers

Initial Win Barriers

Initial Recommended Actions

Baseline Timestamp
This gives us the starting point for the entire future evolution model.

15. Data Inheritance and Historical Evolution
The complete relationship becomes:
Opportunity Qualification
        │
        │
        ▼
Qualification Intelligence
        │
        ▼
┌─────────────────────────────┐
│ Pipeline Assessment Baseline│
└──────────────┬──────────────┘
               │
               ▼
       New Evidence/Event
               │
               ▼
        Reassessment
               │
               ▼
       New Snapshot
               │
               ▼
       New Evidence/Event
               │
               ▼
        Reassessment
               │
               ▼
             ...
               │
               ▼
       Closed Won / Lost
This means the system can eventually answer:
"How did this opportunity get from qualification to Closed Won?"
and:
"What evidence and actions changed its trajectory?"

16. Data Inheritance vs Data Ownership
I would also freeze an important ownership rule.
Opportunity Qualification owns:
•	Qualification evidence
•	Qualification decision
•	Qualification score
•	Qualification reasoning
•	Qualification gaps
•	Qualification risks
Pipeline Assessment owns:
•	Current win probability
•	Current assessment
•	Current pipeline health
•	Current win drivers
•	Current win barriers
•	Current risks
•	Winning strategy
•	Recommended actions
•	Assessment history
•	Pipeline evolution
Therefore:
Pipeline Assessment can reference upstream qualification intelligence but should never rewrite the historical Opportunity Qualification record.

17. Final PADIF v1.0
I would now formally freeze the framework as:
Pipeline Assessment Data Inheritance Framework v1.0
Purpose:
Define the data and intelligence inherited from Opportunity Qualification into Pipeline Assessment and establish how that inherited information becomes the baseline for continuous opportunity assessment.
Four inheritance categories
I1 — Opportunity Context
Stable contextual and configuration data.
I2 — Validated Qualification Evidence
Evidence that established the opportunity's qualification.
I3 — Qualification Intelligence
AI-generated interpretations, strengths, gaps, and risks.
I4 — Qualification State
Qualification decision, score, confidence, timestamp, and model state.
Core inheritance rules
1.	Qualified Opportunity is the entry point.
2.	Opportunity Qualification Intelligence Package is the initial input.
3.	Inherited evidence retains complete provenance.
4.	Inherited evidence becomes baseline evidence, not permanent truth.
5.	Current verified evidence takes precedence over historical evidence.
6.	AI interpretation never replaces underlying evidence.
7.	Qualification scores and decisions remain historically immutable.
8.	Pipeline Assessment owns all downstream winability and execution intelligence.
9.	Every opportunity receives an Initial Pipeline Assessment Baseline Snapshot.
10.	New evidence and events continuously update the assessment.
11.	Historical states are preserved rather than overwritten.
12.	The inheritance framework is universal across all six revenue motions and industries.
The central design principle
Opportunity Qualification tells Pipeline Assessment what we knew when the opportunity entered the pipeline. Pipeline Assessment continuously determines what is true now, how likely we are to win, what has changed, and what we should do next.
With PADF v1.0 + PADIF v1.0 now established, we have the two most important foundations for the next design stage:
Opportunity Qualification
          │
          ▼
   PADIF v1.0
   "What comes in?"
          │
          ▼
   Qualified Opportunity
          │
          ▼
   PADF v1.0
   "What do we assess?"
          │
          ▼
 Pipeline Assessment Engine
          │
          ▼
 Assess → Explain → Predict
 → Recommend → Act → Record → Reassess
