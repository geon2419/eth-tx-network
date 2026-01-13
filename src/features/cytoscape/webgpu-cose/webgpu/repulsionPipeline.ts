import type { RepulsionInput } from "./repulsionPacking";

/**
 * Configuration parameters for GPU repulsion force calculations.
 *
 * Controls node spacing, overlap handling, and numerical stability for the
 * physics simulation. Parameters are packed into GPU uniform buffer.
 */
export type RepulsionParams = {
  nodeCount: number;
  isCompound: boolean;
  nodeOverlap: number;
  epsilon: number;
  randomSeed: number;
};

/**
 * GPU buffer handles for compute shader data exchange.
 *
 * Manages storage buffers for node data and calculated forces,
 * plus uniform buffer for simulation parameters.
 */
export type WebGpuRepulsionBuffers = {
  nodes: GPUBuffer;
  forces: GPUBuffer;
  params: GPUBuffer;
};

/**
 * Complete WebGPU compute pipeline for repulsion force calculation.
 *
 * Encapsulates device, buffers, shader pipeline, and methods for updating
 * inputs, executing GPU dispatch, and reading results back to CPU.
 *
 * @example
 * ```ts
 * const pipeline = await createWebGpuRepulsionPipeline({ device, shaderCode, input, params });
 * pipeline.updateInputs(input);
 * await pipeline.dispatch();
 * const forces = await pipeline.readForces();
 * // forces: Float32Array with [fx0, fy0, fx1, fy1, ...]
 * ```
 */
export type WebGpuRepulsionPipeline = {
  device: GPUDevice;
  buffers: WebGpuRepulsionBuffers;
  bindGroup: GPUBindGroup;
  pipeline: GPUComputePipeline;
  updateInputs: (input: RepulsionInput) => void;
  updateParams: (params: RepulsionParams) => void;
  dispatch: () => Promise<void>;
  readForces: () => Promise<Float32Array>;
  destroy: () => void;
};

/**
 * Configuration for creating a WebGPU repulsion pipeline.
 */
type PipelineConfig = {
  device: GPUDevice;
  shaderCode: string;
  input: RepulsionInput;
  params: RepulsionParams;
};

const WORKGROUP_SIZE = 128;

/**
 * Calculates buffer size aligned to GPU memory alignment requirements.
 * @param size - Original buffer size in bytes
 * @param align - Alignment boundary in bytes (typically 4, 16, or 256)
 * @returns Size rounded up to next alignment boundary
 */
const paddedSize = (size: number, align: number) =>
  Math.ceil(size / align) * align;

/**
 * Creates GPU buffer initialized with data from typed array.
 * @param device - WebGPU device handle
 * @param array - Source data to copy into buffer
 * @param usage - GPU buffer usage flags (e.g., STORAGE, UNIFORM)
 * @returns GPU buffer with copied data
 */
const createBufferFromArray = (
  device: GPUDevice,
  array: ArrayBufferView,
  usage: GPUBufferUsageFlags
) => {
  const buffer = device.createBuffer({
    size: paddedSize(array.byteLength, 4),
    usage,
    mappedAtCreation: true,
  });
  const destination = new Uint8Array(buffer.getMappedRange());
  destination.set(
    new Uint8Array(array.buffer, array.byteOffset, array.byteLength)
  );
  buffer.unmap();
  return buffer;
};

/**
 * Creates GPU buffer initialized to zero with specified size.
 * @param device - WebGPU device handle
 * @param byteLength - Buffer size in bytes (will be padded to alignment)
 * @param usage - GPU buffer usage flags
 * @returns Zero-initialized GPU buffer
 */
const createZeroedBuffer = (
  device: GPUDevice,
  byteLength: number,
  usage: GPUBufferUsageFlags
) =>
  device.createBuffer({
    size: paddedSize(byteLength, 4),
    usage,
  });

const PARAM_FIELDS = [
  "nodeCount",
  "isCompound",
  "nodeOverlap",
  "epsilon",
  "randomSeed",
  "pad0",
  "pad1",
  "pad2",
] as const;

type PackedParams = Omit<RepulsionParams, "isCompound"> & {
  isCompound: number;
  pad0: number;
  pad1: number;
  pad2: number;
};

/**
 * Packs repulsion parameters into GPU-aligned uniform buffer format.
 *
 * Converts parameters to little-endian binary layout with padding for
 * 16-byte alignment. Booleans are converted to u32 (0 or 1).
 *
 * @param params - Repulsion simulation parameters
 * @returns ArrayBuffer with packed binary data
 */
const buildParamsData = (params: RepulsionParams) => {
  const packed: PackedParams = {
    nodeCount: params.nodeCount,
    isCompound: params.isCompound ? 1 : 0,
    nodeOverlap: params.nodeOverlap,
    epsilon: params.epsilon,
    randomSeed: params.randomSeed,
    pad0: 0,
    pad1: 0,
    pad2: 0,
  };

  const byteLength = PARAM_FIELDS.length * 4;
  const paddedLength = paddedSize(byteLength, 16);
  const buffer = new ArrayBuffer(paddedLength);
  const view = new DataView(buffer);
  let offset = 0;

  const writeU32 = (value: number) => {
    view.setUint32(offset, value, true);
    offset += 4;
  };
  const writeF32 = (value: number) => {
    view.setFloat32(offset, value, true);
    offset += 4;
  };

  PARAM_FIELDS.forEach((field) => {
    const value = packed[field];
    if (
      field === "nodeCount" ||
      field === "isCompound" ||
      field === "randomSeed" ||
      field === "pad0" ||
      field === "pad1" ||
      field === "pad2"
    ) {
      writeU32(value);
    } else {
      writeF32(value);
    }
  });

  return buffer;
};

const createBindGroupLayout = (device: GPUDevice) =>
  device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "uniform" },
      },
    ],
  });

const createBindGroup = (
  device: GPUDevice,
  layout: GPUBindGroupLayout,
  buffers: WebGpuRepulsionBuffers
) =>
  device.createBindGroup({
    layout,
    entries: [
      { binding: 0, resource: { buffer: buffers.nodes } },
      { binding: 1, resource: { buffer: buffers.forces } },
      { binding: 2, resource: { buffer: buffers.params } },
    ],
  });

/**
 * Requests a WebGPU device for compute shader execution.
 *
 * @returns Promise resolving to GPU device handle
 * @throws Error if WebGPU is not supported or adapter unavailable
 *
 * @example
 * ```ts
 * const device = await createWebGpuDevice();
 * // device ready for pipeline creation
 * ```
 */
export const createWebGpuDevice = async () => {
  if (!("gpu" in navigator)) {
    throw new Error("WebGPU not supported in this browser.");
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("WebGPU adapter not available.");
  }
  return adapter.requestDevice();
};

/**
 * Creates complete WebGPU compute pipeline for repulsion calculations.
 *
 * Initializes GPU buffers, compiles shader, sets up bind groups, and returns
 * pipeline handle with methods for updating data and executing compute passes.
 *
 * @param config - Pipeline configuration with device, shader, input data, and parameters
 * @returns Promise resolving to configured pipeline ready for dispatch
 *
 * @example
 * ```ts
 * const device = await createWebGpuDevice();
 * const pipeline = await createWebGpuRepulsionPipeline({
 *   device,
 *   shaderCode: WEBGPU_COSE_REPULSION_SHADER,
 *   input: createRepulsionInput(layoutInfo),
 *   params: { nodeCount: 100, isCompound: false, nodeOverlap: 10, epsilon: 0.01, randomSeed: 123 }
 * });
 * ```
 */
export const createWebGpuRepulsionPipeline = async ({
  device,
  shaderCode,
  input,
  params,
}: PipelineConfig): Promise<WebGpuRepulsionPipeline> => {
  let currentParams = params;
  const storageUsage =
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
  const buffers: WebGpuRepulsionBuffers = {
    nodes: createBufferFromArray(device, input.nodeBytes, storageUsage),
    forces: createZeroedBuffer(device, input.nodeCount * 8, storageUsage),
    params: createBufferFromArray(
      device,
      new Uint8Array(buildParamsData(params)),
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    ),
  };

  const bindGroupLayout = createBindGroupLayout(device);
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });
  const shaderModule = device.createShaderModule({ code: shaderCode });
  const pipeline = device.createComputePipeline({
    layout: pipelineLayout,
    compute: {
      module: shaderModule,
      entryPoint: "compute_repulsion",
    },
  });

  const bindGroup = createBindGroup(device, bindGroupLayout, buffers);

  const updateInputs = (next: RepulsionInput) => {
    device.queue.writeBuffer(buffers.nodes, 0, next.nodeBytes);
  };

  const updateParams = (nextParams: RepulsionParams) => {
    currentParams = nextParams;
    const data = buildParamsData(nextParams);
    device.queue.writeBuffer(buffers.params, 0, data);
  };

  const dispatch = async () => {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    const workgroups = Math.ceil(currentParams.nodeCount / WORKGROUP_SIZE);
    if (workgroups > 0) {
      pass.dispatchWorkgroups(workgroups);
    }
    pass.end();
    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();
  };

  const readForces = async () => {
    const byteLength = input.nodeCount * 8;
    const readBuffer = createZeroedBuffer(
      device,
      byteLength,
      GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    );

    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(buffers.forces, 0, readBuffer, 0, byteLength);
    device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(readBuffer.getMappedRange().slice(0));
    readBuffer.unmap();
    readBuffer.destroy();
    return data;
  };

  const destroy = () => {
    Object.values(buffers).forEach((buffer) => buffer.destroy());
  };

  return {
    device,
    buffers,
    bindGroup,
    pipeline,
    updateInputs,
    updateParams,
    dispatch,
    readForces,
    destroy,
  };
};
