"use strict";

const websockets = new Map();

async function sendRequest(request, sendResponse, senderUrl) {
  try {
    const startTime = Date.now();
    const options = await buildOptions(request, senderUrl);
    const response = await fetch(request.url, options);
    const time = Date.now() - startTime;
    const body = await response.text();
    const headers = [...response.headers].map((el) => ({
      key: el[0],
      value: el[1],
    }));
    sendResponse({
      metaData: request?.metaData,
      status: response.status,
      body,
      headers,
      time,
    });
  } catch (err) {
    sendResponse({
      metaData: request?.metaData,
      err: err.message
    });
  }
}

async function buildOptions(request, senderUrl) {
  if (!request.req) {
    return request.options;
  }
  const contentType = request.req.data.contentType;
  if (contentType !== "multipart/form-data") {
    return request.options;
  }
  const options = { ...request.options };
  const body = await buildFormDataBody(request.req.data.formDataBody, senderUrl);
  options.body = body;
  // NOTE: we need to delete the content type header because the browser will automatically set it
  // with the correct boundary
  if (options.headers) {
    for (let key in options.headers) {
      if (key.toLowerCase() === "content-type") {
        delete options.headers[key];
      }
    }
  }
  return options;
}

async function buildFormDataBody(body, senderUrl) {
  let host = senderUrl.split("/#/")[0];
  if (host.endsWith("/")) {
    host = host.slice(0, -1);
  }
  const formData = new FormData();
  if (!body) {
    return formData;
  }
  for (const part of body) {
    if (part.isEnabled === false) {
      continue;
    }
    if (part.type === "file") {
      const fileId = part.file?.id;
      if (!fileId) {
        continue;
      }
      const filename = part.file?.name || "unkown-filename";
      const res = await fetch(`${host}/api/files/${fileId}`);
      if (res.status !== 200) {
        throw new Error(`Failed to fetch file: ${filename}`);
      }
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type });
      formData.append(part.key, file);
    } else {
      formData.append(part.key, part.value);
    }
  }
  return formData;
}

function connectWebsocket(request, senderTabId, sendResponse) {
  const wsId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  let ws;
  try {
    ws = new WebSocket(request.uri);
  } catch (err) {
    console.error("error connecting to websocket", err);
    sendResponse({ status: "error", err: err.message });
    return;
  }

  console.log("connected to websocket", wsId);

  const connectionTimeout = setTimeout(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      ws.close();
      console.error("websocket connection timeout", wsId);
      sendResponse({ status: "error", err: "Connection timeout" });
    }
  }, 5000);

  ws.onclose = () => {
    console.log("websocket closed", wsId);
    websockets.delete(wsId);
    clearTimeout(connectionTimeout);
  };
  ws.onerror = (err) => {
    console.error("websocket error", wsId, err);
    chrome.tabs.sendMessage(senderTabId, {
      type: "ws-error",
      wsId: wsId,
      err: err.message
    });
  };
  ws.onopen = () => {
    websockets.set(wsId, ws);
    console.log("websocket opened", wsId);
    sendResponse({ status: "success", wsId, metaData: request.metaData });
  };
  ws.onmessage = (event) => {
    let parsedData;
    try {
      parsedData = JSON.stringify(event.data);
    } catch (e) {
      // If parsing fails, treat as string message
      parsedData = event.data;
    }
    console.log("websocket message", wsId, parsedData);
    chrome.tabs.sendMessage(senderTabId, {
      type: "ws-read",
      response: {
        wsId: wsId,
        message: parsedData,
      }
    });
  };
}

function writeWebsocket(request, sendResponse) {
  const ws = websockets.get(request.data.wsId);
  console.log("writeWebsocket", request.data);
  if (!ws) {
    sendResponse({ status: "error", err: "WebSocket not found", wsId: request.data.wsId, metaData: request.metaData });
    return;
  }
  if (ws.readyState !== WebSocket.OPEN) {
    sendResponse({ status: "error", err: "WebSocket is not open", wsId: request.data.wsId, metaData: request.metaData });
    return;
  }
  try {
    ws.send(request.data.message);
    sendResponse({ status: "success", wsId: request.data.wsId, metaData: request.metaData });
  } catch (err) {
    sendResponse({ status: "error", err: err.message, wsId: request.data.wsId, metaData: request.metaData });
  }
}

function disconnectWebsocket(request, sendResponse) {
  const ws = websockets.get(request.wsId);
  if (!ws) {
    sendResponse({ status: "error", err: "WebSocket not found", wsId: request.wsId, metaData: request.metaData });
    return;
  }
  try {
    ws.close();
    websockets.delete(request.wsId);
    sendResponse({ status: "success", wsId: request.wsId, metaData: request.metaData });
  } catch (err) {
    sendResponse({ status: "error", err: err.message, wsId: request.wsId, metaData: request.metaData });
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  chrome.storage.sync.get("host", ({ host }) => {
    let hostOrigin = ""
    let senderOrigin = ""
    try {
      hostOrigin = new URL(host).origin;
      senderOrigin = new URL(sender.tab.url).origin;
    } catch (e) {
      console.log("bad url", host, sender.tab.url);
    }
    if (hostOrigin && senderOrigin && hostOrigin === senderOrigin) {
      if (request.type === "send-request") {
        sendRequest(request, sendResponse, sender.tab.url);
      } else if (request.type === "ping") {
        console.log("Connected:", host)
        sendResponse();
      } else if (request.type === "ws-connect") {
        console.log("background ws-connect", request);
        connectWebsocket(request, sender.tab.id, sendResponse);
      } else if (request.type === "ws-write") {
        writeWebsocket(request, sendResponse);
      } else if (request.type === "ws-disconnect") {
        disconnectWebsocket(request, sendResponse);
      } else {
        console.log("bad request type", request.type);
      }
    } else {
      console.log("host not correct", host, sender.tab.url);
    }
  });
  // NOTE: return value required to keep port open for async response
  return true;
});
