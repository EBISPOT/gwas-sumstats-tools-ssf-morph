import { asyncRun } from "./py-worker.js";

const script = await fetch('./main.py').then(response => response.text());

async function main() {
    let context = {
        A_rank: Array.from({length: 40}, () => Math.floor(Math.random() * 40)),
    };

    try {
        const { results, error } = await asyncRun(script, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
        } else if (error) {
            console.log("pyodideWorker error: ", error);
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`,
        );
    }
};

document.querySelector('#hello').addEventListener('click', main)