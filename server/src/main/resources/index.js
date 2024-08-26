async function exec(requestId, envName) {
    return new Promise((resolve, reject) => {
        requestSender.exec(requestId, envName).whenComplete((result, error) => {
              if (error) {
                    console.log(error);
                  reject(error);
              } else {
                    console.log(result);
                  resolve(result);
              }
          });
    });
}

(async function() {
try{
    %s
} catch(e) {
    console.log(e);
}
})();
