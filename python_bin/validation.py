from js import outputFileName
from gwas_sumstats_tools.validate import validate
from datetime import datetime
from pathlib import Path


# local file system is mounted in /data
input_path = Path("/data") / outputFileName
output=validate(filename=input_path)
f"The validation result is:{output[0]}.\nReason:{output[1]}"