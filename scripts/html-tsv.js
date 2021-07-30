#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { logger } = require('log-instance');
const {
  ParseHtml,
} = require('../index');

function help() {
    console.log(`
NAME
        html-tsv - Convert root text HTML source to Bilara I/O TSV

SYNOPSIS
        html-tsv [OPTIONS] HTML_FILE

DESCRIPTION
        Converts root text in HTML source file to tab-separated
        output for bilara-data import

    -?, --help
        Output help

    -v, --verbose
        Include verbose output

    -ll, --logLevel LOGLEVEL
        Logging is normally turned off, but you can specificy a LOGLEVEL:
        debug, warn, info, error. The most useful will be "info".
        The default is "warn".
`);
    process.exit(0);
}

let verbose = false;
let logLevel = 'warn';

var nargs = process.argv.length;
if (nargs < 3) {
    help();
}
for (var i = 2; i < nargs; i++) {
    var arg = process.argv[i];
    if (i<2) { continue; }
    if (arg === '-?' || arg === '--help') {
        help();
    } else if (arg === '-v' || arg === '--verbose') {
        verbose = true;
    } else if (arg === '-ll' || arg === '--logLevel') {
        logLevel = process.argv[++i];
    } else {
      fname = arg;
    }
}

logger.logLevel = logLevel;

(async function() { try {
  logger.info('HTML-TSV: Bilara Html-TSV ');
  let parser = new ParseHtml();
  let htmlBuf = await fs.promises.readFile(fname);
  let html = htmlBuf.toString().split('\n');
  let segHtml = await parser.stripHtml(html, {verbose});
  let parsed = await parser.parseSegmentHtml(segHtml, {verbose});
  parsed.segment.forEach((seg,i)=>{
    let keys = Object.keys(seg);
    if (i === 0) {
      console.log(keys.join('\t'));
    }
    console.log(keys.map(k=>seg[k]).join('\t'));
  });


} catch(e) { logger.warn(e.stack); }})();
