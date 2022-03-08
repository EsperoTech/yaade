import 'allotment/dist/style.css';

import { Allotment } from 'allotment';
import { useState } from 'react';

import Header from '../../components/header';
import RequestPanel from '../../components/requestPanel';
import ResponsePanel from '../../components/responsePanel';
import Sidebar from '../../components/sidebar';
import Collection from '../../model/Collection';
import Request from '../../model/Request';
import Response from '../../model/Response';
import styles from './Dashboard.module.css';

const defaultCollections: Array<Collection> = [
  {
    id: 1,
    name: 'hello',
    open: false,
    requests: [
      {
        id: 2,
        name: 'aaa',
        uri: 'http://abc.de',
        method: 'GET',
        params: [
          {
            key: '111',
            value: '2222',
          },
        ],
        headers: [
          {
            key: '333',
            value: '444',
          },
        ],
        body: 'abcde',
        selected: false,
      },
    ],
  },
  {
    id: 3,
    name: 'hello',
    open: false,
    requests: [
      {
        id: 4,
        name: 'aaa',
        uri: 'http://abc.de',
        method: 'POST',
        params: [
          {
            key: 'abc',
            value: '123',
          },
        ],
        headers: [
          {
            key: 'xxx',
            value: 'yyy',
          },
        ],
        body: '',
        selected: false,
      },
    ],
  },
];

const defaultRequest: Request = {
  id: -1,
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
};

function Dashboard() {
  const [collections, setCollections] = useState<Array<Collection>>(defaultCollections);
  const [request, setRequest] = useState<Request>(defaultRequest);
  const [response, setResponse] = useState<Response | null>(null);

  function handleRequestClick(request: Request) {
    // TODO: ask user to save request before loading new content
    setRequest(request);
  }

  function handleSendButtonClicked() {}

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
                  handleSendButtonClicked={handleSendButtonClicked}
                />
              </div>
              <div className={styles.responsePanel}>
                <ResponsePanel response={response} />
              </div>
            </Allotment>
          </div>
        </Allotment>
      </div>
    </div>
  );
}

export default Dashboard;
