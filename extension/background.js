"use strict";

async function sendRequest(request, sendResponse) {
  try {
    const startTime = Date.now();
    const response = await fetch(request.url, request.options);
    const time = Date.now() - startTime;
    const body = await response.text();
    const headers = [...response.headers].map((el) => ({
      key: el[0],
      value: el[1],
    }));
    sendResponse({
      status: response.status,
      body,
      headers,
      time,
    });
  } catch (err) {
    sendResponse({
      err: err.message
    });
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  chrome.storage.sync.get("host", ({ host }) => {
    if (host === sender.tab.url) {
      if (request.type === "send-request") {
        sendRequest(request, sendResponse);
      } else if (request.type === "ping") {
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