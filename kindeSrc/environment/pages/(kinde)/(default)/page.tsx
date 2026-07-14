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

  return (
    <Root context={context} request={request}>
      <DefaultLayout>
        <Widget
          heading={context.widget.content.heading}
          description={context.widget.content.description}
        />
        <div data-kinde-root>
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
      </DefaultLayout>
    </Root>
  );
};

// Page Component
export default async function Page(event: KindePageEvent): Promise<string> {
  const page = await DefaultPage(event);
  return renderToString(page);
}
