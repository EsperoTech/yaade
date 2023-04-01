"use strict";

window.addEventListener("message", function (event) {
  if (event.source == window && event.data) {
    if (event.data.type == "send-request") {
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
    }
  }
});
