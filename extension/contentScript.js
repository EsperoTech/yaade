"use strict";

window.addEventListener("message", function (event) {
  if (event.source == window && event.data) {
    if (event.data.type == "send-request") {
      console.log("send-request", event.data);
      chrome.runtime.sendMessage(event.data, function (response) {
        window.postMessage(
          {
            type: "receive-response",
            response,
          },
          "*"
        );
      });
    } else if (event.data.type == "ping") {
      chrome.runtime.sendMessage(event.data, function () {
        window.postMessage(
          {
            type: "pong",
            version: chrome.runtime.getManifest().version,
          },
          "*"
        );
      });
    } else if (event.data.type == "ws-connect") {
      console.log("ws-connect2", event.data);
      chrome.runtime.sendMessage(event.data, function (response) {
        console.log("ws-connected", response);
        window.postMessage({ type: "ws-connected", response }, "*");
      });
    } else if (event.data.type == "ws-disconnect") {
      chrome.runtime.sendMessage(event.data, function (response) {
        window.postMessage({ type: "ws-disconnected", response }, "*");
      });
    } else if (event.data.type == "ws-write") {
      console.log("ws-write", event.data);
      chrome.runtime.sendMessage(event.data, function (response) {
        console.log("ws-written", response);
        window.postMessage({ type: "ws-written", response }, "*");
      });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'ws-read') {
    console.log("ws-read", message);
    window.postMessage(message, "*");
  } else {
    console.log("unknown message", message);
  }
});
