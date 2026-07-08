# Scene GLB models (Phase 3)

Bundled CC0 glTF sample assets for the 3D editor viewport. Parametric meshes remain the fallback when a model fails to load.

## Source

Most files are sourced from the [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) repository (CC0). `column.glb` is procedurally generated (`scripts/generate-column-glb.mjs`). Type names map to registry keys; footprint scaling in the viewport fits each model to manifest width/depth.

Refresh assets: `pnpm run setup:scene-models`
Verify in CI: `pnpm run setup:scene-models -- --verify`
