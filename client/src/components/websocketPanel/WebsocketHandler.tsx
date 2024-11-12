import { useToast } from '@chakra-ui/react';
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
import { errorToast, getMinorVersion } from '../../utils';
import { sendMessageToExtension } from '../../utils/extension';
import interpolate from '../../utils/interpolate';
import { getSelectedEnv } from '../../utils/store';
import { sendMessageToWebsocket } from '../../utils/websocket';
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

export default function WebsocketHandler({
  currentRequest,
  dispatchCurrentRequest,
  dispatchCollections,
  collections,
  isExtInitialized,
  extVersion,
  openExtModal,
}: WebsocketHandlerProps) {
  const wsId = useRef<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'connecting'
  >('disconnected');
  const requestCollection = useMemo(() => {
    return findCollection(collections, currentRequest?.collectionId);
  }, [collections, currentRequest?.collectionId]);
  const selectedEnv = useMemo(() => {
    return requestCollection ? getSelectedEnv(requestCollection) : null;
  }, [requestCollection]);
  const ws = useRef<WebSocket | null>(null);
  const toast = useToast();

  useEffect(() => {
    return () => {
      ws.current?.close();
    };
  }, []);

  async function extensionConnect(request: CurrentWebsocketRequest): Promise<string> {
    const res = await sendMessageToExtension(currentRequest.id, {
      type: 'ws-connect',
      request,
    });
    return res.wsId;
  }

  async function serverConnect(request: CurrentWebsocketRequest): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const websocket = new WebSocket('/api/ws');
        websocket.onopen = () => {
          sendMessageToWebsocket(websocket, currentRequest.id, {
            type: 'ws-connect',
            request,
          })
            .then((msg: any) => {
              ws.current = websocket;
              resolve(msg.wsId);
            })
            .catch(reject);
        };
        websocket.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (!msg) {
            console.error('server message', msg);
            return;
          }
          if (msg.type === 'ws-read') {
            if (!msg || msg?.type !== 'ws-read' || msg.result?.wsId !== wsId.current) {
              return;
            }
            dispatchCurrentRequest({
              type: CurrentRequestActionType.ADD_WEBSOCKET_RESPONSE_MESSAGE,
              message: {
                message: msg.result.message,
                date: Date.now(),
                type: 'incoming',
              },
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
      setConnectionStatus('connecting');
      let proxy = 'ext';
      if (selectedEnv) {
        proxy = selectedEnv.proxy;
      }
      let newWsId: string | null = null;
      let interpolatedRequest = { ...currentRequest };
      if (selectedEnv) {
        const collection = findCollection(collections, currentRequest.collectionId);
        if (!collection) {
          throw Error('Collection not found for id: ' + currentRequest.collectionId);
        }
        const selectedEnvData = selectedEnv?.data ?? {};
        const interpolateResult = interpolate(currentRequest, selectedEnvData);
        interpolatedRequest = interpolateResult.result;
      }
      switch (proxy) {
        case 'server':
          newWsId = await serverConnect(interpolatedRequest);
          break;
        case 'ext':
          if (!isExtInitialized.current) {
            openExtModal();
            throw Error('Extension not initialized');
          }
          if (getMinorVersion(extVersion.current) < 10) {
            throw Error(
              'Upgrade to the latest version of the extension to use websocket requests.',
            );
          }
          newWsId = await extensionConnect(interpolatedRequest);
          break;
        default:
          throw Error('Unknown proxy');
      }
      setConnectionStatus('connected');
      wsId.current = newWsId;
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
      setConnectionStatus('disconnected');
      console.error(err);
      errorToast('Failed to connect: ' + err, toast);
    }
  }

  async function extensionDisconnect() {
    return await sendMessageToExtension(currentRequest.id, {
      type: 'ws-disconnect',
      wsId: wsId.current,
    });
  }

  async function serverDisconnect() {
    if (!ws.current) {
      return;
    }
    const res: any = await sendMessageToWebsocket(ws.current, currentRequest.id, {
      type: 'ws-disconnect',
    });
    ws.current.close();
    return res;
  }

  async function handleDisconnect() {
    try {
      let proxy = 'ext';
      if (selectedEnv) {
        proxy = selectedEnv.proxy;
      }
      setConnectionStatus('connecting');
      let res: any;
      switch (proxy) {
        case 'server':
          res = await serverDisconnect();
          break;
        case 'ext':
          res = await extensionDisconnect();
          break;
        default:
          throw Error('Unknown proxy');
      }
      if (res.status === 'error') {
        throw Error(res.err);
      }
      setConnectionStatus('disconnected');
      wsId.current = null;
    } catch (err) {
      setConnectionStatus('connected');
      errorToast('Failed to disconnect: ' + err, toast);
    }
  }

  async function extensionWrite(message: string) {
    return await sendMessageToExtension(currentRequest.id, {
      type: 'ws-write',
      data: {
        wsId: wsId.current,
        message,
      },
    });
  }

  async function serverWrite(message: string) {
    if (!ws.current) {
      throw Error('WebSocket not connected');
    }
    return await sendMessageToWebsocket(ws.current, currentRequest.id, {
      type: 'ws-write',
      data: {
        wsId: wsId.current,
        message,
      },
    });
  }

  async function handleWrite(message: string) {
    try {
      let proxy = 'ext';
      if (selectedEnv) {
        proxy = selectedEnv.proxy;
      }
      let res: any;
      switch (proxy) {
        case 'server':
          res = await serverWrite(message);
          break;
        case 'ext':
          res = await extensionWrite(message);
          break;
        default:
          throw Error('Unknown proxy');
      }
      if (res.status === 'error') {
        console.error('write error', res);
        return;
      }
      dispatchCurrentRequest({
        type: CurrentRequestActionType.ADD_WEBSOCKET_RESPONSE_MESSAGE,
        message: {
          message: message,
          date: Date.now(),
          type: 'outgoing',
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  const handleRead = useCallback(
    (event: MessageEvent) => {
      if (
        !event.data ||
        event.data?.type !== 'ws-read' ||
        event.data.result?.wsId !== wsId.current
      ) {
        return;
      }
      dispatchCurrentRequest({
        type: CurrentRequestActionType.ADD_WEBSOCKET_RESPONSE_MESSAGE,
        message: {
          message: event.data.result.message,
          date: Date.now(),
          type: 'incoming',
        },
      });
    },
    [dispatchCurrentRequest],
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
      connectionStatus={connectionStatus}
      onConnect={handleConnect}
      onWrite={handleWrite}
      onDisconnect={handleDisconnect}
      selectedEnv={selectedEnv}
    />
  );
}
