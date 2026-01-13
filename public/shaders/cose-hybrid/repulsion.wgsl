@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> sizes: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> bounds: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read> repulsions: array<f32>;
@group(0) @binding(4) var<storage, read> components: array<u32>;
@group(0) @binding(5) var<storage, read> locked: array<u32>;
@group(0) @binding(6) var<storage, read_write> forces: array<vec4<f32>>;
@group(0) @binding(7) var<uniform> params: vec4<f32>;

fn rand01(a: f32, b: f32, seed: f32) -> f32 {
  return fract(sin(a * 12.9898 + b * 78.233 + seed * 0.01) * 43758.5453);
}

fn clippingPoint(pos: vec2<f32>, size: vec2<f32>, dx: f32, dy: f32) -> vec2<f32> {
  let X = pos.x;
  let Y = pos.y;
  let H = size.y;
  let W = size.x;
  let nodeSlope = H / W;

  if (dx == 0.0 && dy > 0.0) {
    return vec2<f32>(X, Y + H / 2.0);
  }
  if (dx == 0.0 && dy < 0.0) {
    return vec2<f32>(X, Y + H / 2.0);
  }

  let dirSlope = dy / dx;

  if (dx > 0.0 && dirSlope >= -nodeSlope && dirSlope <= nodeSlope) {
    return vec2<f32>(X + W / 2.0, Y + (W * dy / 2.0 / dx));
  }

  if (dx < 0.0 && dirSlope >= -nodeSlope && dirSlope <= nodeSlope) {
    return vec2<f32>(X - W / 2.0, Y - (W * dy / 2.0 / dx));
  }

  if (dy > 0.0 && (dirSlope <= -nodeSlope || dirSlope >= nodeSlope)) {
    return vec2<f32>(X + (H * dx / 2.0 / dy), Y + H / 2.0);
  }

  if (dy < 0.0 && (dirSlope <= -nodeSlope || dirSlope >= nodeSlope)) {
    return vec2<f32>(X - (H * dx / 2.0 / dy), Y - H / 2.0);
  }

  return vec2<f32>(X, Y);
}

@compute @workgroup_size(%%WORKGROUP_SIZE%%)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = id.x;
  let nodeCount = u32(params.x);
  if (i >= nodeCount) {
    return;
  }

  let useComponents = params.z < 0.5;
  let seed = params.w;

  var acc = vec2<f32>(0.0, 0.0);

  for (var j = 0u; j < nodeCount; j = j + 1u) {
    if (i == j) {
      continue;
    }

    if (useComponents && components[i] != components[j]) {
      continue;
    }

    var dx = positions[j].x - positions[i].x;
    var dy = positions[j].y - positions[i].y;

    if (dx == 0.0 && dy == 0.0) {
      let randX = rand01(f32(i), f32(j), seed);
      let randY = rand01(f32(j), f32(i), seed + 1.0);
      dx = -1.0 + 2.0 * randX;
      dy = -1.0 + 2.0 * randY;
    }

    let bounds1 = bounds[i];
    let bounds2 = bounds[j];
    var overlapX = 0.0;
    var overlapY = 0.0;

    if (dx > 0.0) {
      overlapX = bounds1.y - bounds2.x;
    } else {
      overlapX = bounds2.y - bounds1.x;
    }

    if (dy > 0.0) {
      overlapY = bounds1.w - bounds2.z;
    } else {
      overlapY = bounds2.w - bounds1.z;
    }

    var overlap = 0.0;
    if (overlapX >= 0.0 && overlapY >= 0.0) {
      overlap = sqrt(overlapX * overlapX + overlapY * overlapY);
    }

    var forceX = 0.0;
    var forceY = 0.0;

    if (overlap > 0.0) {
      let distance = sqrt(dx * dx + dy * dy);
      if (distance > 0.0) {
        let forceMag = params.y * overlap;
        forceX = forceMag * dx / distance;
        forceY = forceMag * dy / distance;
      }
    } else {
      let point1 = clippingPoint(positions[i].xy, sizes[i].xy, dx, dy);
      let point2 = clippingPoint(positions[j].xy, sizes[j].xy, -dx, -dy);
      let distX = point2.x - point1.x;
      let distY = point2.y - point1.y;
      let distSqr = distX * distX + distY * distY;
      if (distSqr > 0.0) {
        let dist = sqrt(distSqr);
        let forceMag = (repulsions[i] + repulsions[j]) / distSqr;
        forceX = forceMag * distX / dist;
        forceY = forceMag * distY / dist;
      }
    }

    acc = acc + vec2<f32>(-forceX, -forceY);
  }

  if (locked[i] == 1u) {
    forces[i] = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  } else {
    forces[i] = vec4<f32>(acc, 0.0, 0.0);
  }
}
