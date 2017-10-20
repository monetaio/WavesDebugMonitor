const fs = require('fs'),
  path = require('path');

if (process.argv.length < 3) {
  throw new Error("Specify path to a Ansible's inventory file (/full/path/to/inventory/waves/devnet)");
}

const file = fs.readFileSync(process.argv[2], {encoding: 'UTF-8'}),
  lines = file.split('\n');

const regexp = /^(.+)\s+node_id=(-?\d+)/;
let nodesRaw = [];
for (let i in lines) {
  const match = regexp.exec(lines[i]);
  if (match) {
    nodesRaw.push({
      restUrl: match[1].trim() + ':6869',
      nodeId: +match[2]
    });
  }
}
nodesRaw.sort((a, b) => b.nodeId - a.nodeId);

let nodes = {};
for (let i in nodesRaw) {
  let node = nodesRaw[i];
  nodes[node.restUrl] = {
    nodeId: node.nodeId
  };
}

const rootDir = path.normalize(path.dirname(process.argv[1]) + '/..'),
  destFile = rootDir + '/data/nodes.json';

fs.writeFileSync(destFile, JSON.stringify(nodes, null, 2), {encoding: 'UTF-8'});
console.log('New nodes are written to ' + destFile + ':');
console.log(nodes);
