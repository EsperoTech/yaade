import 'allotment/dist/style.css';

import { useToast } from '@chakra-ui/react';
import { Allotment } from 'allotment';
import beautify from 'json-beautify';
import { useEffect, useState } from 'react';

import Header from '../../components/header';
import RequestPanel from '../../components/requestPanel';
import ResponsePanel from '../../components/responsePanel';
import Sidebar from '../../components/sidebar';
import Collection from '../../model/Collection';
import KVRow from '../../model/KVRow';
import Request from '../../model/Request';
import Response from '../../model/Response';
import styles from './Dashboard.module.css';

const defaultRequest: Request = {
  id: -1,
  type: 'REST',
  data: {
    name: '',
    uri: '',
    method: 'GET',
    params: [
      {
        key: '',
        value: '',
      },
    ],
    headers: [
      {
        key: '',
        value: '',
      },
    ],
    body: '',
  },
  selected: true,
  isLoading: false,
  collectionId: -1,
};

function Dashboard() {
  const [collections, setCollections] = useState<Array<Collection>>([]);
  const [request, setRequest] = useState<Request>(defaultRequest);
  const toast = useToast();

  useEffect(() => {
    async function getCollections() {
      try {
        const response = await fetch('/api/collection');
        const collections = await response.json();
        setCollections(collections);
      } catch (e) {
        console.log(e);
        toast({
          title: 'Error.',
          description: 'Could not retrieve collections.',
          status: 'error',
          isClosable: true,
        });
      }
    }
    getCollections();
  }, []);

  function handleRequestClick(request: Request) {
    const newCollections = [...collections].map((collection) => {
      const requests = collection.requests.map((newReq) => ({
        ...newReq,
        selected: request.id === newReq.id,
      }));
      return {
        ...collection,
        requests,
      };
    });
    setCollections(newCollections);
    // TODO: ask user to save request before loading new content
    setRequest(request);
  }

  async function handleSendButtonClick() {
    if (request.isLoading) {
      setRequest({ ...request, isLoading: false });
      return;
    }
    const headers: Record<string, string> = {};
    request.data.headers.forEach(({ key, value }: KVRow) => {
      if (key === '') return;
      headers[key] = value;
    });

    const options: any = { headers };
    if (request.data.body) {
      options['body'] = JSON.stringify(request.data.body);
    }

    setRequest({ ...request, isLoading: true });

    try {
      const startTime = Date.now();
      const resp = await fetch(request.data.uri, options);
      const time = Date.now() - startTime;
      let responseBody = await resp.text();

      if (resp.headers.get('content-type') === 'application/json') {
        responseBody = beautify(JSON.parse(responseBody), null, 2, 20);
      }
      const responseHeaders: Array<KVRow> = [];
      for (const [k, v] of resp.headers.entries()) {
        responseHeaders.push({ key: k, value: v });
      }

      const response: Response = {
        uri: request.data.uri,
        headers: responseHeaders,
        body: responseBody,
        status: resp.status,
        time,
        size: 0,
      };
      setRequest({
        ...request,
        data: {
          ...request.data,
          response: response,
        },
        isLoading: false,
      });
    } catch (e) {
      console.log(e);
      toast({
        title: 'Error.',
        description: 'An error occured while sending the request.',
        status: 'error',
        isClosable: true,
      });
      setRequest({
        ...request,
        data: {
          ...request.data,
          response: undefined,
        },
        isLoading: false,
      });
    }
  }

  return (
    <div className={styles.parent}>
      <header>
        <Header />
      </header>
      <div className={styles.allotment}>
        <Allotment defaultSizes={[50, 200]} snap>
          <div className={styles.sidebar}>
            <Sidebar
              collections={collections}
              setCollections={setCollections}
              handleRequestClick={handleRequestClick}
            />
          </div>
          <div className={styles.main}>
            <Allotment vertical defaultSizes={[200, 100]} snap>
              <div className={styles.requestPanel}>
                <RequestPanel
                  request={request}
                  setRequest={setRequest}
                  handleSendButtonClick={handleSendButtonClick}
                />
              </div>
              <div className={styles.responsePanel}>
                <ResponsePanel response={request.data.response} />
              </div>
            </Allotment>
          </div>
        </Allotment>
      </div>
    </div>
  );
}

export default Dashboard;
