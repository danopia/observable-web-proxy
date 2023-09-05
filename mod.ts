import { Server } from "https://deno.land/std@0.200.0/http/server.ts";
const port = 4505;
const handler = (request: Request) => {
  const body = `Your user-agent is:\n\n${request.headers.get(
   "user-agent",
  ) ?? "Unknown"}`;
  return new Response(body, { status: 200 });
};
const server = new Server({ host: '0.0.0.0', port, handler });
const certFile = "cert.pem";
const keyFile = "key.pem";
console.log("server listening on https://localhost:4505");
await server.listenAndServeTls(certFile, keyFile);