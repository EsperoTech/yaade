"use strict";

async function sendRequest(request, sendResponse) {
  const response = await fetch(request.url, request.options);
  const body = await response.text();
  const headers = [...response.headers].map((el) => ({
    key: el[0],
    value: el[1],
  }));
  sendResponse({
    status: response.status,
    body: body,
    headers: headers,
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  chrome.storage.sync.get("host", ({ host }) => {
    if (host === sender.tab.url) {
      sendRequest(request, sendResponse);
    } else {
      console.log("host not correct", host, sender.tab.url);
    }
  });
  // NOTE: return value required to keep port open for async response
  return true;
});
