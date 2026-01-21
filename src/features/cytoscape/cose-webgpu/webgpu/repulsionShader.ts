import repulsionShaderSource from "../shaders/repulsion.wgsl";

/**
 * WGSL shader source code for GPU-accelerated repulsion force calculation.
 *
 * Implements n-body repulsion physics for graph layout using WebGPU compute shaders.
 * See repulsion.wgsl for shader implementation details.
 */
export const WEBGPU_COSE_REPULSION_SHADER = repulsionShaderSource;
