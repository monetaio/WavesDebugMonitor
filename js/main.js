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
    setTimeout(() => {
      Promise
        .all([
          this.loadVersions(),
          // this.loadSeed(),
          this.loadUtx(),
          this.loadDebugInfo(),
          this.loadHistoryInfo(),
          this.loadMinerInfo(),
        ])
        .then((data) => mergeAll(data))
        .then((nodes) => {
          this.refreshTable({
            attrs: collectKeys(Object.values(nodes)),
            nodes: nodes
          });
          this.run();
        });
    }
  , 1000);
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


  loadUtx() {
    return this.load((node) => {
      return this.apiRequest("GET", node, "/transactions/unconfirmed/size")
        .then((response) => {
          return {
            UTX: response.size
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
            STATE: response.stateHeight +  "," + response.stateHash,
            persisted: response.blockchainDebugInfo.persisted.height + "," +  response.blockchainDebugInfo.persisted.hash,
            bottom: response.blockchainDebugInfo.bottom.height + "," + response.blockchainDebugInfo.bottom.hash,
            top: response.blockchainDebugInfo.top.height + "," + response.blockchainDebugInfo.top.hash,
            microHash: response.blockchainDebugInfo.microBaseHash
         //   lastBlockId : response.blockchainDebugInfo.lastBlockId.substring(0, 7) + "..."
          };
        })
        .catch((e) => {
          return {
            stateHeight: e.message,
            persisted: e.message,
            bottom: e.message,
            top: e.message,
            microHash: e.message
       //     lastBlockId : e.message
          };
        })
    });
  }

  loadHistoryInfo() {
    return this.load((node) => {
      return this.apiRequest("GET", node, "/debug/historyInfo")
        .then((response) => {
          return {
            lastMicros: response.microBlockIds.map( function(bid) {
              return bid.substring(0, 4) + "..~>"
            }).join('\n'),
            lastBlocks: response.lastBlockIds.map( function(bid) {
              return bid.substring(0, 4) + "..->"
            }).join('\n'),
          };
        })
        .catch((e) => {
          return {
            lastMicros: e.message,
            lastBlocks: e.message,
          };
        })
    });
  }


  loadMinerInfo() {
    return this.load((node) => {
      return this.apiRequest("GET", node, "/debug/minerInfo")
        .then((response) => {
          return {
            address: response[0].address.substring(0, 7) + "...",
            miningBalance: "~" + Math.ceil(response[0].miningBalance / 10000000) + " waves",
          //  timestamp: response[0].timestamp,
            in: (response[0].timestamp - new Date())/1000 + " seconds"
          };
        })
        .catch((e) => {
          return {
            address: "???",
            miningBalance: "???",
            // timestamp = "???"
            in: "???"
          };
        })
    });
  }


  loadSeed() {
    return this.load((node) => {
      return this.apiRequest("GET", node, "/wallet/seed")
        .then((response) => {
          return {
            seed: response.seed.substring(0, 7) + "..."
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
