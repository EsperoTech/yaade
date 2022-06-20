"use strict";

var browser = browser || chrome;

const hostInput = document.querySelector("#host");

chrome.storage.sync.get("host", ({ host }) => {
  if (host) {
    hostInput.value = host;
  }
});

function saveHost() {
  var newHost = hostInput.value
  if (!newHost.endsWith("/")) {
    newHost += "/"
  }

  chrome.storage.sync.set({ host: newHost });
  var btn = document.getElementById("save")
  var success = document.getElementById("success")
  btn.style.setProperty("display", "none")
  success.style.setProperty("display", "block")
}

document.querySelector("#save").addEventListener("click", saveHost);
