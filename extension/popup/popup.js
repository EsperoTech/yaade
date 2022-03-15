"use strict";

var browser = browser || chrome;

const hostInput = document.querySelector("#host");

chrome.storage.sync.get("host", ({ host }) => {
  hostInput.value = host;
});

function saveHost() {
  chrome.storage.sync.set({ host: hostInput.value });
}

document.querySelector("#save").addEventListener("click", saveHost);
