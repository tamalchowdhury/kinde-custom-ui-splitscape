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
    var form = document.createElement("form");
    form.method = (action.method || "POST").toUpperCase();
    form.action = action.actionUrl;
    form.style.display = "none";

    Object.keys(action.fields).forEach(function (logicalKey) {
      var inputName = action.fields[logicalKey];
      if (!inputName) return;
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = inputName;
      input.value = Object.prototype.hasOwnProperty.call(values, logicalKey)
        ? String(values[logicalKey] == null ? "" : values[logicalKey])
        : "";
      form.appendChild(input);
    });

    var csrf = document.head.querySelector("[name=csrf-token][content]");
    if (csrf && csrf.content) {
      var csrfInput = document.createElement("input");
      csrfInput.type = "hidden";
      csrfInput.name = "authenticity_token";
      csrfInput.value = csrf.content;
      form.appendChild(csrfInput);
    }

    document.body.appendChild(form);

    send({
      runId: "post-fix",
      hypothesisId: "E",
      location: "page.tsx:switch-submit",
      message: "submitting switch connection form",
      data: {
        id: values.connectionId,
        psid: values.psid,
        authIntent: values.authIntent,
        actionUrlPreview: String(action.actionUrl).slice(0, 120),
        method: form.method,
        fieldNames: Array.prototype.slice.call(form.elements).map(function (el) { return el.name; }),
        hrefBefore: location.href
      }
    });

    form.submit();
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
