from js import inputFileName, outputFileName, config, folder
from gwas_sumstats_tools.format import format
from datetime import datetime
from pathlib import Path
import petl as etl
import json


input_path = Path(folder) / inputFileName
output_path = Path(folder) / outputFileName

config_dict = json.loads(config)

output=format(filename=input_path,apply_config=True,config_dict=config_dict,data_outfile=output_path)