import type cytoscape from "cytoscape";

import {
  calculateEdgeForces,
  calculateGravityForces,
  calculateNodeForces,
  getScaleInBoundsFn,
  propagateForces,
  randomizePositions,
  refreshPositions,
  separateComponents,
  stepLayout,
  updatePositions,
} from "./cosePhysics";
import { createLayoutInfo, type LayoutInfo } from "../domain/layoutInfo";
import {
  resolveLayoutOptions,
  type CoseLayoutOptions,
  type ResolvedCoseLayoutOptions,
} from "../domain/layoutOptions";
import {
  createRepulsionInput,
  updateRepulsionInput,
  type RepulsionInput,
} from "../webgpu/repulsionPacking";
import {
  createWebGpuDevice,
  createWebGpuRepulsionPipeline,
  type RepulsionParams,
  type WebGpuRepulsionPipeline,
} from "../webgpu/repulsionPipeline";
import { WEBGPU_COSE_REPULSION_SHADER } from "../webgpu/repulsionShader";

type CytoscapeType = typeof cytoscape;

type WebGpuCoseLayoutOptions = CoseLayoutOptions & {
  useWebGpu?: boolean;
  gpuShaderCode?: string;
  gpuDevice?: GPUDevice;
  onLayoutMode?: (mode: "cpu" | "gpu" | "fallback") => void;
};

/**
 * Filters layout elements to include only nodes and edges with both endpoints present.
 * @param cy - Cytoscape core instance
 * @param options - Layout options containing element selector
 * @returns Filtered collection excluding orphaned edges
 */
const resolveElements = (
  cy: cytoscape.Core,
  options: WebGpuCoseLayoutOptions
) => {
  const base = options.eles ? cy.collection(options.eles) : cy.elements();
  const nodes = base.nodes();
  const edges = base.edges();
  const nodeIds = new Set<string>();
  nodes.forEach((node) => {
    nodeIds.add(node.id());
  });

  const notEdges = edges.filter((edge) => {
    const sourceId = edge.source().id();
    const targetId = edge.target().id();
    return !nodeIds.has(sourceId) || !nodeIds.has(targetId);
  });

  return notEdges.length > 0 ? base.not(notEdges) : base;
};

/**
 * Builds GPU repulsion parameters from layout configuration.
 * @param layoutInfo - Current layout state with node data
 * @param options - Resolved layout options
 * @param randomSeed - Random seed for GPU computations
 * @returns Repulsion parameters for GPU pipeline
 */
const buildRepulsionParams = (
  layoutInfo: LayoutInfo,
  options: ResolvedCoseLayoutOptions,
  randomSeed: number
): RepulsionParams => ({
  nodeCount: layoutInfo.layoutNodes.length,
  isCompound: layoutInfo.isCompound,
  nodeOverlap: options.nodeOverlap,
  epsilon: 0,
  randomSeed,
});

/**
 * Applies GPU-computed repulsion forces to unlocked nodes.
 * @param layoutInfo - Layout state containing node positions
 * @param forces - Flat array of [fx0, fy0, fx1, fy1, ...] force vectors
 */
const applyGpuForces = (layoutInfo: LayoutInfo, forces: Float32Array) => {
  for (let i = 0; i < layoutInfo.layoutNodes.length; i += 1) {
    const node = layoutInfo.layoutNodes[i];
    if (node.isLocked) continue;
    const offset = i * 2;
    node.offsetX += forces[offset] ?? 0;
    node.offsetY += forces[offset + 1] ?? 0;
  }
};

/**
 * GPU-accelerated COSE layout algorithm with CPU fallback.
 *
 * Implements a compound spring embedder layout using WebGPU for repulsion
 * force calculations. Falls back to CPU when GPU is unavailable.
 *
 * @example
 * ```ts
 * const layout = new WebGpuCoseLayout({
 *   cy,
 *   useWebGpu: true,
 *   numIter: 1000,
 *   gravity: 0.5
 * });
 * layout.run();
 * ```
 */
class WebGpuCoseLayout {
  private options: WebGpuCoseLayoutOptions;
  private stopped = false;
  private layoutMode: "cpu" | "gpu" | "fallback" | null = null;

  constructor(options: WebGpuCoseLayoutOptions) {
    this.options = options;
  }

  run() {
    const cy = this.options.cy;
    if (!cy || this.stopped) {
      return this;
    }

    this.stopped = false;

    const resolvedOptions = resolveLayoutOptions(this.options, this);
    const eles = resolveElements(cy, this.options);
    resolvedOptions.eles = eles;

    const emitStart =
      resolvedOptions.animate === true || resolvedOptions.animate === false;
    if (emitStart) {
      cy.emit("layoutstart", [this]);
    }

    const layoutInfo = createLayoutInfo(cy, eles, resolvedOptions);

    if (resolvedOptions.randomize) {
      randomizePositions(layoutInfo);
    }

    if (layoutInfo.layoutNodes.length === 0) {
      this.setLayoutMode("cpu");
      void this.runWithCpu(cy, layoutInfo, resolvedOptions, emitStart);
      return this;
    }

    const useWebGpu =
      this.options.useWebGpu ?? Boolean(this.options.gpuShaderCode);

    if (useWebGpu) {
      void this.runWithWebGpu(cy, layoutInfo, resolvedOptions, emitStart);
      return this;
    }

    this.setLayoutMode("cpu");
    void this.runWithCpu(cy, layoutInfo, resolvedOptions, emitStart);

    return this;
  }

  private setLayoutMode(mode: "cpu" | "gpu" | "fallback") {
    if (this.layoutMode === mode) return;
    this.layoutMode = mode;
    this.options.onLayoutMode?.(mode);
  }

  private async runWithCpu(
    cy: cytoscape.Core,
    layoutInfo: LayoutInfo,
    options: ResolvedCoseLayoutOptions,
    emitStart: boolean
  ) {
    await this.runLoop(cy, layoutInfo, options, emitStart, async () => {
      stepLayout(layoutInfo, options);
    });
  }

  private async runWithWebGpu(
    cy: cytoscape.Core,
    layoutInfo: LayoutInfo,
    options: ResolvedCoseLayoutOptions,
    emitStart: boolean
  ) {
    const shaderCode =
      this.options.gpuShaderCode ?? WEBGPU_COSE_REPULSION_SHADER;
    const randomSeed = Math.floor(Math.random() * 4294967295);

    let repulsionInput: RepulsionInput | null = null;
    let pipeline: WebGpuRepulsionPipeline | null = null;
    let useGpu = true;

    try {
      const device = this.options.gpuDevice ?? (await createWebGpuDevice());
      repulsionInput = createRepulsionInput(layoutInfo);
      pipeline = await createWebGpuRepulsionPipeline({
        device,
        shaderCode,
        input: repulsionInput,
        params: buildRepulsionParams(layoutInfo, options, randomSeed),
      });
      this.setLayoutMode("gpu");
    } catch {
      useGpu = false;
      this.setLayoutMode("fallback");
    }

    const step = async () => {
      if (useGpu && pipeline && repulsionInput) {
        try {
          updateRepulsionInput(layoutInfo, repulsionInput);
          pipeline.updateInputs(repulsionInput);
          await pipeline.dispatch();
          const forces = await pipeline.readForces();
          applyGpuForces(layoutInfo, forces);
        } catch {
          useGpu = false;
          pipeline.destroy();
          pipeline = null;
          this.setLayoutMode("fallback");
          calculateNodeForces(layoutInfo, options);
        }
      } else {
        calculateNodeForces(layoutInfo, options);
      }

      calculateEdgeForces(layoutInfo);
      calculateGravityForces(layoutInfo, options);
      propagateForces(layoutInfo);
      updatePositions(layoutInfo);
    };

    await this.runLoop(cy, layoutInfo, options, emitStart, step);
    pipeline?.destroy();
  }

  private async runLoop(
    cy: cytoscape.Core,
    layoutInfo: LayoutInfo,
    options: ResolvedCoseLayoutOptions,
    emitStart: boolean,
    step: () => Promise<void>
  ) {
    const startTime = performance.now();

    const refresh = () => {
      refreshPositions(layoutInfo, cy, options);
      if (options.fit) {
        cy.fit(options.eles, options.padding);
      }
    };

    const done = () => {
      if (options.animate === true || options.animate === false) {
        refresh();
        if (options.stop && emitStart) {
          cy.one("layoutstop", options.stop);
        }
        cy.emit("layoutstop", [this]);
        return;
      }

      const nodes = cy.collection(options.eles).nodes();
      const getScaledPos = getScaleInBoundsFn(layoutInfo, options, nodes);
      // @ts-expect-error cytoscape layout signature doesn't include custom options.
      nodes.layoutPositions(this, options, getScaledPos);
    };

    const mainLoop = async (i: number) => {
      if (this.stopped || i >= options.numIter) {
        return false;
      }

      await step();

      layoutInfo.temperature = layoutInfo.temperature * options.coolingFactor;
      if (layoutInfo.temperature < options.minTemp) {
        return false;
      }

      return true;
    };

    let i = 0;
    let loopRet = true;

    if (options.animate === true) {
      const frame = async () => {
        let f = 0;
        while (loopRet && f < options.refresh) {
          loopRet = await mainLoop(i);
          i += 1;
          f += 1;
        }

        if (!loopRet || this.stopped) {
          separateComponents(layoutInfo, options);
          done();
          return;
        }

        const now = performance.now();
        if (now - startTime >= options.animationThreshold) {
          refresh();
        }

        requestAnimationFrame(() => {
          void frame();
        });
      };

      void frame();
      return;
    }

    while (loopRet) {
      loopRet = await mainLoop(i);
      i += 1;
    }

    separateComponents(layoutInfo, options);
    done();
  }

  stop() {
    this.stopped = true;
    this.options.cy.emit("layoutstop", [this]);
    return this;
  }

  destroy() {
    return this;
  }
}

function WebGpuCoseLayoutConstructor(
  this: WebGpuCoseLayout,
  options: WebGpuCoseLayoutOptions
) {
  Object.assign(this, new WebGpuCoseLayout(options));
}
WebGpuCoseLayoutConstructor.prototype = WebGpuCoseLayout.prototype;

/**
 * Registers the WebGPU-accelerated COSE layout with Cytoscape.
 *
 * @param cytoscape - Cytoscape library instance
 *
 * @example
 * ```ts
 * import cytoscape from 'cytoscape';
 * import webgpuCoseLayout from './cytoscapePlugin';
 *
 * cytoscape.use(webgpuCoseLayout);
 * const cy = cytoscape({ elements, layout: { name: 'webgpu-cose' } });
 * ```
 */
const webgpuCoseLayout = (cytoscape: CytoscapeType) => {
  cytoscape("layout", "webgpu-cose", WebGpuCoseLayoutConstructor);
};

export default webgpuCoseLayout;
