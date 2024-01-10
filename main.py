from js import inputFileName, outputFileName
from crypt4gh.keys import get_public_key
from crypt4gh.lib import encrypt
from nacl.public import PrivateKey
from datetime import datetime
from pathlib import Path

startTime = datetime.now()

private_key = bytes(PrivateKey.generate())
pub_key = get_public_key("/tmp/pubkey.txt")

# local file system is mounted in /data
input_path = Path("/data") / inputFileName
output_path = Path("/data") / outputFileName

with open(input_path, "rb") as original_file, open(output_path, "wb") as encrypted_file_wb:
    encrypt([(0, private_key, pub_key)], original_file, encrypted_file_wb)

f"crypt4gh process finished in {datetime.now() - startTime}"