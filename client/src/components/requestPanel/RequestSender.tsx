import { Input, Select, useColorMode, useDisclosure, useToast } from '@chakra-ui/react';
import { Dispatch, MutableRefObject, useMemo, useRef, useState } from 'react';

import api from '../../api';
import Collection from '../../model/Collection';
import KVRow from '../../model/KVRow';
import { CurrentRestRequest, RestRequest } from '../../model/Request';
import { RestResponse } from '../../model/Response';
import { JasmineReport } from '../../model/Script';
import {
  CollectionsAction,
  CollectionsActionType,
  findCollection,
  findRequest,
} from '../../state/collections';
import {
  CurrentRequestAction,
  CurrentRequestActionType,
} from '../../state/currentRequest';
import {
  appendHttpIfNoProtocol,
  createMessageId,
  errorToast,
  extractAuthorizationHeader,
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
  currentRequest: CurrentRestRequest;
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
  const { colorMode } = useColorMode();

  function getEnv(collectionId: number, envName?: string) {
    if (!envName) return;

    const c = findCollection(collections, collectionId);
    if (!c) return;

    const envs = c.data?.envs;
    if (!envs) return;

    return envs[envName];
  }

  // from request panel
  useKeyPress(handleSaveRequestClick, 's', true);

  async function handleSaveRequestClick(preventSuccessToast = false) {
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
        if (!preventSuccessToast) {
          successToast('The request was successfully saved.', toast);
        }
      }
    } catch (e) {
      console.error(e);
      errorToast('The request could not be saved.', toast);
    }
  }

  async function handleSaveNewRESTRequestClick() {
    try {
      const response = await api.createRestRequest(newReqForm.collectionId, {
        ...currentRequest?.data,
        name: newReqForm.name,
      });
      const newRequest = (await response.json()) as RestRequest;

      dispatchCollections({
        type: CollectionsActionType.PATCH_REQUEST_DATA,
        id: newRequest.id,
        data: { ...newRequest.data },
      });
      dispatchCurrentRequest({
        type: CurrentRequestActionType.SET,
        request: newRequest,
      });
      dispatchCollections({
        type: CollectionsActionType.ADD_REQUEST,
        request: newRequest,
      });

      onCloseClear();
      successToast('A new request was created.', toast);
    } catch (e) {
      errorToast('The request could be not created', toast);
    }
  }

  const requestCollection = useMemo(() => {
    return findCollection(collections, currentRequest?.collectionId);
  }, [collections, currentRequest?.collectionId]);
  const selectedEnv = useMemo(() => {
    return requestCollection ? getSelectedEnv(requestCollection) : null;
  }, [requestCollection]);

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

      const c = findCollection(collections, collectionId);
      if (!c) return '';

      const envs = c.data?.envs;
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

  const encodeFormDataBody = (kvs: KVRow[]) => {
    const params = new URLSearchParams();
    for (const kv of kvs) {
      if (kv.isEnabled !== false) {
        params.append(kv.key, kv.value);
      }
    }

    return params.toString();
  };

  async function sendRequest(
    request: RestRequest,
    envName?: string,
    n?: number,
  ): Promise<RestResponse> {
    if (n && n >= 5) {
      throw Error('Exec loop detected in request script');
    }

    const collection = findCollection(collections, request.collectionId);

    const enabledCollectionHeaders = collection?.data?.headers
      ? collection.data.headers.filter((h) => h.isEnabled !== false)
      : [];
    const enabledRequestHeaders = request.data.headers
      ? request.data.headers.filter((h) => h.isEnabled !== false)
      : [];
    let auth = collection?.data?.auth;
    if (request.data.auth && request.data.auth.enabled) {
      auth = request.data.auth;
    }

    const injectedReq: RestRequest = {
      ...request,
      data: {
        ...request.data,
        auth,
        // NOTE: this order is important because we want request headers to take precedence
        headers: [...enabledCollectionHeaders, ...enabledRequestHeaders],
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

    let response: RestResponse | null = null;
    switch (proxy) {
      case 'server':
        response = await sendRequestToServer(injectedReq, envName);
        break;
      case 'ext':
        if (!isExtInitialized.current) {
          openExtModal();
          throw Error('Extension not initialized');
        }
        response = await sendRequestToExtension(
          injectedReq,
          envName,
          collection?.data?.settings?.extensionOptions?.timeout,
        );
        break;
      default:
        throw Error('Unknown proxy');
    }

    if (injectedReq.data.responseScript) {
      const jasmineReport = await doResponseScript(
        injectedReq,
        response,
        injectedReq.data.responseScript,
        false,
        envName,
        n,
      );
      if (jasmineReport) {
        response.jasmineReport = jasmineReport;
      }
    }

    if (collection?.data?.responseScript) {
      const jasmineReport = await doResponseScript(
        injectedReq,
        response,
        collection?.data?.responseScript,
        true,
        envName,
        n,
      );
      if (!response.jasmineReport && jasmineReport) {
        response.jasmineReport = jasmineReport;
      }
    }

    return response;
  }

  async function doRequestScript(
    request: RestRequest,
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
      const request = findRequest(collections, requestId);
      if (!request || request.type !== 'REST') {
        throw Error(`REST Request with id ${requestId} not found`);
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

  async function doResponseScript(
    request: RestRequest,
    response: RestResponse,
    responseScript: string,
    isCollectionLevel: boolean,
    envName?: string,
    n?: number,
  ): Promise<JasmineReport | null> {
    // NOTE: cannot pass state on top level because it does not use most current state
    const set = (key: string, value: string) =>
      setEnvVar(request.collectionId, key, value, envName);
    const get = (key: string): string =>
      getEnvVar(request.collectionId, envName)(collections, key);
    const exec = async (requestId: number, envName?: string) => {
      const request = findRequest(collections, requestId);
      if (!request || request.type !== 'REST') {
        throw Error(`REST Request with id ${requestId} not found`);
      }
      if (!n) n = 0;
      return await sendRequest(request, envName, n + 1);
    };
    return await executeResponseScript(
      request,
      response,
      responseScript,
      set,
      get,
      exec,
      toast,
      isCollectionLevel,
      envName,
    );
  }

  async function sendRequestToExtension(
    request: RestRequest,
    envName?: string,
    timeout = 5,
  ): Promise<RestResponse> {
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
      }, timeout * 1000);

      let interpolatedRequest = { ...request };
      if (envName) {
        const collection = findCollection(collections, request.collectionId);
        if (!collection) {
          throw Error('Collection not found for id: ' + request.collectionId);
        }
        const selectedEnv = collection.data?.envs?.[envName];
        const selectedEnvData = selectedEnv?.data ?? {};
        const interpolateResult = interpolate(request, selectedEnvData);
        interpolatedRequest = interpolateResult.result;
      }

      if (interpolatedRequest.data.auth && interpolatedRequest.data.auth.enabled) {
        const authorizationHeader = extractAuthorizationHeader(
          interpolatedRequest.data.auth,
        );
        if (authorizationHeader) {
          interpolatedRequest.data.headers = [
            ...(interpolatedRequest.data.headers ?? []),
            { key: 'Authorization', value: authorizationHeader, isEnabled: true },
          ];
        }
      }

      switch (interpolatedRequest.data.contentType) {
        case 'application/x-www-form-urlencoded':
          if (interpolatedRequest.data.formDataBody) {
            interpolatedRequest.data.body = encodeFormDataBody(
              interpolatedRequest.data.formDataBody,
            );
          }
          break;
        case 'multipart/form-data':
          if (getMinorVersion(extVersion.current) < 9) {
            throw Error(`Multipart form data is not supported in this version of the extension. 
              Please update to the latest version or change to the Server proxy.`);
          }
      }

      const url = appendHttpIfNoProtocol(interpolatedRequest.data.uri);

      const headers = kvRowsToMap(interpolatedRequest.data.headers ?? []);

      const options: any = { headers, method: interpolatedRequest.data.method };
      if (interpolatedRequest.data.body) {
        options['body'] = interpolatedRequest.data.body;
      }

      window.postMessage(
        {
          url,
          type: 'send-request',
          options: options,
          req: interpolatedRequest,
          metaData: {
            messageId,
            envName,
          },
        },
        '*',
      );
    });
  }

  async function saveOnSend(request: RestRequest) {
    if (request.id === -1) return;

    let response = await api.updateRequest(request);
    if (response.status !== 200) {
      throw new Error(`Failed to save request [Status: ${response.status}]]`);
    }

    dispatchCollections({
      type: CollectionsActionType.PATCH_REQUEST_DATA,
      id: request.id,
      data: { ...request.data },
    });

    const collection = findCollection(collections, request.collectionId);
    if (!collection) return;

    response = await api.updateCollection(collection);
    if (response.status !== 200)
      throw new Error(`Failed to save collection [Status: ${response.status}]]`);
  }

  async function sendRequestToServer(
    request: RestRequest,
    envName?: string,
  ): Promise<RestResponse> {
    if (envName) {
      const collection = findCollection(collections, request.collectionId);
      if (!collection) {
        throw Error('Collection not found for id: ' + request.collectionId);
      }
      const selectedEnv = collection.data?.envs?.[envName];
      const selectedEnvData = selectedEnv?.data ?? {};
      const interpolateResult = interpolate(request, selectedEnvData);
      request = interpolateResult.result;
    }

    if (request.data.auth && request.data.auth.enabled) {
      const authorizationHeader = extractAuthorizationHeader(request.data.auth);
      if (authorizationHeader) {
        request.data.headers = [
          ...(request.data.headers ?? []),
          { key: 'Authorization', value: authorizationHeader, isEnabled: true },
        ];
      }
    }

    switch (request.data.contentType) {
      case 'application/x-www-form-urlencoded':
        if (request.data.formDataBody) {
          request.data.body = encodeFormDataBody(request.data.formDataBody);
        }
        break;
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
          handleSaveRequestClick={handleSaveRequestClick}
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
        onClick={handleSaveNewRESTRequestClick}
        isButtonDisabled={newReqForm.name === '' || newReqForm.collectionId === -1}
        buttonText="Save"
        buttonColor="green"
      >
        <Input
          placeholder="Name"
          w="100%"
          borderRadius={20}
          colorScheme="green"
          backgroundColor={colorMode === 'light' ? 'white' : undefined}
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
