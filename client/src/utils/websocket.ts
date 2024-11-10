import { createMessageId } from '.';

type WSRequest = {
  type: string;
  [key: string]: any;
};

function sendMessageToWebsocket(ws: WebSocket, messageId: number, message: WSRequest) {
  return new Promise((resolve, reject) => {
    const msg = { ...message, metaData: { messageId: createMessageId(messageId) } };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout waiting for response'));
    }, 5000);

    const messageHandler = (event: MessageEvent) => {
      let res;
      try {
        res = JSON.parse(event.data);
      } catch (e) {
        console.error('messageHandler', e);
        return;
      }
      if (msg?.type === `${msg.type}-result` && res?.err) {
        cleanup();
        reject(new Error(res.err || 'Write failed'));
      } else if (
        res?.type === `${msg.type}-result` &&
        res?.result?.metaData?.messageId === msg.metaData?.messageId
      ) {
        cleanup();
        resolve(res.result);
      }
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      ws.removeEventListener('message', messageHandler);
    };
    ws.addEventListener('message', messageHandler);

    ws.send(JSON.stringify(msg));
  });
}

export { sendMessageToWebsocket };
