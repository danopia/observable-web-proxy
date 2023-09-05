import { DdpInterface, InboundDdpSocket } from "./ddp-impl.ts";

export const ObservableWebProxyInterface = new DdpInterface();

interface RequestDocument {
  _id: string;
  timestamp: Date;
  method: string;
  requestUrl: string;
  urlDetails: {
    origin: string;
    path: string;
  };
  bodyText: string | null;

  response?: {
    statusCode: number;
    bodyText: string | null;
  };
}

const requestHistory = new Array<RequestDocument>();
const subbedSockets = new Set<InboundDdpSocket>();

// Trim old requests
setInterval(() => {
  const unwantedCount = requestHistory.length - 100;
  if (unwantedCount > 0) {
    requestHistory.splice(0, unwantedCount);
    const newOldest = requestHistory[0].timestamp;
    const ageMinutes = (Date.now() - newOldest.valueOf()) / 1000 / 60;
    console.log('Deleted', unwantedCount, 'old requests. New oldest request occurred', ageMinutes, 'minutes ago.');
  }
}, 60 * 1000);

export async function observeRequest(request: RequestDocument) {
  requestHistory.push(request);
  await Promise
    .allSettled(Array
      .from(subbedSockets)
      .map(socket => socket
        .send([{
          msg: 'added',
          collection: 'Requests',
          id: request._id,
          fields: { ...request },
        }])));
  console.log('Observed', request.method, request.requestUrl);
}

observeRequest({
  _id: crypto.randomUUID(),
  timestamp: new Date(),
  method: 'GET',
  requestUrl: 'https://example.org/healthz',
  urlDetails: {
    origin: 'https://example.org',
    path: '/healthz',
  },
  bodyText: null,

  statusCode: 200,
});

ObservableWebProxyInterface.addPublication('/recent-requests', (socket, params, stopSignal) => {
  // const [firstParam] = params as [string];

  // TODO!: Check RBAC for access control!
  // const userId = userIdMap.get(socket);
  // if (!userId) throw new Error(`TODO: requires auth`);

  if (subbedSockets.has(socket)) {
    throw new Error(`Already subscribed`);
  }

  for (const req of requestHistory) {
    socket.send([{
      msg: 'added',
      collection: 'Requests',
      id: req._id,
      fields: { ...req },
    }]);
  }
  subbedSockets.add(socket);

  stopSignal.addEventListener('abort', () => {
    subbedSockets.delete(socket);
  });

  // socket.send([{
  //   msg: 'changed',
  //   collection: 'Requests',
  //   id: documentId,
  //   fields: {
  //     ...rest,
  //   },
  // }]);

  // socket.send([{
  //   msg: 'removed',
  //   collection: 'Requests',
  //   id: documentId,
  // }]);
});

// ObservableWebProxyInterface.addMethod('/some-method', async (socket, params) => {
//   const userId = userIdMap.get(socket);
//   if (!userId) throw new Error(`TODO: requires auth`);
//   return profile.metadata.name;
// });
