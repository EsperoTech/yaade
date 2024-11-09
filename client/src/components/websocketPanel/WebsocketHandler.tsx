import {
  Dispatch,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Collection from '../../model/Collection';
import { CurrentWebsocketRequest } from '../../model/Request';
import { CollectionsAction, findCollection } from '../../state/collections';
import {
  CurrentRequestAction,
  CurrentRequestActionType,
} from '../../state/currentRequest';
import { sendMessageToExtension } from '../../utils/extension';
import { getSelectedEnv } from '../../utils/store';
import WebsocketPanel from './WebsocketPanel';

type WebsocketHandlerProps = {
  currentRequest: CurrentWebsocketRequest;
  dispatchCurrentRequest: Dispatch<CurrentRequestAction>;
  dispatchCollections: Dispatch<CollectionsAction>;
  collections: Collection[];
  isExtInitialized: MutableRefObject<boolean>;
  extVersion: MutableRefObject<string | undefined>;
  openExtModal: () => void;
};

type WebsocketState = {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  wsId: string | null;
};

export default function WebsocketHandler({
  currentRequest,
  dispatchCurrentRequest,
  dispatchCollections,
  collections,
  isExtInitialized,
  openExtModal,
}: WebsocketHandlerProps) {
  const [state, setState] = useState<WebsocketState>({
    connectionStatus: 'disconnected',
    wsId: null,
  });
  const requestCollection = useMemo(() => {
    return findCollection(collections, currentRequest?.collectionId);
  }, [collections, currentRequest?.collectionId]);
  const selectedEnv = useMemo(() => {
    return requestCollection ? getSelectedEnv(requestCollection) : null;
  }, [requestCollection]);
  const ws = useRef<WebSocket | null>(null);

  async function extensionConnect(): Promise<string> {
    const res = await sendMessageToExtension(
      currentRequest.id,
      {
        uri: currentRequest.data.uri,
        type: 'ws-connect',
      },
      'ws-connected',
    );
    return res.wsId;
  }

  async function serverConnect(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const websocket = new WebSocket('/api/ws');
        websocket.onopen = () => {
          websocket.send(
            JSON.stringify({
              request: currentRequest,
              type: 'ws-connect',
            }),
          );
        };
        websocket.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ws-connected') {
            ws.current = websocket;
            console.log('server connected', msg.wsId);
            resolve(msg.wsId);
          } else if (msg.type === 'ws-read') {
            dispatchCurrentRequest({
              type: CurrentRequestActionType.ADD_WEBSOCKET_RESPONSE_MESSAGE,
              message: msg.response,
            });
          }
        };
        websocket.onerror = (err) => {
          reject(err);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  async function handleConnect() {
    try {
      setState((s) => ({
        ...s,
        connectionStatus: 'connecting',
      }));
      let proxy = 'ext';
      if (selectedEnv) {
        proxy = selectedEnv.proxy;
      }
      let wsId: string | null = null;
      switch (proxy) {
        case 'server':
          wsId = await serverConnect();
          console.log('server wsId', wsId);
          break;
        case 'ext':
          if (!isExtInitialized.current) {
            openExtModal();
            throw Error('Extension not initialized');
          }
          wsId = await extensionConnect();
          break;
        default:
          throw Error('Unknown proxy');
      }
      setState((s) => ({
        ...s,
        connectionStatus: 'connected',
        wsId,
      }));
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: {
          ...currentRequest.data,
          response: {
            ...currentRequest.data.response,
            messages: [],
          },
        },
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        connectionStatus: 'disconnected',
      }));
      console.error(err);
    }
  }

  async function handleDisconnect() {
    try {
      await sendMessageToExtension(
        currentRequest.id,
        {
          type: 'ws-disconnect',
        },
        'ws-disconnected',
      );
      setState((s) => ({
        ...s,
        connectionStatus: 'disconnected',
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleWrite(message: string) {
    try {
      console.log('writing', message);
      const res = await sendMessageToExtension(
        currentRequest.id,
        {
          type: 'ws-write',
          data: {
            wsId: state.wsId,
            message,
          },
        },
        'ws-written',
      );
      if (res.status === 'success') {
        console.log('write success', { message, date: Date.now(), type: 'outgoing' });
        dispatchCurrentRequest({
          type: CurrentRequestActionType.ADD_WEBSOCKET_RESPONSE_MESSAGE,
          message: { message, date: Date.now(), type: 'outgoing' },
        });
      } else {
        console.error('write error', res);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleRead = useCallback(
    (event: MessageEvent) => {
      if (
        !event.data ||
        event.data?.type !== 'ws-read' ||
        event.data.response?.wsId !== state.wsId
      ) {
        console.log('ignoring', event.data);
        return;
      }
      dispatchCurrentRequest({
        type: CurrentRequestActionType.ADD_WEBSOCKET_RESPONSE_MESSAGE,
        message: {
          message: event.data.response.message,
          date: Date.now(),
          type: 'incoming',
        },
      });
    },
    [dispatchCurrentRequest, state.wsId],
  );

  useEffect(() => {
    window.addEventListener('message', handleRead);
    return () => {
      window.removeEventListener('message', handleRead);
    };
  }, [handleRead]);

  return (
    <WebsocketPanel
      currentRequest={currentRequest}
      dispatchCurrentRequest={dispatchCurrentRequest}
      dispatchCollections={dispatchCollections}
      collections={collections}
      connectionStatus={state.connectionStatus}
      onConnect={handleConnect}
      onWrite={handleWrite}
      onDisconnect={handleDisconnect}
    />
  );
}
