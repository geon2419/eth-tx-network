import cytoscape from "cytoscape";

/**
 * Dynamically loads and registers a Cytoscape layout plugin.
 * This prevents bundling all layout plugins upfront, reducing initial bundle size.
 *
 * @param layoutName - The name of the layout to load
 * @throws Error if the layout plugin cannot be loaded
 */
export async function loadLayoutPlugin(layoutName: string): Promise<void> {
  switch (layoutName) {
    case "cose-bilkent": {
      // @ts-expect-error - No type definitions available for cytoscape-cose-bilkent
      const coseBilkent = await import("cytoscape-cose-bilkent");
      cytoscape.use(coseBilkent.default || coseBilkent);
      break;
    }
    case "fcose": {
      const fcose = await import("cytoscape-fcose");
      cytoscape.use(fcose.default || fcose);
      break;
    }
    case "webgpu-cose": {
      const { default: webgpuCoseLayout } =
        await import("@/features/cytoscape/webgpu-cose/algorithms/cytoscapePlugin");
      cytoscape.use(webgpuCoseLayout);
      break;
    }
    case "cose":
      // Built-in COSE layout, no plugin needed
      break;
    default:
      throw new Error(`Unknown layout: ${layoutName}`);
  }
}
