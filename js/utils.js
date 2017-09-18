'use strict';
window.Utils = {
  jsonHttpRequest: (method, url, headers) => {
    headers = headers || {};

    return new Promise((resolve, reject) => {
      let req = new XMLHttpRequest();
      req.timeout = 5000;

      req.open(method, url, true);
      for (let k in headers) {
        req.setRequestHeader(k, headers[k]);
      }

      req.onreadystatechange = () => {
        if (req.readyState === XMLHttpRequest.DONE) {
          if (req.status === 200) {
            resolve(JSON.parse(req.responseText));
          } else {
            reject(new Error("An error during request: HTTP " + req.status + ", " + req.responseText));
          }
        }
      };

      try {
        req.send();
      } catch (e) {
        reject(e);
      }
    });
  }
};
