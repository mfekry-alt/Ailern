/**
 * esbuild-wasm shim -- replaces esbuild.exe with the WASM-based runner.
 *
 * The native `esbuild` package spawns `esbuild.exe`, which crashes on this
 * machine due to Google Drive's shell-extension DLL injection.
 *
 * `esbuild-wasm`'s Node.js mode spawns `node esbuild-wasm/bin/esbuild`
 * instead, which runs the esbuild compiler as pure WebAssembly inside a normal
 * Node.js process. Since node.exe is resilient to the Drive DLL, it succeeds.
 *
 * No explicit initialize() call is needed -- the service starts lazily on the
 * first build() / transform() call.
 */

export * from 'esbuild-wasm';
export { default } from 'esbuild-wasm';
