import { Server } from "https://deno.land/std@0.200.0/http/server.ts";
import { handleInboundRequest } from "./handle-inbound.ts";
import { handleManagementRequest } from "./handle-management.ts";

const inboundServer = new Server({
  port: 3000,
  handler: handleInboundRequest,
});

const managementServer = new Server({
  port: 8000,
  handler: handleManagementRequest,
});

console.log(`listening...`);
await Promise.all([

  // Listen with TLS if the key file is present
  Deno.stat('key.pem')
    .then(() => true, () => false)
    .then(hasKey => hasKey
      ? inboundServer.listenAndServeTls("cert.pem", "key.pem")
      : inboundServer.listenAndServe()),

  // Management is always served http
  managementServer.listenAndServe(),

]);
