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
        sendRequest(request, sendResponse);
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
