(typeof describe === 'function') && describe("parse-html", function() {
    const should = require("should");
    const fs = require('fs');
    const path = require('path');
    const {
        ParseHtml,
    } = require("../index");

    let TEST_SF276 = path.join(__dirname, 'data', 'sf276.html');

    it("default ctor", async()=>{
      let parser = new ParseHtml();
    });
    it("TESTTESTparse(fname)", async()=>{
      let parser = new ParseHtml();
      let parsed = await parser.parse(TEST_SF276);
      console.log(`parsed`, parsed);
    });

});

