"use strict";

window.addEventListener("message", function (event) {
  if (
    event.source == window &&
    event.data &&
    event.data.type == "send-request"
  ) {
    chrome.runtime.sendMessage(event.data, function (response) {
      window.postMessage(
        {
          type: "receive-response",
          response,
        },
        "*"
      );
    });
  }
});
