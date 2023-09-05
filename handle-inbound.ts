import { Handler } from "https://deno.land/std@0.200.0/http/server.ts";
import { RequestDocument, observeRequest } from './ddp-interface.ts';
import { handleManagementRequest } from "./handle-management.ts";

export const handleInboundRequest: Handler = async (request, ...extras) => {
  const url = new URL(request.url);

  // We let a certain hostname fake the management interface
  if (url.hostname == 'example.org') {
    return handleManagementRequest(request, ...extras);
  }

  const requestText = request.body ? await request.text() : null;
  function observeWithResponse(response: RequestDocument['response']) {
    observeRequest({
      _id: crypto.randomUUID(),
      timestamp: new Date(),
      method: request.method,
      requestUrl: request.url,
      urlDetails: {
        origin: url.origin,
        path: url.pathname,
      },
      bodyText: requestText,
      response: response,
    });
  }

  if (url.hostname == 'da.gd') {
    const response = await fetch(new Request(request, { body: requestText }));
    const responseText = await response.text();
    observeWithResponse({
      statusCode: response.status,
      bodyText: responseText
    });
    return new Response(responseText, response);
  }

  observeWithResponse({
    statusCode: 404,
    bodyText: `Access to ${JSON.stringify(url.origin)} is blocked within this environment.`
  });
  return new Response(`Access to ${JSON.stringify(url.origin)} is blocked within this environment.`, { status: 404 });
}
