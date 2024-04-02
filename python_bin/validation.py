from js import outputFileName, folder
from gwas_sumstats_tools.validate import validate
from datetime import datetime
from pathlib import Path


# local file system is mounted in /data
input_path = Path(folder) / outputFileName
output=validate(filename=input_path)
f"The validation result is:{output[0]}.\n Reason:{output[1]}"