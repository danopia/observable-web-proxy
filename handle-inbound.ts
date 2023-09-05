import { Handler } from "https://deno.land/std@0.200.0/http/server.ts";
import { observeRequest } from './ddp-interface.ts';
import { handleManagementRequest } from "./handle-management.ts";

export const handleInboundRequest: Handler = async (request, ...extras) => {
  const url = new URL(request.url);

  // We let a certain hostname fake the management interface
  if (url.hostname == 'example.org') {
    return handleManagementRequest(request, ...extras);
  }

  observeRequest({
    _id: crypto.randomUUID(),
    timestamp: new Date(),
    method: request.method,
    requestUrl: request.url,
    urlDetails: {
      origin: url.origin,
      path: url.pathname,
    },
    bodyText: request.body ? await request.text() : null,
    response: {
      statusCode: 404,
      bodyText: `Access to ${JSON.stringify(url.origin)} is blocked within this environment.`
    }
  });
  return new Response(`Access to ${JSON.stringify(url.origin)} is blocked within this environment.`, { status: 404 });
}
