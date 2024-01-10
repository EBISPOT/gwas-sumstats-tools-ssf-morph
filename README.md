# crypt4gh-wasm

Encrypt a local file with crypt4gh using a web browser. **This is a proof of concept and not suitable for production**.

Requires a chromium browser (Google Chrome, Microsoft Edge) that supports the File System Access API.

Files are encrypted with a hardcoded public key and randomly generated private keys.

To run the demo:

```
$ cd crypt4gh-wasm
$ python3 -m http.server
```

And open `localhost:8000` in your web browser.
