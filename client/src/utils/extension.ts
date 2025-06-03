import { createMessageId } from '.';

type ExtensionRequest = {
  type: string;
  [key: string]: any;
};

function sendMessageToExtension(
  messageId: number,
  message: ExtensionRequest,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const msg = { ...message, metaData: { messageId: createMessageId(messageId) } };

    function handleMessage(event: any) {
      if (event?.data?.type === `${msg.type}-result` && event?.data?.err) {
        reject(new Error(event.data.err));
      } else if (
        event.data &&
        event.data.type === `${msg.type}-result` &&
        event.data.result?.metaData?.messageId === msg.metaData?.messageId
      ) {
        window.removeEventListener('message', handleMessage);
        resolve(event.data.result);
      }
    }

    window.addEventListener('message', handleMessage);

    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      reject(new Error('Timeout wating for response from'));
    }, 5000);
    window.postMessage(msg, '*');
  });
}

export { sendMessageToExtension };
