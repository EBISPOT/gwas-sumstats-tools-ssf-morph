from js import outputFileName, zeropvalues, nrows
from gwas_sumstats_tools.validate import validate
from datetime import datetime
from pathlib import Path


# local file system is mounted in /data
input_path = Path("/data") / outputFileName
if nrows:
<<<<<<< Updated upstream
  minimum_rows=int(nrows)
else:
  minimum_rows=None
output=validate(filename=input_path,minimum_rows=minimum_rows,pval_zero=bool(zeropvalues))
f"The validation result is:{output[0]}.\nReason:{output[1]}\nerror_preview:{output[2]}\nprimary_error_type:{output[3]}"
=======
    minimum_rows=int(nrows)
output=validate(filename=input_path,minimum_rows=minimum_rows,pval_zero=bool(zeropvalues))
f"The validation result is:{output[0]}.\nReason:{output[1]}\nerror_preview:{output[2]}\nprimary_error_type:{output[3]}"
>>>>>>> Stashed changes
