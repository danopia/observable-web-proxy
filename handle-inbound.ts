import { Handler } from "https://deno.land/std@0.200.0/http/server.ts";
import { observeRequest } from './ddp-interface.ts';
import { handleManagementRequest } from "./handle-management.ts";

export const handleInboundRequest: Handler = (request, ...extras) => {
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
    statusCode: 200,
  });

  const body = `Your user-agent is:\n\n${request.headers.get(
  "user-agent",
  ) ?? "Unknown"}`;
  return new Response(body, { status: 200 });
}
