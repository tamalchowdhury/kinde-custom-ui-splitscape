"use server";

import { Widget } from "../../../../components/widget";
import { DefaultLayout } from "../../../../layouts/default";
import { Root } from "../../../../root";
import { getKindeNonce, type KindePageEvent } from "@kinde/infrastructure";
import React from "react";
import { renderToString } from "react-dom/server.browser";

const DefaultPage: React.FC<KindePageEvent> = ({ context, request }) => {
  const { connections, actions, session } = context;
  const available = connections?.available ?? [];
  const switchAction = actions?.switchConnection;
  const psid = session?.pipelineStepId;

  // #region agent log
  const debugPayload = {
    sessionId: "8e6b2b",
    runId: "post-fix",
    location: "page.tsx:ssr",
    message: "connection switcher SSR context",
    hypothesisId: "A",
    data: {
      availableCount: available.length,
      hasSwitchAction: switchAction != null,
      hasPsid: psid != null && String(psid).length > 0,
      switchActionKeys:
        switchAction && typeof switchAction === "object"
          ? Object.keys(switchAction as object)
          : [],
      hasActionUrl: !!(
        switchAction &&
        typeof switchAction === "object" &&
        (switchAction as { actionUrl?: string }).actionUrl
      ),
      actionUrlPreview:
        switchAction && typeof switchAction === "object"
          ? String(
              (switchAction as { actionUrl?: string }).actionUrl ?? "",
            ).slice(0, 120)
          : null,
    },
  };
  // #endregion

  return (
    <Root context={context} request={request}>
      <DefaultLayout>
        <Widget
          heading={context.widget.content.heading}
          description={context.widget.content.description}
        />
        <div data-debug-switcher="true">
          <h1>Choose how to continue</h1>
          <ul>
            {available.map((connection) => (
              <li key={connection.id}>
                <button
                  type="button"
                  data-kinde-change-connection-button="true"
                  data-kinde-change-connection-id={connection.id}
                  data-kinde-change-connection-psid={psid}
                  data-kinde-change-connection-action={JSON.stringify(
                    switchAction,
                  )}
                >
                  Continue with {connection.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* #region agent log */}
        <pre
          id="agent-debug-panel"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: "40vh",
            overflow: "auto",
            zIndex: 99999,
            margin: 0,
            padding: "12px",
            background: "#111",
            color: "#0f0",
            fontSize: "11px",
            fontFamily: "ui-monospace, Menlo, monospace",
            whiteSpace: "pre-wrap",
            borderTop: "2px solid #0f0",
          }}
        >
          {JSON.stringify(debugPayload, null, 2)}
        </pre>
        <script
          nonce={getKindeNonce()}
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  var ENDPOINT = "http://127.0.0.1:7288/ingest/03c6ae6d-b914-4c84-bf6c-1019c3a71528";
  var SID = "8e6b2b";
  var lines = [];
  var panel = document.getElementById("agent-debug-panel");

  function show() {
    if (panel) panel.textContent = lines.map(function (l) { return JSON.stringify(l); }).join("\\n");
  }

  function send(payload) {
    var entry = Object.assign({ sessionId: SID, timestamp: Date.now() }, payload);
    lines.push(entry);
    show();
    try {
      fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "X-Debug-Session-Id": SID
        },
        body: JSON.stringify(entry),
        mode: "no-cors",
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  send(${JSON.stringify(debugPayload)});

  var anyScriptHasChangeConnection = Array.prototype.slice.call(document.scripts).some(function (s) {
    return !s.src && (s.textContent || "").indexOf("change-connection") !== -1;
  });
  send({
    runId: "post-fix",
    hypothesisId: "F",
    location: "page.tsx:client-load",
    message: "script capability check",
    data: {
      anyInlineHasChangeConnection: anyScriptHasChangeConnection,
      mainJsLoaded: Array.prototype.slice.call(document.scripts).some(function (s) {
        return s.src && s.src.indexOf("/end_user_ui/assets/js/main.js") !== -1;
      })
    }
  });

  function fieldValuesFromButton(btn) {
    return {
      connectionId: btn.getAttribute("data-kinde-change-connection-id") || "",
      psid: btn.getAttribute("data-kinde-change-connection-psid") || "",
      authIntent: btn.getAttribute("data-kinde-change-connection-auth-intent") || "sign_in",
      loginHint: btn.getAttribute("data-kinde-change-connection-login-hint") || "",
      isMarketingOptIn: "",
      isClickWrapAccepted: ""
    };
  }

  function submitSwitchConnection(btn) {
    var actionRaw = btn.getAttribute("data-kinde-change-connection-action");
    var action;
    try {
      action = JSON.parse(actionRaw);
    } catch (err) {
      send({
        runId: "post-fix",
        hypothesisId: "F",
        location: "page.tsx:switch-parse-error",
        message: "failed to parse switch action",
        data: { error: String(err && err.message ? err.message : err) }
      });
      return false;
    }

    if (!action || !action.actionUrl || !action.fields) {
      send({
        runId: "post-fix",
        hypothesisId: "F",
        location: "page.tsx:switch-invalid-action",
        message: "switch action missing actionUrl/fields",
        data: { actionKeys: action ? Object.keys(action) : [] }
      });
      return false;
    }

    var values = fieldValuesFromButton(btn);
    var body = new FormData();
    var fieldNames = [];

    Object.keys(action.fields).forEach(function (logicalKey) {
      var inputName = action.fields[logicalKey];
      if (!inputName) return;
      var value = Object.prototype.hasOwnProperty.call(values, logicalKey)
        ? String(values[logicalKey] == null ? "" : values[logicalKey])
        : "";
      body.append(inputName, value);
      fieldNames.push(inputName);
    });

    var csrfEl = document.head.querySelector("[name=csrf-token][content]");
    var csrf = csrfEl && csrfEl.content ? csrfEl.content : "";

    send({
      runId: "post-fix",
      hypothesisId: "G",
      location: "page.tsx:switch-submit",
      message: "submitting switch connection via roast fetch",
      data: {
        id: values.connectionId,
        psid: values.psid,
        authIntent: values.authIntent,
        actionUrlPreview: String(action.actionUrl).slice(0, 120),
        method: action.method || "POST",
        fieldNames: fieldNames,
        hasCsrf: !!csrf,
        hrefBefore: location.href
      }
    });

    fetch(action.actionUrl, {
      method: action.method || "POST",
      body: body,
      redirect: "manual",
      credentials: "same-origin",
      headers: {
        Accept: "roast/mixed",
        "X-Requested-With": "XMLHttpRequest",
        "X-Client-Time": String(Date.now()),
        ...(csrf ? { "X-CSRF-Token": csrf } : {})
      }
    }).then(function (res) {
      var loc = res.headers.get("Location");
      var intra = res.headers.get("x-intra-redirect");
      send({
        runId: "post-fix",
        hypothesisId: "G",
        location: "page.tsx:switch-response",
        message: "switch connection response",
        data: {
          status: res.status,
          type: res.type,
          ok: res.ok,
          locationHeader: loc ? String(loc).slice(0, 160) : null,
          intraRedirect: intra ? String(intra).slice(0, 160) : null,
          hrefAfter: location.href
        }
      });

      if (loc && !intra) {
        window.location.assign(loc);
        return;
      }
      if (intra) {
        window.location.assign(intra);
        return;
      }
      if (res.status >= 300 && res.status < 400 && loc) {
        window.location.assign(loc);
      }
    }).catch(function (err) {
      send({
        runId: "post-fix",
        hypothesisId: "G",
        location: "page.tsx:switch-fetch-error",
        message: "switch connection fetch failed",
        data: { error: String(err && err.message ? err.message : err) }
      });
    });

    return true;
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest
      ? ev.target.closest("[data-kinde-change-connection-button]")
      : null;
    if (!btn) return;

    send({
      runId: "post-fix",
      hypothesisId: "C",
      location: "page.tsx:click-capture",
      message: "connection button click captured",
      data: {
        id: btn.getAttribute("data-kinde-change-connection-id"),
        psid: btn.getAttribute("data-kinde-change-connection-psid"),
        isTrusted: ev.isTrusted
      }
    });

    ev.preventDefault();
    ev.stopPropagation();
    submitSwitchConnection(btn);
  }, true);
})();
`,
          }}
        />
        {/* #endregion */}
      </DefaultLayout>
    </Root>
  );
};

// Page Component
export default async function Page(event: KindePageEvent): Promise<string> {
  const page = await DefaultPage(event);
  return renderToString(page);
}
