# RevOS: Revenue Operating System - Architecture & Foundation

RevOS is an AI-native commercial intelligence platform integrated within the existing ecosystem. This document outlines the foundational architecture and sandbox development strategy.

## 1. Core Principles
- **AI-Native First:** Every module treats AI reasoning as a primary citizen, not an add-on.
- **Unified Intelligence Layer:** Data from GTMOS, Leads, and Pipeline flows into a shared intelligence engine.
- **Architectural Isolation:** Code resides in `src/apps/revos/` to avoid polluting the main website codebase.
- **Shared Presentation:** Leverages the site-wide `Layout`, `Navbar`, and `Footer`.

## 2. Directory Structure (The Sandbox)
```text
src/apps/revos/
├── components/       # RevOS-specific UI components
├── context/          # RevOS state management (RevOSContext)
├── hooks/            # RevOS business logic hooks
├── pages/            # RevOS main views (Dashboard, GTMOS, etc.)
│   ├── layout/       # RevOS-specific internal layout (Sidebar)
│   └── modules/      # Page components for GTMOS, Leads, Pipeline
├── services/         # API & AI service wrappers
├── store/            # Persistence and global state
└── types/            # TypeScript definitions for RevOS
```

## 3. Platform Hierarchy Implementation
- **Layer 1 (Input):** Structured forms and voice-to-text capture in `modules/`.
- **Layer 2 (Structuring):** Server-side Gemini 3.1 Flash Lite prompts to normalize raw input.
- **Layer 3 (Execution):** Real-time tracking boards utilizing Supabase subscriptions.
- **Layer 4-7 (Intelligence Engine):** Specialized Gemini agents that analyze cross-module patterns and provide proactive recommendations.

## 4. Permission & Role Mapping (RBAC)
We will implement an `entitlements` system in Supabase.
- **Levels:** Guest, Free, Paid, Enterprise, Workspace Admin, Enterprise Exec, RevOS Admin, Super Admin.
- **Enforcement:** Middleware checks on RevOS routes and RLS (Row Level Security) on the database.

## 5. Monetization Strategy (Prepaid License)
- **Currency Support:** Detection of IP region for CNY/USD switching.
- **Entitlement Checks:** Verification of active license before allowing AI-intensive reasoning operations.

## 6. Development Phasing
1. **Foundation (Current):** Setup RevOS Shell, Authentication integration, and Base Schema.
2. **GTMOS:** Implementation of strategic input and AI structuring.
3. **Leads Qualification:** Pattern recognition for opportunity scoring.
4. **Pipeline Orchestration:** Execution tracking and win/loss attribution.
