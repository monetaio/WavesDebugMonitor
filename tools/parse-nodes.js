const fs = require('fs'),
  path = require('path');

if (process.argv.length < 3) {
  throw new Error("Specify path to a Ansible's inventory file (/full/path/to/inventory/waves/devnet)");
}

const file = fs.readFileSync(process.argv[2], {encoding: 'UTF-8'}),
  lines = file.split('\n');

const regexp = /^(.+)\s+node_id=(-?\d+)/;
let nodes = {};

for (let i = 0; i <= lines.length; i++) {
  const match = regexp.exec(lines[i]);
  if (match) {
    nodes[match[1].trim() + ':6869'] = {
      nodeId: +match[2]
    };
  }
}

const rootDir = path.normalize(path.dirname(process.argv[1]) + '/..'),
  destFile = rootDir + '/data/nodes.json';

fs.writeFileSync(destFile, JSON.stringify(nodes, null, 2), {encoding: 'UTF-8'});
console.log('New nodes are written to ' + destFile + ':');
console.log(nodes);
