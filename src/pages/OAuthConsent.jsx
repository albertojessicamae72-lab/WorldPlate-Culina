import { useEffect, useState } from "react";
import { appParams } from "@/lib/app-params";
import AuthLayout from "@/components/AuthLayout";

/** @typedef {{ name: string, title?: string, description?: string }} ConsentTool */
/** @typedef {{ client_name?: string, app_name?: string, login_path?: string, authenticated?: boolean, tools?: ConsentTool[] }} ConsentInfo */

/** @param {{ children?: import("react").ReactNode, className?: string, variant?: string, disabled?: boolean, onClick?: () => void }} props */
const Button = ({ children, className, disabled, onClick }) => (
  <button type="button" className={className} disabled={disabled} onClick={onClick}>
    {children}
  </button>
);

/** @param {{ className?: string }} props */
const ShieldCheck = ({ className }) => (
  <span className={className} aria-hidden="true">🛡️</span>
);

/** @param {{ className?: string }} props */
const Loader2 = ({ className }) => (
  <span className={className} aria-hidden="true">⟳</span>
);

// App-side OAuth consent page for the app's MCP server. The platform redirects
// AI clients here (see base44/mcp/config.json `consent_path`) with an opaque
// `ctx` handle — the authorization request itself lives on the server. This page
// gates on the app-user session, fetches the display info for that handle, shows
// the categories of access being granted, and posts the approve/deny decision.
// Do not change the fetch calls, headers, or the `ctx` handle handling — styling
// and copy are safe to edit.
export default function OAuthConsent() {
  const ctx = new URLSearchParams(window.location.search).get("ctx");
  const [info, setInfo] = useState(/** @type {ConsentInfo | null} */ (null));
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decided, setDecided] = useState("");
  const [error, setError] = useState("");
  const [reconnect, setReconnect] = useState("");

  useEffect(() => {
    (async () => {
      let redirecting = false;
      try {
        if (!ctx) {
          setError("This authorization link is invalid or has expired.");
          return;
        }

        /** @type {Record<string, string>} */
        const infoHeaders = {};
        if (appParams.token) infoHeaders.Authorization = "Bearer " + appParams.token;

        const res = await fetch(
          `/api/apps/${appParams.appId}/mcp/consent-info?handle=${encodeURIComponent(ctx)}`,
          { credentials: "include", headers: infoHeaders },
        );

        if (!res.ok) {
          setError("This authorization link is invalid or has expired.");
          return;
        }

        const data = await res.json();

        if (!data.authenticated) {
          const returnTo = window.location.pathname + "?ctx=" + encodeURIComponent(ctx);
          const encoded = encodeURIComponent(returnTo);
          redirecting = true;
          window.location.href =
            (data.login_path || "/login") + "?returnTo=" + encoded + "&from_url=" + encoded;
          return;
        }

        setInfo(data);
      } catch {
        setError("Could not load this authorization request. Please try again.");
      } finally {
        if (!redirecting) setChecking(false);
      }
    })();
  }, [ctx]);

  /** @param {"approve" | "deny"} action */
  const respond = async (action) => {
    setSubmitting(true);
    setError("");

    try {
      /** @type {Record<string, string>} */
      const headers = { "Content-Type": "application/json" };
      if (appParams.token) headers.Authorization = "Bearer " + appParams.token;

      const res = await fetch(`/api/apps/${appParams.appId}/mcp/authorize-grant`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ ctx, action }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          const returnTo = window.location.pathname + "?ctx=" + encodeURIComponent(ctx || "");
          const encoded = encodeURIComponent(returnTo);
          window.location.href =
            ((info && info.login_path) || "/login") + "?returnTo=" + encoded + "&from_url=" + encoded;
          return;
        }

        if ([400, 403, 404, 409].includes(res.status)) {
          let detail = "";
          try {
            detail = (await res.json()).detail;
          } catch {
            // Keep the default message.
          }

          setReconnect(
            detail ||
              "This authorization can no longer be completed. Reconnect from your AI client to try again.",
          );
          setSubmitting(false);
          return;
        }

        throw new Error("Could not complete authorization. Please try again.");
      }

      const data = await res.json();
      window.location.href = data.redirect_url;

      if (!/^https?:/i.test(data.redirect_url)) {
        setDecided(action);
        setSubmitting(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete authorization. Please try again.");
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <AuthLayout icon={ShieldCheck} title="Authorize access" subtitle="" footer={null}>
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading…
        </div>
      </AuthLayout>
    );
  }

  const client = info?.client_name || "An AI client";
  const appName = info?.app_name || "this app";

  if (decided) {
    return (
      <AuthLayout
        icon={ShieldCheck}
        title={decided === "approve" ? "Access granted" : "Access denied"}
        subtitle={`You can return to ${client} and close this window.`}
        footer={null}
      >
        {null}
      </AuthLayout>
    );
  }

  if (reconnect) {
    return (
      <AuthLayout icon={ShieldCheck} title="Reconnect required" subtitle="" footer={null}>
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {reconnect}
        </div>
      </AuthLayout>
    );
  }

  if (error && !info) {
    return (
      <AuthLayout icon={ShieldCheck} title="Authorize access" subtitle="" footer={null}>
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      </AuthLayout>
    );
  }

  const tools = Array.isArray(info?.tools) ? info.tools : [];

  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Authorize access"
      subtitle={`${client} wants to access ${appName} on your behalf`}
      footer={null}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <p className="mb-2 text-sm font-medium text-foreground">
        {tools.length ? `It will be able to use these tools in ${appName}:` : "No tools requested"}
      </p>

      {tools.length > 0 && (
        <ul className="mb-6 space-y-2 text-sm">
          {tools.map((tool) => (
            <li key={tool.name} className="flex flex-col">
              <span className="font-medium text-foreground">{tool.title || tool.name}</span>
              {tool.description && (
                <span className="text-muted-foreground">{tool.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="h-12 flex-1 font-medium"
          disabled={submitting}
          onClick={() => respond("deny")}
        >
          Deny
        </Button>
        <Button
          className="h-12 flex-1 font-medium"
          disabled={submitting}
          onClick={() => respond("approve")}
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Approve
        </Button>
      </div>
    </AuthLayout>
  );
}