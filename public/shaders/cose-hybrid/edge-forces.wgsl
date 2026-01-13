@group(0) @binding(0) var<storage, read> positions: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> sizes: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read> edgeOffsets: array<u32>;
@group(0) @binding(3) var<storage, read> edgeTargets: array<u32>;
@group(0) @binding(4) var<storage, read> edgeParams: array<vec2<f32>>;
@group(0) @binding(5) var<storage, read> locked: array<u32>;
@group(0) @binding(6) var<storage, read_write> forces: array<vec4<f32>>;
@group(0) @binding(7) var<uniform> params: vec4<f32>;

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

  if (locked[i] == 1u) {
    forces[i] = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    return;
  }

  let start = edgeOffsets[i];
  let end = edgeOffsets[i + 1u];

  var acc = vec2<f32>(0.0, 0.0);

  for (var k = start; k < end; k = k + 1u) {
    let packed = edgeTargets[k];
    let isSource = (packed & 0x80000000u) != 0u;
    let other = packed & 0x7fffffffu;
    var sourceIdx = i;
    var targetIdx = other;
    var sign = 1.0;
    if (!isSource) {
      sourceIdx = other;
      targetIdx = i;
      sign = -1.0;
    }

    let sourcePos = positions[sourceIdx].xy;
    let targetPos = positions[targetIdx].xy;
    let dx = targetPos.x - sourcePos.x;
    let dy = targetPos.y - sourcePos.y;

    if (dx == 0.0 && dy == 0.0) {
      continue;
    }

    let sourceSize = sizes[sourceIdx].xy;
    let targetSize = sizes[targetIdx].xy;
    let point1 = clippingPoint(sourcePos, sourceSize, dx, dy);
    let point2 = clippingPoint(targetPos, targetSize, -dx, -dy);

    let lx = point2.x - point1.x;
    let ly = point2.y - point1.y;
    let l = sqrt(lx * lx + ly * ly);
    if (l == 0.0) {
      continue;
    }

    let edgeParam = edgeParams[k];
    let diff = edgeParam.x - l;
    let force = (diff * diff) / edgeParam.y;
    let forceX = force * lx / l;
    let forceY = force * ly / l;
    acc = acc + vec2<f32>(forceX * sign, forceY * sign);
  }

  forces[i] = vec4<f32>(acc.x, acc.y, 0.0, 0.0);
}
