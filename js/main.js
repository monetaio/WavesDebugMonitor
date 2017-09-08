'use strict';

function mergeAll(objs) {
  return _.merge.apply(_, objs);
}

function collectKeys(objs) {
  return _.uniq(_.flatMap(objs, (o) => Object.keys(o)));
}

class Main {
  constructor(nodes) {
    this.nodes = nodes;
    this.domNodes = document.querySelector(".nodes");
    this.domApiKey = document.querySelector(".api-key");

    let nodesTemplate = document.querySelector("#nodes-template").innerText;
    this.renderNodes = Handlebars.compile(nodesTemplate);
  }

  run() {
    Promise
      .all([
        this.loadVersions(),
        this.loadSeed(),
        this.loadDebugInfo()
      ])
      .then((data) => mergeAll(data))
      .then((nodes) => {
        this.refreshTable({
          attrs: collectKeys(Object.values(nodes)),
          nodes: nodes
        })
      });
  }

  loadVersions() {
    return this.load((node) => {
      return this.apiRequest("GET", node, "/node/version")
        .then((response) => {
          return {
            version: response.version
          };
        })
        .catch((e) => {
          return {
            version: e.message
          };
        })
    });
  }

  loadDebugInfo() {
    return this.load((node) => {
      return this.apiRequest("GET", node, "/debug/info")
        .then((response) => {
          return {
            debugInfoTop: response.blockchainDebugInfo.top.height,
            debugInfoBottom: response.blockchainDebugInfo.bottom.height
          };
        })
        .catch((e) => {
          return {
            debugInfoTop: e.message,
            debugInfoBottom: e.message
          };
        })
    });
  }

  loadSeed() {
    return this.load((node) => {
      return this.apiRequest("GET", node, "/wallet/seed")
        .then((response) => {
          return {
            seed: response.seed
          };
        })
        .catch((e) => {
          return {
            seed: e.message
          };
        })
    });
  }

  load(f) {
    return Promise
      .all(
        this.nodes.map((node => {
          return f(node).then((r) => {
            let final = {};
            final[node] = r;
            return final;
          });
        }))
      )
      .then((all) => mergeAll(all));
  }

  refreshTable(data) {
    this.domNodes.innerHTML = this.renderNodes(data);
    new Tablesort(this.domNodes);
  }

  apiRequest(method, rest, action) {
    let apiKey = this.domApiKey.value;
    return Utils.jsonHttpRequest(method, "http://" + rest + action, {
      api_key: apiKey
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
