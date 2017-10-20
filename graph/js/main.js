var DATAFILE = "../data/nodes.json";

var linksSettings = {
  WHITELIST: '#55f',
  BLACKLIST: '#f55'
};

var patterns = [
  /.+\/\d+\.\d+\.\d+\.\d+:\d+$/,
  /\d+\.\d+\.\d+\.\d+:\d+/,
  /\d+\.\d+\.\d+\.\d+/
];

function ipAndPortFrom(x) {
  x = (x || "").replace(":6864", ":6869");
  var r = null;
  for (let i in patterns) {
    r = x.match(patterns[i]);
    if (r !== null) return r[0];
  }
  return r;
}

function removeIf(orig, p) {
  let nextIndex = function() {
    return orig.findIndex(p);
  };

  var i = nextIndex();
  while (i !== -1) {
    orig.splice(i, 1);
    i = nextIndex();
  }
}

function strcmp ( str1, str2 ) {
  return ( ( str1 === str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
}

function App() {
  this.nodes = [];
  this.autoRefresh = false;
  this.blacklist = [];

  var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

  this.d3Force = d3.layout.force();
  this.nodes = this.d3Force.nodes();
  this.links = this.d3Force.links();

  var g = svg
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  this.d3Links = g
    .append("g")
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .selectAll(".link");

  this.d3Nodes = g
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll(".node");
}

App.prototype.start = function () {
  var self = this;
  d3.json(DATAFILE, function (err, restEndpoints) {
    if (err) return console.error("Can't load REST endpoints");

    restEndpoints = Object.keys(restEndpoints);
    Array.prototype.push.apply(self.nodes, restEndpoints.map(function (x) {
      return {
        id: x
      }
    }));

    console.log("Nodes:", self.nodes);
    self._refreshUi();

    restEndpoints.forEach(function (x) {
      self.startRequestingPeers(x, function (err, rawLink) {
        self._removeLinksLike(rawLink);
        self.links.push(rawLink);
        self._refreshUi();
      });
    });
  });
};

App.prototype._removeLinksLike = function (link) {
  removeIf(this.links, function (x) {
    return x.source === link.source && x.target === link.target;
  });
};

App.prototype._removeOldLinks = function (restServer, type) {
  removeIf(this.links, function (x) {
    return x.source.id === restServer && x.type === type;
  });
};

App.prototype._startRequestWhitelist = function (restServer, linkCb, startLinks) {
  var self = this;
  startLinks = startLinks || [];

  d3.json("http://" + restServer + "/peers/connected", function (err, res) {
    var newLinks = res.peers
      .map(function (peer) {
        var ip = ipAndPortFrom(peer.declaredAddress);
        return ip ? self.newWhitelistLink(restServer, ip, peer) : null;
      })
      .filter(function (link) { return link !== null; })
      .sort(function (linkA, linkB) {
        var a = linkA.source + "-" + linkA.target;
        var b = linkB.source + "-" + linkB.target;
        return strcmp(a, b);
      });

    var theSame = startLinks.length === newLinks.length && startLinks.every(function (v,i) { return v === newLinks[i]; });
    if (!theSame) {
      self._removeOldLinks(restServer, self.linkTypes.WHITELIST);
      newLinks.forEach(linkCb.bind(self, null));
    }

    if (self.autoRefresh) {
      setTimeout(self._startRequestWhitelist.bind(self, restServer, linkCb, newLinks), 10000);
    }
  });
};

App.prototype._startRequestBlacklist = function (restServer, linkCb,  startLinks) {
  var self = this;
  startLinks = startLinks || [];

  d3.json("http://" + restServer + "/peers/blacklisted", function (err, res) {
    self._removeOldLinks(restServer);
    var newLinks = res
      .map(function (blacklistedPeer) {
        var ip = ipAndPortFrom(blacklistedPeer.reason);
        return ip ? self.newBlacklistLink(restServer, ip, blacklistedPeer) : null;
        // if (ip) {
        //   var link = self.newBlacklistLink(restServer, ip, blacklistedPeer);
        //   if (link) {
        //     console.log(
        //       "from:", restServer,
        //       "to:", ip,
        //       "reason:", blacklistedPeer.reason
        //     );
        //     linkCb(null, link);
        //   }
        // }
      })
      .filter(function (link) { return link !== null; })
      .sort(function (linkA, linkB) {
        var a = linkA.source + "-" + linkA.target;
        var b = linkB.source + "-" + linkB.target;
        return strcmp(a, b);
      });

    var theSame = startLinks.length === newLinks.length && startLinks.every(function (v,i) { return v === newLinks[i]; });
    if (!theSame) {
      self._removeOldLinks(restServer, self.linkTypes.BLACKLIST);
      newLinks.forEach(linkCb.bind(self, null));
    }

    if (self.autoRefresh) {
      setTimeout(self._startRequestBlacklist.bind(self, restServer, linkCb, newLinks), 5000);
    }
  });
};

App.prototype.startRequestingPeers = function (restServer, linkCb) {
  this._startRequestWhitelist(restServer, linkCb);
  this._startRequestBlacklist(restServer, linkCb);
};

App.prototype._refreshUi = function () {
  var self = this;

  self.d3Nodes = self.d3Nodes.data(this.nodes, function (d) {
    return d.id;
  });

  var d3NodesEnter = self.d3Nodes
    .enter()
    .append("g")
    .call(self.d3Force.drag);

  d3NodesEnter
    .append("circle")
    .attr("r", 5)
    .attr("fill", "black")
    .attr("dx", 12)
    .attr("dy", ".35em");

  d3NodesEnter
    .append("text")
    .attr("dx", 10)
    .attr("dy", 10)
    .text(function (d) {
      return d.id;
    });

  self.d3Nodes.exit().remove();


  self.d3Links = self.d3Links.data(self.links, function (d) {
    return d.source.id + "-" + d.target.id;
  });

  var d3LinksEnter = self.d3Links
    .enter()
    .append("g");

  d3LinksEnter
    .append("line")
    .attr("stroke", function (d) {
      return self.colors[d.type] || "#000";
    });

  d3LinksEnter
    .append("text")
    .text(function (l) {
      return (l.type === self.linkTypes.BLACKLIST) ? "[?]" : "";
    });

  self.d3Links.exit().remove();

  self.d3Force.on("tick", function () {
    self.d3Nodes
      .attr("transform", function (d) {
        return "translate(" + (d.x || 0) + "," + (d.y || 0) + ")";
      });

    self.d3Links
      .select("line")
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });

    self.d3Links
      .select("text")
      .attr("x", function (d) {
        return (d.source.x + d.target.x) / 2;
      })
      .attr("y", function (d) {
        return (d.source.y + d.target.y) / 2;
      });
  });

  self.d3Force
    .gravity(.01)
    .charge(-200)
    .distance(600)
    .linkStrength(0.1)
    .linkDistance(600)
    .alpha(1)
    .start();
};

App.prototype.linkTypes = (function () {
  var linkTypes = {};
  var i = 0;
  for (var k in linksSettings) {
    linkTypes[k] = i++;
  }

  return linkTypes;
})();

App.prototype.colors = (function () {
  var colors = [];
  for (var k in linksSettings) {
    colors.push(linksSettings[k]);
  }

  return colors;
})();

App.prototype.newWhitelistLink = function (from, to, orig) {
  var r = this.newLink(from, to, this.linkTypes.WHITELIST);
  if (!r) return r;

  return r;
};

App.prototype.newBlacklistLink = function (from, to, orig) {
  var r = this.newLink(from, to, this.linkTypes.BLACKLIST);
  if (!r) return r;

  r.reason = orig.reason;
  return r;
};

App.prototype.newLink = function (from, to, type) {
  var source = this.nodes.findIndex(function (x) {
    return x.id === from;
  });

  var target = this.nodes.findIndex(function (x) {
    return x.id === to;
  });

  return (source >= 0 && target >= 0) ? {
    source: source,
    target: target,
    type: type
  } : null;
};
