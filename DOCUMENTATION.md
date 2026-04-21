# Paul Wang Portfolio Website - Documentation

## 1. Project Overview
This is a high-end professional portfolio and industrial insights platform for Paul Wang, a Data-Driven Business Growth Leader. The website showcases leadership philosophy, professional impact metrics, and intensive industry research, providing a bridge between internal transformation and external customer value.

## 2. Architecture
The application uses a modern **Serverless Edge-Optimized** architecture:
- **Frontend**: React 19 SPA built with Vite and TypeScript.
- **Styling**: Tailwind CSS 4.0 for utility-first styling with native CSS variable integration.
- **Animations**: `motion/react` (Framer Motion) for sophisticated UI transitions and storytelling-driven reveals.
- **Backend-as-a-Service (BaaS)**: Supabase for database (PostgreSQL), real-time subscriptions, and Edge Functions.
- **Edge Functions**: Deno-based serverless functions for third-party service bridging.
- **External Services**: 
  - **EmailJS**: Direct client-side handling of contact inquiries.
  - **MailerLite**: Automated newsletter management via Supabase Edge Function relays.

## 3. Project File Structure
```text
├── public/               # Static assets & favicon
├── src/
│   ├── components/       # UI Components (MeteorBackground, TrustBar, MeteorCards, etc.)
│   ├── lib/              # Utility libraries (supabase.ts, utils.ts, charts.ts)
│   ├── pages/            
│   │   ├── Home.tsx      # Leadership philosophy & Career mapping
│   │   ├── Impact.tsx    # Interactive metrics & "Value Delivery Engine"
│   │   ├── Insights.tsx  # Thought leadership blog & Newsletter
│   │   ├── Research.tsx  # Industrial whitepapers & Reports
│   │   ├── About.tsx     # Leadership bio & Core values
│   │   └── Contact.tsx   # Direct inquiry portal
│   ├── index.css         # Tailwind 4.0 Core & Global animations
│   └── main.tsx          # App entry point
├── wasmer.toml           # Global Edge deployment config
└── DOCUMENTATION.md      # This file
```

## 4. Design & Animation System
The website employs a **Storytelling-Driven Motion System** to communicate complex industrial value:
- **Progressive Disclosure**: Content unfolds sequentially as the user scrolls, preventing information overload.
- **Directional Logic**: In the "Value Delivery" section, internal transformation (Employer) animates from the Left, while market impact (Customer) animates from the Right.
- **Viewport-Aware Metrics**: KPI numbers use a spring-based "CountUp" effect that triggers only when they enter the user's viewport.
- **Shimmer Effects**: Interactive elements (like the Core Value Engine) use background gradient shimmer keyframes to signify activity and status.
- **Theme Variables**: Leverages Tailwind 4.0's theme block in `index.css` for consistent palette management (e.g., `accent`, `ui-navy`, `savings-emerald`).

## 5. External Platforms & API Keys
Keys are managed via environment variables (`.env` locally, Supabase Secrets for cloud functions).

| Platform | Purpose | Key Variable |
| :--- | :--- | :--- |
| **Supabase** | DB & Functions | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| **EmailJS** | Contact Form | `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY` |
| **MailerLite**| Newsletter | `MAILERLITE_API_KEY` (Stored in Supabase Edge Secrets) |
| **Wasmer** | Hosting | `WASMER_TOKEN` (Managed via GitHub Actions) |

## 6. Features & Functions
- **Value Delivery Engine**: A visual map connecting Strategy, Systems, and Execution to measurable KPIs.
- **Research Repository**: A dedicated portal for industry reports and proprietary whitepapers managed via Supabase.
- **Dynamic Insights Feed**: Full blog functionality with search, category filtering, and featured articles.
- **Cross-Side Hover Synchronization**: Visual linking of internal capabilities to external results via synchronized UI state.
- **Newsletter Subscription**: Real-time validation and automation through MailerLite groups.

## 7. Major Troubleshooting & History
### Issue: Animation Logic Leak (Shadow Updates)
- **Fix**: Implemented strict `Variants` types and `any` casting for complex stagger logic to satisfy linter constraints while maintaining visual flow.

### Issue: Low Contrast on Floating Labels
- **Fix**: Redesigned the "Core Value Engine" label with high-contrast pure white iconography against a deep navy (`ui-navy`) background.

### Issue: Welcome Email Not Triggering
- **Fix**: Updated Edge Function to target MailerLite Group endpoints specifically to trigger automated onboarding workflows.

## 8. Maintenance
- **Domain Migration**: When changing domains, verify the new domain in MailerLite (DNS verification) and update the `APP_URL` in project secrets.
- **Database Schema**: Reference `SUPABASE_SCHEMA.sql` for table structures (subscribers, posts, reports, impact_projects).
- **Metric Refinement**: Value formatting logic is centralized near the top of the `Impact.tsx` page using the `formatCurrency` helper.
- **Backups**: Supabase provides automatic daily backups of the PostgreSQL database.
- **Development**: Run `npm run dev` to start the local development server on port 3000.
