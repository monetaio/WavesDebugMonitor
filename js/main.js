'use strict';

function mergeAll(objs) {
  return _.merge.apply(_, objs);
}

class Main {
  constructor(nodes) {
    this.nodes = nodes;
    this.domNodes = document.querySelector(".nodes");
    this.domErrors = document.querySelector(".errors");

    this.domApiKey = document.querySelector(".api-key");

    let nodesTemplate = document.querySelector("#nodes-template").innerText;
    this.renderNodes = Handlebars.compile(nodesTemplate);
  }

  run() {
    let requests = {
      "version": this.loadVersions(),
      "seed": this.loadSeed()
    };

    Promise
      .all(Object.values(requests))
      .then((data) => mergeAll(data))
      .then((nodes) => {
        this.refreshTable({
          attrs: Object.keys(requests),
          nodes: nodes
        })
      })
      .catch(e => {
        this.domErrors.innerText = e.name + ': ' + e.message;
      });
  }

  loadVersions() {
    return this.load((node) => {
      return this.apiRequest("GET", node, "/node/version")
        .then((response) => {
          let r = {};
          r[node] = {
            version: response.version
          };
          return r;
        })
    });
  }

  loadSeed() {
    return this.load((node) => {
      return this.apiRequest("GET", node, "/wallet/seed")
        .then((response) => {
          let r = {};
          r[node] = {
            seed: response.seed
          };
          return r;
        })
    });
  }

  load(f) {
    return Promise.all(this.nodes.map(f)).then((all) => mergeAll(all));
  }

  refreshTable(data) {
    this.domNodes.innerHTML = this.renderNodes(data);
    new Tablesort(this.domNodes);
  }

  apiRequest(method, rest, action) {
    let apiKey = this.domApiKey.value;
    return Utils.jsonHttpRequest(method, "http://" + rest + action, {
      // api_key: apiKey
    });
  }

  static loadNodes() {
    return Utils.jsonHttpRequest("GET", "data/nodes.json");
  }
}

Main.loadNodes().then(
  (nodes) => {
    console.log("Loaded nodes", nodes);
    window.MainApp = new Main(nodes)
  },
  (x) => console.error(x)
);
