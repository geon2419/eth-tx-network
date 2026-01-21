import type { LayoutInfo } from "../domain/layoutInfo";

/**
 * GPU input data structure containing node positions and properties.
 *
 * Packs node data into contiguous memory buffers for efficient WebGPU transfer.
 * Each node occupies 12 fields (48 bytes) containing position, bounds, dimensions,
 * repulsion strength, component ID, graph index, and lock status.
 */
export type RepulsionInput = {
  nodeCount: number;
  nodeStride: number;
  nodeData: ArrayBuffer;
  nodeBytes: Uint8Array<ArrayBuffer>;
  nodeView: DataView;
};

const NODE_FIELD_COUNT = 12;
const NODE_STRIDE = NODE_FIELD_COUNT * 4;

/**
 * Creates GPU input buffers from layout node data.
 *
 * Allocates aligned memory buffers and populates them with node positions,
 * bounds, dimensions, and metadata for WebGPU compute shader processing.
 *
 * @param layoutInfo - Layout state containing node positions and properties
 * @returns GPU-ready input structure with packed node data
 *
 * @example
 * ```ts
 * const input = createRepulsionInput(layoutInfo);
 * // input.nodeCount: 100
 * // input.nodeData: ArrayBuffer with 4800 bytes (100 nodes × 48 bytes)
 * ```
 */
export const createRepulsionInput = (
  layoutInfo: LayoutInfo
): RepulsionInput => {
  const nodeCount = layoutInfo.layoutNodes.length;
  const nodeData = new ArrayBuffer(nodeCount * NODE_STRIDE);
  const nodeBytes = new Uint8Array(nodeData);
  const nodeView = new DataView(nodeData);

  const input: RepulsionInput = {
    nodeCount,
    nodeStride: NODE_STRIDE,
    nodeData,
    nodeBytes,
    nodeView,
  };

  updateRepulsionInput(layoutInfo, input);
  return input;
};

/**
 * Updates GPU input buffers with current node positions and bounds.
 *
 * Writes node data to existing buffers for incremental layout updates.
 * Each node writes 12 float32/int32 fields at its stride-aligned offset.
 *
 * @param layoutInfo - Current layout state with updated node positions
 * @param input - Existing GPU input structure to update in-place
 *
 * @example
 * ```ts
 * // After layout iteration updates node positions
 * updateRepulsionInput(layoutInfo, input);
 * // input.nodeBytes now contains updated positions for GPU
 * ```
 */
export const updateRepulsionInput = (
  layoutInfo: LayoutInfo,
  input: RepulsionInput
) => {
  const nodeCount = layoutInfo.layoutNodes.length;
  for (let i = 0; i < nodeCount; i += 1) {
    const node = layoutInfo.layoutNodes[i];
    const offset = i * input.nodeStride;
    input.nodeView.setFloat32(offset, node.positionX, true);
    input.nodeView.setFloat32(offset + 4, node.positionY, true);
    input.nodeView.setFloat32(offset + 8, node.minX ?? node.positionX, true);
    input.nodeView.setFloat32(offset + 12, node.maxX ?? node.positionX, true);
    input.nodeView.setFloat32(offset + 16, node.minY ?? node.positionY, true);
    input.nodeView.setFloat32(offset + 20, node.maxY ?? node.positionY, true);
    input.nodeView.setFloat32(offset + 24, node.width, true);
    input.nodeView.setFloat32(offset + 28, node.height, true);
    input.nodeView.setFloat32(offset + 32, node.nodeRepulsion, true);
    input.nodeView.setInt32(offset + 36, node.cmptId, true);
    input.nodeView.setInt32(offset + 40, layoutInfo.indexToGraph[i] ?? 0, true);
    input.nodeView.setUint32(offset + 44, node.isLocked ? 1 : 0, true);
  }
};
