import { Input, Select, useDisclosure, useToast } from '@chakra-ui/react';
import { Dispatch, MutableRefObject, useRef, useState } from 'react';

import api from '../../api';
import Collection from '../../model/Collection';
import Request, { CurrentRequest } from '../../model/Request';
import Response from '../../model/Response';
import { CollectionsAction, CollectionsActionType } from '../../state/collections';
import {
  CurrentRequestAction,
  CurrentRequestActionType,
} from '../../state/currentRequest';
import {
  appendHttpIfNoProtocol,
  createMessageId,
  errorToast,
  getMinorVersion,
  kvRowsToMap,
  parseResponse,
  successToast,
} from '../../utils';
import interpolate from '../../utils/interpolate';
import { executeRequestScript, executeResponseScript } from '../../utils/script';
import { getSelectedEnv } from '../../utils/store';
import { useKeyPress } from '../../utils/useKeyPress';
import BasicModal from '../basicModal';
import RequestPanel from './RequestPanel';

type NewReqFormState = {
  collectionId: number;
  name: string;
};

type RequestSenderProps = {
  currentRequest: CurrentRequest;
  dispatchCurrentRequest: Dispatch<CurrentRequestAction>;
  collections: Collection[];
  dispatchCollections: Dispatch<CollectionsAction>;
  isExtInitialized: MutableRefObject<boolean>;
  extVersion: MutableRefObject<string | undefined>;
  openExtModal: () => void;
};

function RequestSender({
  currentRequest,
  dispatchCurrentRequest,
  collections,
  dispatchCollections,
  isExtInitialized,
  extVersion,
  openExtModal,
}: RequestSenderProps) {
  const [newReqForm, setNewReqForm] = useState<NewReqFormState>({
    collectionId: -1,
    name: '',
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialRef = useRef(null);
  const toast = useToast();

  function getEnv(collectionId: number, envName?: string) {
    if (!envName) return;

    const i = collections.findIndex((c: Collection) => c.id === collectionId);
    if (i === -1) return;

    const envs = collections[i].data?.envs;
    if (!envs) return;

    return envs[envName];
  }

  // from request panel
  useKeyPress(handleSaveRequestClick, 's', true);

  async function handleSaveRequestClick() {
    try {
      if (currentRequest.id === -1 && currentRequest.collectionId === -1) {
        onOpen();
        return;
      } else {
        await api.updateRequest(currentRequest);
        dispatchCollections({
          type: CollectionsActionType.PATCH_REQUEST_DATA,
          id: currentRequest.id,
          data: { ...currentRequest.data },
        });
        dispatchCurrentRequest({
          type: CurrentRequestActionType.SET_IS_CHANGED,
          isChanged: false,
        });
        successToast('The request was successfully saved.', toast);
      }
    } catch (e) {
      console.error(e);
      errorToast('The request could not be saved.', toast);
    }
  }

  async function handleSaveNewRequestClick() {
    try {
      const response = await api.createRequest(newReqForm.collectionId, {
        ...currentRequest?.data,
        name: newReqForm.name,
      });
      const newRequest = (await response.json()) as Request;

      dispatchCollections({
        type: CollectionsActionType.PATCH_REQUEST_DATA,
        id: newRequest.id,
        data: { ...newRequest.data },
      });
      dispatchCurrentRequest({
        type: CurrentRequestActionType.SET,
        request: newRequest,
      });

      onCloseClear();
      successToast('A new request was created.', toast);
    } catch (e) {
      errorToast('The request could be not created', toast);
    }
  }

  const requestCollection = collections.find(
    (c) => c.id === currentRequest?.collectionId,
  );
  const selectedEnv = requestCollection ? getSelectedEnv(requestCollection) : null;

  if (collections.length > 0 && newReqForm.collectionId === -1) {
    setNewReqForm({ ...newReqForm, collectionId: collections[0].id });
  }

  function onCloseClear() {
    setNewReqForm({
      collectionId: -1,
      name: '',
    });
    onClose();
  }

  function getEnvVar(collectionId: number, envName?: string) {
    return (collections: Collection[], key: string): string => {
      if (!envName) return '';

      const i = collections.findIndex((c: Collection) => c.id === collectionId);
      if (i === -1) return '';

      const envs = collections[i].data?.envs;
      if (!envs) return '';

      const newEnv = envs[envName];
      if (!newEnv) return '';

      return newEnv.data[key] ?? '';
    };
  }

  function setEnvVar(collectionId: number, key: string, value: string, envName?: string) {
    if (!envName) return;
    return dispatchCollections({
      type: CollectionsActionType.SET_ENV_VAR,
      payload: {
        collectionId,
        envName,
        key,
        value,
      },
    });
  }

  async function sendRequest(
    request: Request,
    envName?: string,
    n?: number,
  ): Promise<Response> {
    if (n && n >= 5) {
      throw Error('Exec loop detected in request script');
    }

    const collection = collections.find((c) => c.id === request.collectionId);

    const collectionHeaders = collection?.data?.headers ?? [];
    const injectedReq: Request = {
      ...request,
      data: {
        ...request.data,
        headers: [...collectionHeaders, ...(request.data.headers ?? [])],
      },
    };

    let proxy = 'ext';
    const env = getEnv(injectedReq.collectionId, envName);
    if (env) {
      proxy = env.proxy;
    }

    if (collection?.data?.requestScript) {
      if (proxy === 'ext' && getMinorVersion(extVersion.current) < 3) {
        throw Error(`Request scripts are not supported in this version of the extension. 
              Please update to the latest version or remove the request script.`);
      }
      await doRequestScript(
        injectedReq,
        collection?.data?.requestScript,
        true,
        envName,
        n,
      );
    }

    if (injectedReq.data.requestScript) {
      if (proxy === 'ext' && getMinorVersion(extVersion.current) < 3) {
        throw Error(`Request scripts are not supported in this version of the extension. 
              Please update to the latest version or remove the request script.`);
      }
      await doRequestScript(
        injectedReq,
        injectedReq.data.requestScript,
        false,
        envName,
        n,
      );
    }

    let response = null;
    switch (proxy) {
      case 'server':
        response = await sendRequestToServer(injectedReq, envName);
        break;
      case 'ext':
        if (!isExtInitialized.current) {
          openExtModal();
          throw Error('Extension not initialized');
        }
        response = await sendRequestToExtension(injectedReq, envName);
        break;
      default:
        throw Error('Unknown proxy');
    }

    if (injectedReq.data.responseScript) {
      doResponseScript(
        injectedReq,
        response,
        injectedReq.data.responseScript,
        false,
        envName,
      );
    }

    if (collection?.data?.responseScript) {
      doResponseScript(
        injectedReq,
        response,
        collection?.data?.responseScript,
        true,
        envName,
      );
    }

    return response;
  }

  async function doRequestScript(
    request: Request,
    requestScript: string,
    isCollectionLevel: boolean,
    envName?: string,
    n?: number,
  ) {
    // NOTE: cannot pass state on top level because it does not use most current state
    const set = (key: string, value: string) =>
      setEnvVar(request.collectionId, key, value, envName);
    const get = (key: string): string =>
      getEnvVar(request.collectionId, envName)(collections, key);
    const exec = async (requestId: number, envName?: string) => {
      const request = collections
        .flatMap((c) => c.requests)
        .find((r) => r.id === requestId);
      if (!request) {
        throw Error(`Request with id ${requestId} not found`);
      }
      if (!n) n = 0;
      return await sendRequest(request, envName, n + 1);
    };
    await executeRequestScript(
      request,
      requestScript,
      set,
      get,
      exec,
      isCollectionLevel,
      envName,
    );
  }

  function doResponseScript(
    request: Request,
    response: Response,
    responseScript: string,
    isCollectionLevel: boolean,
    envName?: string,
  ) {
    // NOTE: cannot pass state on top level because it does not use most current state
    const set = (key: string, value: string) =>
      setEnvVar(request.collectionId, key, value, envName);
    const get = (key: string): string =>
      getEnvVar(request.collectionId, envName)(collections, key);
    executeResponseScript(
      request,
      response,
      responseScript,
      set,
      get,
      toast,
      isCollectionLevel,
      envName,
    );
  }

  async function sendRequestToExtension(
    request: Request,
    envName?: string,
    n?: number,
  ): Promise<Response> {
    if (n && n >= 5) {
      throw Error('Exec loop detected in request script');
    }
    return new Promise((resolve, reject) => {
      const messageId = createMessageId(request.id);

      function handleMessage(event: any) {
        if (event?.data?.type === 'receive-response' && event?.data?.response?.err) {
          reject(new Error(event.data.response.err));
        } else if (
          event.data &&
          event.data.type === 'receive-response' &&
          event.data.response.metaData.messageId === messageId
        ) {
          window.removeEventListener('message', handleMessage);
          resolve(parseResponse(event.data.response));
        }
      }

      window.addEventListener('message', handleMessage);

      setTimeout(() => {
        // Remove the event listener if the Promise is not resolved after 5 seconds
        window.removeEventListener('message', handleMessage);
        reject(new Error('Timeout wating for response from: ' + request.id));
      }, 5000);

      // TODO: check if this mutates the original request object
      let interpolatedRequest = { ...request };
      if (envName) {
        const collection = collections.find((c) => c.id === request.collectionId);
        if (!collection) {
          throw Error('Collection not found for id: ' + request.collectionId);
        }
        const selectedEnv = collection.data?.envs?.[envName];
        const selectedEnvData = selectedEnv?.data ?? {};
        const interpolateResult = interpolate(request, selectedEnvData);
        interpolatedRequest = interpolateResult.result;
      }

      const url = appendHttpIfNoProtocol(interpolatedRequest.data.uri);

      const headers = kvRowsToMap(interpolatedRequest.data.headers);

      const options: any = { headers, method: interpolatedRequest.data.method };
      if (interpolatedRequest.data.body) {
        options['body'] = interpolatedRequest.data.body;
      }

      window.postMessage(
        {
          url,
          type: 'send-request',
          options: options,
          metaData: {
            messageId,
            envName,
            isRequestScript: n ?? 0 > 0,
          },
        },
        '*',
      );
    });
  }

  async function saveOnSend(request: Request) {
    if (request.id === -1) return;

    console.log('save on send', request);

    let response = await api.updateRequest(request);
    if (response.status !== 200) {
      throw new Error(`Failed to save request [Status: ${response.status}]]`);
    }

    dispatchCollections({
      type: CollectionsActionType.PATCH_REQUEST_DATA,
      id: request.id,
      data: { ...request.data },
    });

    const i = collections.findIndex((c: Collection) => c.id === request.collectionId);
    if (i === -1) return;
    const collection = collections[i];

    response = await api.updateCollection(collection);
    if (response.status !== 200)
      throw new Error(`Failed to save collection [Status: ${response.status}]]`);
  }

  async function sendRequestToServer(
    request: Request,
    envName?: string,
  ): Promise<Response> {
    if (envName) {
      const collection = collections.find((c) => c.id === request.collectionId);
      if (!collection) {
        throw Error('Collection not found for id: ' + request.collectionId);
      }
      const selectedEnv = collection.data?.envs?.[envName];
      const selectedEnvData = selectedEnv?.data ?? {};
      const interpolateResult = interpolate(request, selectedEnvData);
      request = interpolateResult.result;
    }
    return api
      .invoke(request, envName ?? 'NO_ENV')
      .then((res) => {
        if (res.status !== 200) throw new Error(`Server error. Status: ${res.status}`);
        return res.json();
      })
      .then((resBody) => {
        if (resBody.error) throw new Error(resBody.error);
        return parseResponse(resBody);
      });
  }
  return (
    <>
      {currentRequest && (
        <RequestPanel
          currentRequest={currentRequest}
          dispatchCurrentRequest={dispatchCurrentRequest}
          sendRequest={sendRequest}
          saveOnSend={saveOnSend}
          selectedEnv={selectedEnv}
        />
      )}
      <BasicModal
        isOpen={isOpen}
        onClose={onCloseClear}
        initialRef={initialRef}
        heading="Save a new request"
        onClick={handleSaveNewRequestClick}
        isButtonDisabled={newReqForm.name === '' || newReqForm.collectionId === -1}
        buttonText="Save"
        buttonColor="green"
      >
        <Input
          placeholder="Name"
          w="100%"
          borderRadius={20}
          colorScheme="green"
          value={newReqForm.name}
          onChange={(e) => setNewReqForm({ ...newReqForm, name: e.target.value })}
          ref={initialRef}
          mb="4"
        />
        <Select
          borderRadius={20}
          value={newReqForm.collectionId}
          onChange={(e) =>
            setNewReqForm({ ...newReqForm, collectionId: Number(e.target.value) })
          }
        >
          {collections.map((collection) => (
            <option key={`collection-dropdown-${collection.id}`} value={collection.id}>
              {collection.data.name}
            </option>
          ))}
        </Select>
      </BasicModal>
    </>
  );
}

export default RequestSender;
