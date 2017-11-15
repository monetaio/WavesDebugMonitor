'use strict';

class Form {
  constructor() {
    this.domApiKey = document.querySelector(".api-key");
    this.domApiKey.onchange = () => {
      window.localStorage.setItem("api-key", this.domApiKey.value);
    };
  }

  run() {
    let apiKey = window.localStorage.getItem("api-key");
    if (apiKey) {
      this.domApiKey.value = apiKey;
    }
  }
}

window.Form = new Form;
window.Form.run();
