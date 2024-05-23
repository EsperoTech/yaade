import './index.css';

import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom';
import { createHashRouter, RouterProvider } from 'react-router-dom';

import App from './App';

// NOTE: those polyfills might be needed later in case
// httpsnippet is making problems. I'll leave it in so
// it's easier to debug if needed.
// import { Readable } from 'stream-browserify';
// window.Buffer = Buffer;
// window.Readable = Readable;

const router = createHashRouter([
  {
    path: '*',
    element: <App />,
  },
]);

ReactDOM.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
  document.getElementById('root'),
);
