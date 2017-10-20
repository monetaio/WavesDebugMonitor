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
  },

  // https://stackoverflow.com/a/30810322/4050580
  copyTextToClipboard: (text) => {
    let textArea = document.createElement("textarea");

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';

    textArea.value = text;

    document.body.appendChild(textArea);

    textArea.select();

    try {
      let successful = document.execCommand('copy');
      let msg = successful ? 'successful' : 'unsuccessful';
      console.log('Copying text command was', msg);
    } catch (err) {
      console.log('Oops, unable to copy');
    }

    document.body.removeChild(textArea);
  }

};

Handlebars.registerHelper('if_eq', function(a, b, opts) {
  if (a === b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});
