import type { Handler } from "https://deno.land/std@0.200.0/http/server.ts";
import { InboundDdpSocket } from "./ddp-impl.ts";
import { ObservableWebProxyInterface } from "./ddp-interface.ts";

const infoPat = new URLPattern({
  pathname: '/sockjs/info',
});
const browserWsPat = new URLPattern({
  pathname: '/sockjs/:arg1/:arg2/websocket',
});

export const handleManagementRequest: Handler = (req) => {
  if (req.method == 'GET' && infoPat.exec(req.url)) {
    return new Response(JSON.stringify({
      "websocket": true,
      "origins": ["*:*"],
      "cookie_needed": false,
      "entropy": Math.trunc(Math.random() * 10000),
    }), {
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': req.headers.get('origin') ?? '*',
        'access-control-allow-credentials': 'true', // meteor techdebt?
      },
    });
  }

  const upgrade = req.headers.get("upgrade") ?? "";
  if (req.method == 'GET' && upgrade.toLowerCase() == "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);

    const ddpSock = new InboundDdpSocket(
      socket,
      ObservableWebProxyInterface,
      browserWsPat.exec(req.url)
        ? 'sockjs'
        : 'raw');

    ObservableWebProxyInterface.registerSocket(ddpSock);
    return response;
  }

  return new Response('Not found', {
    status: 404,
  });
};
