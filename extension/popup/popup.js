"use strict";

var browser = browser || chrome;

const hostInput = document.querySelector("#host");

chrome.storage.sync.get("host", ({ host }) => {
  hostInput.value = host;
});

function saveHost() {
  chrome.storage.sync.set({ host: hostInput.value });
  var btn = document.getElementById("save")
  var success = document.getElementById("success")
  btn.style.setProperty("display", "none")
  success.style.setProperty("display", "block")
}

document.querySelector("#save").addEventListener("click", saveHost);
