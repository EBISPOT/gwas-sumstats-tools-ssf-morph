import { asyncRun } from "./py-worker.js";

const script = await fetch('./main.py').then(response => response.text());
const pubKey = document.querySelector('#pubkey').textContent

let dirHandle;
let inputFileHandle;
let outputFileHandle;

async function main() {
    let context = {
        dirHandle: dirHandle,
        inputFileName: inputFileHandle.name,
        outputFileName: outputFileHandle.name,
        pubKey: pubKey
    };

    try {
        const { results, error } = await asyncRun(script, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
            alert("Encryption finished successfully!");
        } else if (error) {
            console.log("pyodideWorker error: ", error);
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
}

async function mountLocalDirectory() {
    // use the same ID crypt4gh to open pickers in the same directory
    dirHandle = await showDirectoryPicker({id: "crypt4gh"});

    if ((await dirHandle.queryPermission({ mode: "readwrite" })) !== "granted") {
        if (
            (await dirHandle.requestPermission({ mode: "readwrite" })) !== "granted"
        ) {
            throw Error("Unable to read and write directory");
        }
    }
}

async function getNewFileHandle() {
    let outputFileName = `${inputFileHandle.name}.crypt4gh`;

    const options = {
        id: "crypt4gh",
        suggestedName: outputFileName,
        types: [
            {
                description: 'crypt4gh file',
                accept: {
                    'application/octet-stream': ['.crypt4gh'],
                },
            },
        ],
    };
    return window.showSaveFilePicker(options);
}

document.querySelector('#mount').addEventListener('click', async () => {
    if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support the File System Access API. Please use a supported browser.');
        return; // Stop execution if the API is not supported
    }

    document.querySelector('#select').disabled = false;
    await mountLocalDirectory();
});

document.querySelector('#select').addEventListener('click', async () => {
    // Destructure the one-element array.
    [inputFileHandle] = await window.showOpenFilePicker({id: "crypt4gh"});
    document.querySelector('#encrypt').disabled = false;
});

document.querySelector('#encrypt').addEventListener('click', async () => {
    outputFileHandle = await getNewFileHandle();
    await main();
});
