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
let delimiter;
let removecomments;
let analysisSoftware;


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
    if (!inputFileHandle) {
        error('inputFileHandle is not defined');
        return;
    }

    let context = {
        dirHandle: dirHandle,
        inputFileName: inputFileHandle.name,
        delimiter: delimiter,
        removecomments: removecomments,
        analysisSoftware: analysisSoftware
    };
    try {
        const { results, error } = await asyncRun(generate_config, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
            alert("Generating configure file finish!");
            return results;
        } else if (error) {
            console.log("pyodideWorker error: ", error);
            appendAlertToElement("step2error",'Error: '+error,'danger' )
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
        appendAlertToElement("step2error",'Error in pyodideWorker','danger')
    }
}

async function read(inputFileHandle) {
    if (!inputFileHandle) {
        console.error('inputFileHandle is not defined');
        return;
    }

    let context = {
        dirHandle: dirHandle,
        inputFileName: inputFileHandle.name,
        delimiter: delimiter,
        removecomments: removecomments,
    };
    try {
        const { results, error } = await asyncRun(read_input, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
            return results;
        } else if (error) {
            console.log("pyodideWorker error: ", error);
            appendAlertToElement("step2error",'Error: '+error,'danger')
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
}


async function test (inputFileHandle, config) {
    if (!inputFileHandle) {
        console.error('inputFileHandle is not defined');
        return;
    }
    let context = {
        dirHandle: dirHandle,
        inputFileName: inputFileHandle.name,
        config: config,
    };
    try {
        const { results, error } = await asyncRun(test_config, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
            alert("Format test finish!");
            return results;
        } else if (error) {
            console.log("pyodideWorker error: ", error);
            appendAlertToElement("step3rror",'Error: '+error,'danger')
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
}

async function apply (inputFileHandle, outputFileHandle, config) {
    if (!inputFileHandle) {
        console.error('inputFileHandle is not defined');
        return;
    }
    let context = {
        dirHandle: dirHandle,
        inputFileName: inputFileHandle.name,
        outputFileName: outputFileHandle.name,
        config: config,
    };
    try {
        const { results, error } = await asyncRun(apply_config, context);
        if (results) {
            $('#apply_configure').text("Please check the result in " + dirHandle + "/" + outputFileHandle.name);
            console.log("pyodideWorker return results: ", results);
            alert("Format test finish!");
            return results;
        } else if (error) {
            $('#apply_configure').text("pyodideWorker error: ", error)
            console.log("pyodideWorker error: ", error);
            appendAlertToElement("step4rror",'Error: '+error,'danger')
        }
    } catch (e) {
        $('#apply_configure').text(`Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`)
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
}

async function validation(validateFileHandle) {
    if (!validateFileHandle) {
        console.error('formatted data is not defined');
        return;
    }
    console.log(dirHandle);
    let context = {
        dirHandle: dirHandle,
        outputFileName: validateFileHandle.name,
    };
    try {
        const { results, error } = await asyncRun(validate, context);
        if (results) {
            validation_out.value =results;
            console.log("pyodideWorker return results: ", results);
            alert("Validation finish!");
            return results;
        } else if (error) {
            validation_out.value =error;
            console.log("pyodideWorker error: ", error);
            appendAlertToElement("step5rror",'Error: '+error,'danger')
        }
    } catch (e) {
        validation_out.value =`Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`;
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
}

async function appendAlertToElement(elementId, message, type) {
    const alertPlaceholder = document.getElementById(elementId);
    if (!alertPlaceholder) {
        console.error("Element with ID '" + elementId + "' not found.");
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('');

    alertPlaceholder.append(wrapper);
}

document.querySelector('#mount').addEventListener("click", async () => {
    if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support the File System Access API. Please use a supported browser.');
        return; // Stop execution if the API is not supported
    }
    else {
        await mountLocalDirectory();
        appendAlertToElement('mountdiv','Nice, you have granted the permission to the local directory '+dirHandle.name,'success' )
        document.querySelector('#select').disabled = false;
        document.querySelector('#select_validate').disabled = false;
        document.querySelector('#mountvalidate').disabled = true;
    }
  });

document.querySelector('#select').addEventListener('click', async () => {
    // Destructure the one-element array.
    [inputFileHandle] = await window.showOpenFilePicker();
    appendAlertToElement('selectdiv','You have selected the file '+ inputFileHandle.name,'success' )
    document.querySelector('#generate').disabled = false;
    document.querySelector('#download').disabled = false;
    document.querySelector('#test').disabled = false;
    document.querySelector('#apply').disabled = false;
});

document.querySelector('#generate').addEventListener('click', async () => {
    delimiter = document.getElementById('delimiter').value;
    removecomments = document.getElementById('comments').value;
    analysisSoftware= document.getElementById('analysis_software').value;

    config_out.value = "Initializing...\n";
    $('#generate').html('<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Analyzing...'); 

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

        if($.fn.dataTable.isDataTable('#your_input') ){
            $('#your_input').DataTable().destroy();
            $('#your_input').empty();
           }

        $(document).ready(function() {
            $( "#collapseInput" ).on("shown.bs.collapse", function() {
                          $.each($.fn.dataTable.tables(true), function(){
                            $(this).DataTable().columns.adjust().draw();
                        });
                    });
            
            new DataTable('#your_input', {
                columns: indata.title,
                data: dataSet,
                paging: false,
                ordering: false,
                searching: false,
                autoWidth: true,
                scrollX: "600px"
            });
        $('#generate').html('<button type="button" id="generate" class="btn btn-primary" data-mdb-ripple-init>generate</button>');
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
        scrollX: "600px"
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
    $('#apply').html('<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Formatting...'); 
    $('#apply_configure').text("we are appliying the configure to " + inputFileHandle.name);
    var config = document.getElementById('config_out').value;
    outputFileHandle = await getNewFileHandle(inputFileHandle);
    await apply(inputFileHandle,outputFileHandle,config);
    apply_configure.value ="Apply configure file finish!\n";
    $('#apply').html('<button id="apply" class="btn btn-primary" data-mdb-ripple-init>Apply</button>'); 
});

document.querySelector('#mountvalidate').addEventListener('click', async () => {
    if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support the File System Access API. Please use a supported browser.');
        return; // Stop execution if the API is not supported
    }
    else {
        await mountLocalDirectory();
        appendAlertToElement('validatediv','Nice, you have granted the permission to the local directory '+dirHandle.name,'success' )
        document.querySelector('#mount').disabled = true;
        document.querySelector('#select_validate').disabled = false;
    }
});


document.querySelector('#select_validate').addEventListener('click', async () => {
    [validateFileHandle] = await window.showOpenFilePicker();
    appendAlertToElement('validatediv','You have selected the file '+ validateFileHandle.name + 'for validation','success' )
    document.querySelector('#validate').disabled = false;
});


document.querySelector('#validate').addEventListener('click', async () => {
    validation_out.value = "Initializing validation...\n";
    $('#validate').html('<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Validating...'); 
    await validation(validateFileHandle);
    $('#validate').html('<button id="validate" class="btn btn-primary" data-mdb-ripple-init>Validate the selected file</button>'); 
});

$(document).ready(function() {
    $( "#collapseExample" ).on("shown.bs.collapse", function() {
                  $.each($.fn.dataTable.tables(true), function(){
                    $(this).DataTable().columns.adjust().draw();
                });
            });
        $('#example_table').DataTable( {
            lengthChange:     false,
            searching:        false, 
            paging:           false,
            fixedColumns:   {
                leftColumns: 1,
                rightColumns: 1
            },
            columnDefs: [ {
                orderable: false,
                className: 'select-checkbox',
                targets:   0
            } ],
            select: {
                style:    'multi+shift',
                selector: 'td:first-child'
            },
            order: false,
            scrollX: "600px"
        } );
    } );
