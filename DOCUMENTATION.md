# Paul Wang Portfolio Website - Documentation

## 1. Project Overview
This is a professional portfolio and insights platform for Paul Wang, a Data-Driven Business Growth Leader. The website showcases professional experience, leadership philosophy, and provides a platform for sharing strategic insights through a blog-style interface.

## 2. Architecture
The application follows a modern **Serverless Full-Stack** architecture:
- **Frontend**: React 19 SPA (Single Page Application) built with Vite.
- **Styling**: Tailwind CSS 4.0 for utility-first styling and responsive design.
- **Animations**: Motion (formerly Framer Motion) for smooth UI transitions and interactions.
- **Backend-as-a-Service (BaaS)**: Supabase for database (PostgreSQL), authentication, and Edge Functions.
- **Edge Functions**: Deno-based serverless functions used for third-party integrations (MailerLite).
- **External Services**: 
  - **EmailJS**: For handling contact form submissions directly from the client.
  - **MailerLite**: For newsletter subscription management and automated email workflows.

## 3. Project File Structure
```text
├── .github/workflows/    # CI/CD pipelines (GitHub Actions)
├── public/               # Static assets (images, favicon)
├── src/
│   ├── components/       # Reusable UI components (MeteorBackground, TrustBar, etc.)
│   ├── lib/              # Utility libraries and configurations (supabase.ts, utils.ts)
│   ├── pages/            # Main page components (Home, Insights, Contact, PostDetail)
│   ├── App.tsx           # Main application routing and layout
│   ├── index.css         # Global styles and Tailwind imports
│   └── main.tsx          # Application entry point
├── wasmer.toml           # Wasmer Edge deployment configuration
├── package.json          # Project dependencies and scripts
└── DOCUMENTATION.md      # This file
```

## 4. Supporting Libraries
- **React 19**: UI library.
- **React Router Dom**: Client-side routing.
- **Supabase JS**: Client for interacting with Supabase database and functions.
- **Lucide React**: Icon library.
- **Motion**: Animation engine.
- **EmailJS**: Client-side email service.
- **Tailwind CSS**: Utility-first CSS framework.

## 5. External Platforms & API Keys
The following platforms are required for full functionality. Keys are managed via environment variables (`.env` locally, GitHub Secrets for production).

| Platform | Purpose | Required Keys |
| :--- | :--- | :--- |
| **Supabase** | Database & Edge Functions | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| **EmailJS** | Contact Form | `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY` |
| **MailerLite** | Newsletter | `MAILERLITE_API_KEY` (Stored in Supabase Secrets) |
| **Wasmer** | Hosting | `WASMER_TOKEN` (Stored in GitHub Secrets) |

## 6. Features & Functions
- **Dynamic Insights Feed**: Fetches blog posts from Supabase with category filtering and search.
- **Newsletter Subscription**: Integrated with MailerLite via Supabase Edge Functions.
- **Automated Welcome Email**: Triggered via MailerLite workflows when a user joins the "Website Insights" group.
- **Contact Form**: Direct email delivery via EmailJS.
- **Responsive Design**: Optimized for mobile, tablet, and desktop.
- **Interactive Metrics**: Animated counters for professional impact stats.

## 7. Major Troubleshooting
### Issue: "Failed to fetch" on Subscription
- **Cause**: Missing or incorrect GitHub Secrets during the build process, or CORS issues in Edge Functions.
- **Solution**: 
  1. Verified GitHub Secrets match `VITE_` prefix.
  2. Updated Edge Function to include proper CORS headers.
  3. Added fallback URLs in `supabase.ts` for build resilience.

### Issue: Welcome Email Not Triggering
- **Cause**: MailerLite automations require a subscriber to join a *specific group* to trigger, but the initial API call only added them to the general list.
- **Solution**: Updated the Edge Function to use the group-specific endpoint: `https://api.mailerlite.com/api/v2/groups/{group_id}/subscribers`.

## 8. Hosting & Deployment
- **Source Control**: GitHub.
- **CI/CD**: GitHub Actions (`deploy.yml`) triggers on every push to `main`.
- **Hosting**: **Wasmer Edge**. The build process generates a static `dist` folder which is then deployed to Wasmer's global edge network.

## 9. Maintenance & Future Updates
- **Content Management**: New posts and categories can be added directly via the Supabase Dashboard.
- **RSS Feed**: An RSS feed is available at `/functions/v1/rss-feed` for integration with MailerLite campaigns.
- **Dependencies**: Regularly run `npm update` to keep libraries secure.
- **Backups**: Supabase provides automatic daily backups of the PostgreSQL database.
