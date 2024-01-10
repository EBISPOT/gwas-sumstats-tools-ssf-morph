// webworker.js

// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.json`,
// and `.wasm` files as well:
importScripts("https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js");

async function loadPyodideAndPackages() {
    self.pyodide = await loadPyodide();
    await pyodide.loadPackage("micropip");

    const micropip = pyodide.pyimport("micropip");

    // manual workaround: docopt doesn't have a wheel file on python
    await micropip.install("./static/docopt-0.6.2-py2.py3-none-any.whl")
    await micropip.install("crypt4gh")
}
let pyodideReadyPromise = loadPyodideAndPackages();


self.onmessage = async (event) => {
    // make sure loading is done
    await pyodideReadyPromise;
    // Don't bother yet with this line, suppose our API is built in such a way:
    const { id, python, ...context } = event.data;
    // The worker copies the context in its own "memory" (an object mapping name to values)
    for (const key of Object.keys(context)) {
        self[key] = context[key];
    }
    // Now is the easy part, the one that is similar to working in the main thread:
    try {
        var startTime = performance.now()

        await self.pyodide.loadPackagesFromImports(python);

        pyodide.FS.writeFile("/tmp/pubkey.txt", self.pubKey, {encoding: "utf8"});

        // mount local directory
        const nativefs = await self.pyodide.mountNativeFS("/data", self.dirHandle);

        // run crypt4gh in python
        let results = await self.pyodide.runPythonAsync(python);

        // flush new files to disk
        await nativefs.syncfs();

        var endTime = performance.now()

        console.log(`Encryption web worker took ${(endTime - startTime) / 1000} seconds`)
        self.postMessage({ results, id });
    } catch (error) {
        self.postMessage({ error: error.message, id });
    }
};