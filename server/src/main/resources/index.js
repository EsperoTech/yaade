const __internalLogs = [];
let __internalError = null;
//console = null;
let __callback = function() {}

function registerCallback(callback) {
    __callback = callback;
}

function __doCallback(resString) {
    const res = JSON.parse(resString);
    __callback(res);
}

function __getInternalLogs() {
    return JSON.stringify(__internalLogs);
}

function log(...messages) {
    console.log(messages)
    const time = Date.now();
    __internalLogs.push({
        time,
        message: messages?.join(' ')
    });
}

async function exec(requestId, envName) {
    return new Promise((resolve, reject) => {
        __exec.exec(requestId, envName).whenComplete((result, error) => {
              if (error) {
                  reject(error);
              } else {
                  resolve(result);
              }
          });
    });
}

(async function() {
try {
    // ------- THE SCRIPT -------
    %s
    // --------------------------
    await jasmine.getEnv().execute();
} catch (e) {
    __internalError = e.message;
} finally {
    __continuation.resume();
}
})();
