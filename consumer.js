import "https://cdn.datatables.net/2.0.3/js/dataTables.js"
import { asyncRun } from "./py-worker.js";

const read_input = await fetch('./python_bin/read_input.py').then(response => response.text());
const generate_config = await fetch('./python_bin/generate_config.py').then(response => response.text());
const test_config = await fetch('./python_bin/test_config.py').then(response => response.text());
const apply_config = await fetch('./python_bin/apply_config.py').then(response => response.text());
const validate = await fetch('./python_bin/validation.py').then(response => response.text());
const output = document.getElementById("output");

let dirHandle;
let inputFileHandle;
let outputFileHandle;
let validateFileHandle;

new DataTable('#example_table',{
    paging: false,
    ordering: false,
    searching: false,
    autoWidth: true,
    scrollX: true
});

async function mountLocalDirectory() {
    // use the same ID crypt4gh to open pickers in the same directory
    dirHandle = await showDirectoryPicker();

    if ((await dirHandle.queryPermission({ mode: "readwrite" })) !== "granted") {
        if (
            (await dirHandle.requestPermission({ mode: "readwrite" })) !== "granted"
        ) {
            throw Error("Unable to read and write directory");
        }
    }
} 

async function saveFile(blob) {
    try {
      let outputConfig = `config_${inputFileHandle.name}.json`;
      
      const handle = await window.showSaveFilePicker({
        suggestedName: outputConfig,
        types: [
          {
            description: 'JSON files',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });
  
      // Write the blob to the file
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
  
      console.log('File saved successfully!');
    } catch (error) {
      console.error('Error saving file:', error);
    }
  }

async function getNewFileHandle() {
    let outputFileName = `${inputFileHandle.name}_formatted.tsv`;

    const options = {
        suggestedName: outputFileName,
        types: [
            {
                description: 'formatted file',
                accept: {
                    'application/octet-stream': ['.tsv'],
                },
            },
        ],
    };
    return window.showSaveFilePicker(options);
}

async function generate(inputFileHandle) {
    let folder="/data";
    if (!inputFileHandle) {
        error('inputFileHandle is not defined');
        return;
    }
    console.log(dirHandle);
    let context = {
        dirHandle: dirHandle,
        inputFileName: inputFileHandle.name,
        folder: folder,
    };
    try {
        const { results, error } = await asyncRun(generate_config, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
            alert("Generating configure file finish!");
            return results;
        } else if (error) {
            console.log("pyodideWorker error: ", error);
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
}

async function read(inputFileHandle) {
    let folder="/read";
    if (!inputFileHandle) {
        console.error('inputFileHandle is not defined');
        return;
    }
    console.log(dirHandle);
    console.log(inputFileHandle);
    let context = {
        dirHandle: dirHandle,
        inputFileName: inputFileHandle.name,
        folder: folder,
    };
    try {
        const { results, error } = await asyncRun(read_input, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
            return results;
        } else if (error) {
            console.log("pyodideWorker error: ", error);
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
}


async function test (inputFileHandle, config) {
    let folder="/test";
    if (!inputFileHandle) {
        console.error('inputFileHandle is not defined');
        return;
    }
    let context = {
        dirHandle: dirHandle,
        inputFileName: inputFileHandle.name,
        config: config,
        folder: folder,
    };
    try {
        const { results, error } = await asyncRun(test_config, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
            alert("Format test finish!");
            return results;
        } else if (error) {
            console.log("pyodideWorker error: ", error);
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
}

async function apply (inputFileHandle, outputFileHandle, config) {
    let folder="/apply";
    if (!inputFileHandle) {
        console.error('inputFileHandle is not defined');
        return;
    }
    let context = {
        dirHandle: dirHandle,
        inputFileName: inputFileHandle.name,
        outputFileName: outputFileHandle.name,
        config: config,
        folder: folder,
    };
    try {
        const { results, error } = await asyncRun(apply_config, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
            alert("Format test finish!");
            return results;
        } else if (error) {
            console.log("pyodideWorker error: ", error);
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
}

async function validation(outputFileHandle) {
    let folder="/validate";
    if (!outputFileHandle) {
        console.error('formatted data is not defined');
        return;
    }
    console.log(dirHandle);
    let context = {
        dirHandle: dirHandle,
        outputFileName: outputFileHandle.name,
        folder:folder
    };
    try {
        const { results, error } = await asyncRun(validate, context);
        if (results) {
            validation_out.value =results;
            console.log("pyodideWorker return results: ", results);
            alert("Validation finish!");
            return results;
        } else if (error) {
            console.log("pyodideWorker error: ", error);
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
}

document.querySelector('#mount').addEventListener("click", async () => {
    if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support the File System Access API. Please use a supported browser.');
        return; // Stop execution if the API is not supported
    }
    else {
        await mountLocalDirectory();
        document.querySelector('#select').disabled = false;
    }
  });

document.querySelector('#select').addEventListener('click', async () => {
    // Destructure the one-element array.
    [inputFileHandle] = await window.showOpenFilePicker();
    document.querySelector('#generate').disabled = false;
    document.querySelector('#download').disabled = false;
});

document.querySelector('#generate').addEventListener('click', async () => {
    config_out.value = "Initializing...\n";
    let input=await read(inputFileHandle);
    const indata = JSON.parse(input);

        var dataSet = indata.data;
        dataSet.forEach(r => {
            var div1 = document.createElement('div');
            div1.innerHTML = r[1];
            r[1] = div1;
         
            var div3 = document.createElement('div');
            div3.innerHTML = r[3];
            r[3] = div3;
        })

        new DataTable('#your_input', {
            columns: indata.title,
            data: dataSet,
            paging: false,
            ordering: false,
            searching: false,
            autoWidth: true
        });

    let output = await generate(inputFileHandle);
    try {
        config_out.value = output;
        document.querySelector('#test').disabled = false;
        document.querySelector('#apply').disabled = false;
    } catch (err) {
        config_out.value = "There is an error";
    }
  
});

document.querySelector('#test').addEventListener('click', async () => {
    test_example.value = "Preparing the result example...\n";
    var config = document.getElementById('config_out').value;
    //your_output = "Preparing the result example...\n";
    let test_output=await test(inputFileHandle,config);
    try {
        test_example.value = "formatting result example\n";
        var test_out = JSON.parse(test_output);

        var dataSet = test_out.data;
        dataSet.forEach(r => {
            var div1 = document.createElement('div');
            div1.innerHTML = r[1];
            r[1] = div1;
         
            var div3 = document.createElement('div');
            div3.innerHTML = r[3];
            r[3] = div3;
        })

        //if the table table exist, need to destroy it and reinitiliaze it.
       if($.fn.dataTable.isDataTable('#your_output') ){
        $('#your_output').DataTable().destroy();
        $('#your_output').empty();
       }
       // create the table on the UI side
       $('#your_output').DataTable({
        columns: test_out.title,
        data: dataSet,
        paging: false,
        ordering: false,
        searching: false,
        autoWidth: true,
        scrollX: true
        });

    } catch (err) {
        test_example.value = "Test configure on the input data:There is an error";
    }
});

document.querySelector('#download').addEventListener('click', async () => {
    var config = document.getElementById('config_out').value;
    const blob = new Blob([config], { type: 'application/json' });
    await saveFile(blob)

});

document.querySelector('#apply').addEventListener('click', async () => {
    apply_configure.value = "Preparing the result ...\n";
    var config = document.getElementById('config_out').value;
    outputFileHandle = await getNewFileHandle(inputFileHandle);
    await apply(inputFileHandle,outputFileHandle,config);
    apply_configure.value ="Apply configure file finish!\n";
});

document.querySelector('#select_validate').addEventListener('click', async () => {
    [validateFileHandle] = await window.showOpenFilePicker();
});
document.querySelector('#validate').addEventListener('click', async () => {
    validation_out.value = "Initializing...\n";
    await validation(outputFileHandle);
});