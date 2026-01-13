struct NodeData {
  x: f32,
  y: f32,
  minX: f32,
  maxX: f32,
  minY: f32,
  maxY: f32,
  width: f32,
  height: f32,
  repulsion: f32,
  cmptId: i32,
  graphId: i32,
  locked: u32,
}

struct ForceData {
  fx: f32,
  fy: f32,
}

struct Params {
  nodeCount: u32,
  isCompound: u32,
  nodeOverlap: f32,
  epsilon: f32,
  randomSeed: u32,
  pad0: u32,
  pad1: u32,
  pad2: u32,
}

@group(0) @binding(0) var<storage, read_write> nodes: array<NodeData>;
@group(0) @binding(1) var<storage, read_write> forces: array<ForceData>;
@group(0) @binding(2) var<uniform> params: Params;

// Linear Congruential Generator (LCG)
// Generates pseudo-random seed values for randomization
// @param value Current seed value
// @return Next pseudo-random seed
fn lcg(value: u32) -> u32 {
  return value * 1664525u + 1013904223u;
}

// Converts an integer seed to a floating-point random number in the range [0.0, 1.0]
// @param value Seed value generated from LCG
// @return Floating-point random number between 0.0 and 1.0
fn rand(value: u32) -> f32 {
  return f32(value) / 4294967295.0;
}

// Generates a random direction vector based on two node indices and a seed
// Used to create random jitter when node positions completely overlap
// @param i First node index
// @param j Second node index
// @param seed Global random seed
// @return 2D direction vector in the range [-1.0, 1.0]
fn random_dir(i: u32, j: u32, seed: u32) -> vec2<f32> {
  var state = seed ^ (i * 374761393u) ^ (j * 668265263u);
  state = lcg(state);
  let r1 = rand(state);
  state = lcg(state);
  let r2 = rand(state);
  return vec2<f32>(r1 * 2.0 - 1.0, r2 * 2.0 - 1.0);
}

// Checks if two nodes' bounding boxes overlap and calculates overlap distance
// @param nodeA First node data
// @param nodeB Second node data
// @param dX Distance between nodes on X-axis (nodeB.x - nodeA.x)
// @param dY Distance between nodes on Y-axis (nodeB.y - nodeA.y)
// @return Overlap distance if overlapping, 0.0 otherwise
fn nodes_overlap(
  nodeA: NodeData,
  nodeB: NodeData,
  dX: f32,
  dY: f32
) -> f32 {
  var overlapX: f32;
  if (dX > 0.0) {
    overlapX = nodeA.maxX - nodeB.minX;
  } else {
    overlapX = nodeB.maxX - nodeA.minX;
  }

  var overlapY: f32;
  if (dY > 0.0) {
    overlapY = nodeA.maxY - nodeB.minY;
  } else {
    overlapY = nodeB.maxY - nodeA.minY;
  }

  if (overlapX >= 0.0 && overlapY >= 0.0) {
    return sqrt(overlapX * overlapX + overlapY * overlapY);
  }
  return 0.0;
}

// Calculates the intersection point (clipping point) at a node's rectangular boundary in a given direction
// Finds the point where a line from the node center in a specific direction meets the node boundary
// @param x Node center X coordinate
// @param y Node center Y coordinate
// @param width Node width
// @param height Node height
// @param dX Direction vector X component
// @param dY Direction vector Y component
// @return Intersection point coordinates with the node boundary
fn find_clipping_point(
  x: f32,
  y: f32,
  width: f32,
  height: f32,
  dX: f32,
  dY: f32
) -> vec2<f32> {
  let w = select(1.0, width, width != 0.0);
  let h = select(1.0, height, height != 0.0);
  var dirSlope = 0.0;
  if (dX != 0.0) {
    dirSlope = dY / dX;
  }
  let nodeSlope = h / w;
  var res = vec2<f32>(x, y);

  if (dX == 0.0 && dY > 0.0) {
    res.x = x;
    res.y = y + h / 2.0;
    return res;
  }

  if (dX == 0.0 && dY < 0.0) {
    res.x = x;
    res.y = y + h / 2.0;
    return res;
  }

  if (dX > 0.0 && -nodeSlope <= dirSlope && dirSlope <= nodeSlope) {
    res.x = x + w / 2.0;
    res.y = y + (w * dY) / 2.0 / dX;
    return res;
  }

  if (dX < 0.0 && -nodeSlope <= dirSlope && dirSlope <= nodeSlope) {
    res.x = x - w / 2.0;
    res.y = y - (w * dY) / 2.0 / dX;
    return res;
  }

  if (dY > 0.0 && (dirSlope <= -nodeSlope || dirSlope >= nodeSlope)) {
    res.x = x + (h * dX) / 2.0 / dY;
    res.y = y + h / 2.0;
    return res;
  }

  if (dY < 0.0 && (dirSlope <= -nodeSlope || dirSlope >= nodeSlope)) {
    res.x = x - (h * dX) / 2.0 / dY;
    res.y = y - h / 2.0;
    return res;
  }

  return res;
}

// Computes repulsion forces for all node pairs - GPU parallel processing compute shader
// Each workgroup item handles one node and calculates repulsion from all other nodes
// - When nodes overlap: Apply strong repulsion to eliminate overlap
// - General case: Apply repulsion inversely proportional to distance squared (similar to Coulomb's law)
// @param gid GPU global index (corresponds to each node)
@compute @workgroup_size(128)
fn compute_repulsion(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= params.nodeCount) {
    return;
  }

  if (nodes[i].locked != 0u) {
    forces[i].fx = 0.0;
    forces[i].fy = 0.0;
    return;
  }

  let nodeA = nodes[i];
  
  var fx = 0.0;
  var fy = 0.0;
  var j: u32 = 0u;

  loop {
    if (j >= params.nodeCount) {
      break;
    }
    
    if (j == i) {
      j += 1u;
      continue;
    }

    let nodeB = nodes[j];
    if (nodeB.graphId != nodeA.graphId) {
      j += 1u;
      continue;
    }

    if (params.isCompound == 0u && nodeB.cmptId != nodeA.cmptId) {
      j += 1u;
      continue;
    }

    var dx = nodeB.x - nodeA.x;
    var dy = nodeB.y - nodeA.y;
    if (dx == 0.0 && dy == 0.0) {
      let jitter = random_dir(i, j, params.randomSeed);
      dx = jitter.x;
      dy = jitter.y;
    }

    let overlap = nodes_overlap(nodeA, nodeB, dx, dy);
    if (overlap > 0.0) {
      let dist = sqrt(dx * dx + dy * dy + params.epsilon);
      if (dist != 0.0) {
        let force = params.nodeOverlap * overlap;
        fx -= (force * dx) / dist;
        fy -= (force * dy) / dist;
      }
      j += 1u;
      continue;
    }

    let p1 = find_clipping_point(nodeA.x, nodeA.y, nodeA.width, nodeA.height, dx, dy);
    let p2 = find_clipping_point(nodeB.x, nodeB.y, nodeB.width, nodeB.height, -dx, -dy);
    
    let distX = p2.x - p1.x;
    let distY = p2.y - p1.y;

    let distSq = distX * distX + distY * distY + 1e-4;
    let dist = sqrt(distSq);
    
    let force = (nodeA.repulsion + nodeB.repulsion) / distSq;

    fx -= (force * distX) / dist;
    fy -= (force * distY) / dist;

    j += 1u;
  }

  forces[i].fx = fx;
  forces[i].fy = fy;
}
