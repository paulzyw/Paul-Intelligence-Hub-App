/**
 * Supabase Edge Function: content-publishing-orchestrator
 * Consolidated Edge Function for RevOS Unified Content SSG Architecture V1.0
 * 
 * Provides 3 Core Internal Modules:
 * 1. Publication and Build Orchestration (trigger_build)
 * 2. Build and Deployment Status Management (report_build_status, get_latest_status)
 * 3. Content Validation and Publication Integrity (validate_publication)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface OrchestratorRequest {
  action: "trigger_build" | "report_build_status" | "validate_publication" | "get_latest_status";
  payload?: any;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
    const githubToken = Deno.env.get("GITHUB_DISPATCH_TOKEN") || Deno.env.get("GITHUB_TOKEN") || "";
    const githubOwner = Deno.env.get("GITHUB_REPO_OWNER") || "paulzyw02";
    const githubRepo = Deno.env.get("GITHUB_REPO_NAME") || "digital-intelligence-hub";

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: OrchestratorRequest = await req.json().catch(() => ({ action: "" }));
    const { action, payload } = body;

    // =========================================================================
    // MODULE 3: Content Validation & Publication Integrity
    // =========================================================================
    if (action === "validate_publication") {
      const content = payload?.content || {};
      const errors: string[] = [];

      if (!content.title || content.title.trim().length === 0) {
        errors.push("Content title is required.");
      }
      if (!content.slug || content.slug.trim().length === 0) {
        errors.push("Slug is required.");
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(content.slug)) {
        errors.push("Slug must contain only lowercase letters, numbers, and hyphens.");
      }
      if (!content.content || content.content.trim().length === 0) {
        errors.push("Article body content cannot be empty.");
      }
      if (content.content_type && !["post", "insight"].includes(content.content_type)) {
        errors.push("content_type must be either 'post' or 'insight'.");
      }

      // Check slug uniqueness
      if (content.slug) {
        let query = supabase.from("posts").select("id").eq("slug", content.slug);
        if (content.id) {
          query = query.neq("id", content.id);
        }
        const { data: existing } = await query;
        if (existing && existing.length > 0) {
          errors.push(`The slug '${content.slug}' is already in use by another article.`);
        }
      }

      return new Response(
        JSON.stringify({
          valid: errors.length === 0,
          errors,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // MODULE 1: Publication and Build Orchestration
    // =========================================================================
    if (action === "trigger_build") {
      const { content_id, event_type = "publish" } = payload || {};
      const buildRequestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 1. Log build request into Supabase (if table exists)
      try {
        await supabase.from("content_publishing_logs").insert([
          {
            build_request_id: buildRequestId,
            event_type,
            content_id: content_id || null,
            status: "requested",
            details: { initiated_by: "cms", timestamp: new Date().toISOString() },
          },
        ]);
      } catch (logErr) {
        console.warn("[Orchestrator] Warning logging to content_publishing_logs:", logErr);
      }

      // 2. Trigger GitHub Actions via Repository Dispatch API
      if (githubToken) {
        const dispatchUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/dispatches`;
        const ghResponse = await fetch(dispatchUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "RevOS-Content-Publishing-Orchestrator",
          },
          body: JSON.stringify({
            event_type: "rebuild-revos-content",
            client_payload: {
              build_request_id: buildRequestId,
              event_type,
              content_id,
            },
          }),
        });

        if (!ghResponse.ok) {
          const ghErrText = await ghResponse.text();
          console.error("[Orchestrator] GitHub Dispatch Error:", ghErrText);
          
          try {
            await supabase
              .from("content_publishing_logs")
              .update({ status: "build_failed", error_message: `GitHub Dispatch failed: ${ghResponse.statusText}` })
              .eq("build_request_id", buildRequestId);
          } catch (_) {}

          return new Response(
            JSON.stringify({
              success: false,
              build_request_id: buildRequestId,
              error: `GitHub Dispatch API responded with ${ghResponse.status}: ${ghErrText}`,
            }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update status to 'building'
        try {
          await supabase
            .from("content_publishing_logs")
            .update({ status: "building", updated_at: new Date().toISOString() })
            .eq("build_request_id", buildRequestId);
        } catch (_) {}

        return new Response(
          JSON.stringify({
            success: true,
            build_request_id: buildRequestId,
            message: "Production build successfully dispatched to GitHub Actions.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // In local/sandbox preview where GITHUB_TOKEN is not configured
        console.log("[Orchestrator] GITHUB_DISPATCH_TOKEN not set. Simulating trigger.");
        return new Response(
          JSON.stringify({
            success: true,
            simulated: true,
            build_request_id: buildRequestId,
            message: "Build request registered. Set GITHUB_DISPATCH_TOKEN in Supabase secrets for automated production dispatch.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // =========================================================================
    // MODULE 2: Build and Deployment Status Management
    // =========================================================================
    if (action === "report_build_status") {
      const { build_request_id, status, error_message, details } = payload || {};

      if (!build_request_id || !status) {
        return new Response(
          JSON.stringify({ error: "build_request_id and status are required." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (error_message) updateData.error_message = error_message;
      if (details) updateData.details = details;

      const { data, error: updateError } = await supabase
        .from("content_publishing_logs")
        .update(updateData)
        .eq("build_request_id", build_request_id)
        .select();

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, updated: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_latest_status") {
      const { data, error: fetchError } = await supabase
        .from("content_publishing_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        return new Response(
          JSON.stringify({ status: "idle", error: fetchError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ latest_build: data || null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action '${action}'` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal orchestrator error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
