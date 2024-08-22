"use strict";

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
