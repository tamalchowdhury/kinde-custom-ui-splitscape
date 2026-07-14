"use server";

import { Widget } from "../../../../components/widget";
import { DefaultLayout } from "../../../../layouts/default";
import { Root } from "../../../../root";
import { type KindePageEvent } from "@kinde/infrastructure";
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
    runId: "pre-fix",
    location: "page.tsx:ssr",
    message: "connection switcher SSR context",
    hypothesisId: "A",
    timestamp: Date.now(),
    data: {
      availableCount: available.length,
      connectionIds: available.map((c) => ({
        id: c?.id ?? null,
        friendlyId: c?.friendlyId ?? null,
        name: c?.name ?? null,
      })),
      hasSwitchAction: switchAction != null,
      switchActionType: typeof switchAction,
      switchActionKeys:
        switchAction && typeof switchAction === "object"
          ? Object.keys(switchAction as object)
          : [],
      switchActionMethod:
        switchAction && typeof switchAction === "object"
          ? (switchAction as { method?: string }).method ?? null
          : null,
      hasActionUrl: !!(
        switchAction &&
        typeof switchAction === "object" &&
        (switchAction as { actionUrl?: string }).actionUrl
      ),
      hasPsid: psid != null && String(psid).length > 0,
      psidLength: psid != null ? String(psid).length : 0,
      stringifiedActionLength:
        switchAction != null ? JSON.stringify(switchAction).length : 0,
      stringifiedActionIsUndefined: JSON.stringify(switchAction) === undefined,
      nestedRootPresent: true,
      actionKeysOnContext: actions ? Object.keys(actions) : [],
      sessionKeys: session ? Object.keys(session) : [],
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
        <div data-kinde-root data-debug-switcher="true">
        <h1>Choose how to continue</h1>
        <ul>
          {available.map((connection) => (
            <li key={connection.id}>
              <button
                type="button"
                data-kinde-change-connection-button="true"
                data-kinde-change-connection-id={connection.id}
                data-kinde-change-connection-psid={psid}
                data-kinde-change-connection-action={JSON.stringify(switchAction)}
              >
                Continue with {connection.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* #region agent log */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function () {
  var ENDPOINT = "http://127.0.0.1:7288/ingest/03c6ae6d-b914-4c84-bf6c-1019c3a71528";
  var SID = "8e6b2b";
  function send(payload) {
    try {
      fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": SID
        },
        body: JSON.stringify(Object.assign({ sessionId: SID, timestamp: Date.now() }, payload))
      }).catch(function () {});
    } catch (e) {}
  }

  var ssr = ${JSON.stringify(debugPayload)};
  send(ssr);

  function inspectButtons() {
    var buttons = Array.prototype.slice.call(
      document.querySelectorAll("[data-kinde-change-connection-button]")
    );
    var roots = Array.prototype.slice.call(
      document.querySelectorAll("[data-kinde-root]")
    ).map(function (el) {
      return {
        hasTrue: el.getAttribute("data-kinde-root"),
        isDebugSwitcher: el.getAttribute("data-debug-switcher") === "true",
        buttonCount: el.querySelectorAll("[data-kinde-change-connection-button]").length,
        childTagNames: Array.prototype.slice.call(el.children).map(function (c) { return c.tagName; })
      };
    });

    var buttonSnapshots = buttons.map(function (btn, i) {
      var actionRaw = btn.getAttribute("data-kinde-change-connection-action");
      var actionParsedOk = false;
      var actionParseError = null;
      var actionKeys = [];
      try {
        if (actionRaw && actionRaw !== "undefined" && actionRaw !== "null") {
          var parsed = JSON.parse(actionRaw);
          actionParsedOk = parsed != null && typeof parsed === "object";
          actionKeys = parsed && typeof parsed === "object" ? Object.keys(parsed) : [];
        }
      } catch (err) {
        actionParseError = String(err && err.message ? err.message : err);
      }
      return {
        index: i,
        id: btn.getAttribute("data-kinde-change-connection-id"),
        psid: btn.getAttribute("data-kinde-change-connection-psid"),
        hasButtonAttr: btn.getAttribute("data-kinde-change-connection-button"),
        actionRawPresent: actionRaw != null,
        actionRawPreview: actionRaw ? String(actionRaw).slice(0, 120) : null,
        actionParsedOk: actionParsedOk,
        actionParseError: actionParseError,
        actionKeys: actionKeys,
        disabled: !!btn.disabled,
        pointerEvents: window.getComputedStyle(btn).pointerEvents,
        display: window.getComputedStyle(btn).display,
        tagName: btn.tagName
      };
    });

    var scripts = Array.prototype.slice.call(document.scripts).map(function (s) {
      return { src: s.src || null, hasInline: !s.src && !!(s.textContent && s.textContent.length > 0), inlineLen: s.src ? 0 : (s.textContent || "").length };
    });

    send({
      runId: "pre-fix",
      hypothesisId: "B",
      location: "page.tsx:client-load",
      message: "DOM inspection after load",
      data: {
        buttonCount: buttons.length,
        rootCount: roots.length,
        roots: roots,
        buttonSnapshots: buttonSnapshots,
        scriptCount: scripts.length,
        scriptSrcs: scripts.filter(function (s) { return s.src; }).map(function (s) { return s.src; }),
        hasCsrfMeta: !!document.querySelector('meta[name="csrf-token"]')
      }
    });
  }

  function onClickCapture(ev) {
    var btn = ev.target && ev.target.closest
      ? ev.target.closest("[data-kinde-change-connection-button]")
      : null;
    if (!btn) return;

    var actionRaw = btn.getAttribute("data-kinde-change-connection-action");
    send({
      runId: "pre-fix",
      hypothesisId: "C",
      location: "page.tsx:click-capture",
      message: "connection button click captured",
      data: {
        id: btn.getAttribute("data-kinde-change-connection-id"),
        psid: btn.getAttribute("data-kinde-change-connection-psid"),
        actionRawPresent: actionRaw != null,
        actionLooksUndefined: actionRaw === "undefined" || actionRaw === "null",
        defaultPrevented: ev.defaultPrevented,
        eventPhase: ev.eventPhase,
        isTrusted: ev.isTrusted
      }
    });

    setTimeout(function () {
      send({
        runId: "pre-fix",
        hypothesisId: "E",
        location: "page.tsx:click-after-50ms",
        message: "post-click navigation/form check",
        data: {
          href: location.href,
          formCount: document.forms.length,
          pendingForms: Array.prototype.slice.call(document.forms).map(function (f) {
            return { action: f.action, method: f.method, target: f.target };
          })
        }
      });
    }, 50);
  }

  document.addEventListener("click", onClickCapture, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inspectButtons);
  } else {
    inspectButtons();
  }

  window.addEventListener("error", function (err) {
    send({
      runId: "pre-fix",
      hypothesisId: "D",
      location: "page.tsx:window-error",
      message: "window error after instrumentation",
      data: { message: String(err.message || err), filename: err.filename || null, lineno: err.lineno || null }
    });
  });
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
