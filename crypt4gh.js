let dirHandle;
let pyodide;

async function main() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");

    // manual workaround: docopt doesn't have a wheel file on python
    await micropip.install("./static/docopt-0.6.2-py2.py3-none-any.whl")
    await micropip.install("crypt4gh")
    console.log(pyodide.runPython(`
            import sys
            sys.version

            import crypt4gh
            f"crypt4gh version: {crypt4gh.__version__}"
        `));


    // set up private and public keys
    let pub_key = `
        -----BEGIN CRYPT4GH PUBLIC KEY-----
        HzBf8nOoIXnr7H9Yiqypgr7CV2yJkliU6K+2vHYxFQo=
        -----END CRYPT4GH PUBLIC KEY-----
        `
    pyodide.FS.writeFile("/pub.txt", pub_key, {encoding: "utf8"});
}

async function openDirectoryPicker() {
    if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support the File System Access API. Please use a supported browser.');
        return; // Stop execution if the API is not supported
    }

    try {
        dirHandle = await window.showDirectoryPicker();
    } catch (error) {
        if (error.name === 'AbortError') {
            // User aborted the request
            return;
        } else {
            // Handle other errors
            console.error('Error:', error);
            return;
        }
    }

    if ((await dirHandle.queryPermission({ mode: "readwrite" })) !== "granted") {
        if (
            (await dirHandle.requestPermission({ mode: "readwrite" })) !== "granted"
        ) {
            throw Error("Unable to read and write directory");
        }
    }

    enableButton();
}

async function crypt4gh() {
    nativefs = await pyodide.mountNativeFS("/data", dirHandle);

    pyodide.runPython(`
        from crypt4gh.keys import get_public_key
        from crypt4gh.lib import encrypt
        from nacl.public import PrivateKey
        from os import listdir
        from os.path import isfile, join

        private_key = bytes(PrivateKey.generate())
        pub_key = get_public_key("/pub.txt")
        
        def encrypt_file(path):
            with open(path, "rb") as original_file, open(f"{path}.crypt4gh", "wb") as encrypted_file_wb:
                encrypt([(0, private_key, pub_key)], original_file, encrypted_file_wb)
                
        onlyfiles = [join("/data/", f) for f in listdir("/data") if isfile(join("/data", f))]
        
        [encrypt_file(x) for x in onlyfiles]
    `);

    await nativefs.syncfs();

    alert("Encryption complete!");
}

function enableButton() {
    document.getElementById('encrypt').disabled = false;
}

main();