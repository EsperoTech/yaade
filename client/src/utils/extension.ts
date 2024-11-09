import { createMessageId } from '.';

type ExtensionRequest = {
  type: string;
  [key: string]: any;
};

function sendMessageToExtension(
  messageId: number,
  message: ExtensionRequest,
  responseType: string,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const msg = { ...message, metaData: { messageId: createMessageId(messageId) } };

    function handleMessage(event: any) {
      if (event?.data?.type === responseType && event?.data?.err) {
        reject(new Error(event.data.err));
      } else if (
        event.data &&
        event.data.type === responseType &&
        event.data.response?.metaData?.messageId === msg.metaData?.messageId
      ) {
        console.log('handleMessage', event);
        window.removeEventListener('message', handleMessage);
        resolve(event.data.response);
      }
    }

    window.addEventListener('message', handleMessage);

    setTimeout(() => {
      // Remove the event listener if the Promise is not resolved after 5 seconds
      window.removeEventListener('message', handleMessage);
      reject(new Error('Timeout wating for response from: ' + messageId));
    }, 5000);
    window.postMessage(msg, '*');
  });
}

export { sendMessageToExtension };
