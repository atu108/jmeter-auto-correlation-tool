import env from '../utility/env';

const storage = {
  path: env("JMX_PATH", "/Users/atul/webroot/testingtool/jmx/"),
  jtlPath: env("JTL_PATH", "/Users/atul/webroot/perfeasy/jtl/"),
  csvPath: env("CSV_PATH", "/Users/atul/webroot/testingtool/csv/"),
  sampleCsvPath: env("SAMPLE_SCV", "/Users/atul/webroot/perfeasy/sample_csv/"),
  temp: env("TEMP_PATH", "")
};


export default storage;
