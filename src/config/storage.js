import env from '../utility/env';

const storage = {
  path: env("JMX_PATH", "/Users/atul/webroot/testingtool/jmx/"),
  jtlPath: env("JTL_PATH", "/Users/atul/webroot/perfeasy/jtl/"),
  csvPath: env("CSV_PATH", "/Users/atul/webroot/testingtool/csv/"),
  sampleCsvPath: env("CSV_SAMPLE", "/Users/atul/webroot/perfeasy/sample_csv/"),
  csvInstruction: env("CSV_INSTRUCTION", "/Users/atul/webroot/perfeasy/csv_instruction/"),
  temp: env("TEMP_PATH", "")
};


export default storage;
