(function(exports) {
  const fs = require('fs');
  const path = require('path');
  
  class ParseHtml {
    constructor(opts={}) {
      this.lang = opts.lang || 'pli';
    }

    async parse(fname) {
      let { lang } = this;
      let htmlBuf = await fs.promises.readFile(fname);
      let lines = htmlBuf.toString().split('\n');
      let a = {
      };
      let state = 'html';
      let states = [];
      let peekTag = (tag, a, line, skip=false)=>{
        let reStart = new RegExp(`<${tag}\\b`, 'iu');
        let reEnd = new RegExp(`</${tag}\\b`, 'iu');
        if (reStart.test(line)) {
          if (!skip) {
            states.push(state);
            state = tag;
            a[state] = a[state] || []
          }
          return true;
        } 
        if (reEnd.test(line)) {
          if (!skip) {
            state = states.pop() || 'html';
          }
          return true;
        }
        return false;
      }
      let idMap = {};

      return lines.reduce((a,line)=>{
        line = line.trim();
        if (line.length === 0) { 
          // do nothing
        } else if (/<!DOCTYPE/.test(line)) {
          a.doctype = line;
        } else if ( peekTag('segment', a, line)) {
          let text = line.replace(/<\/?segment>/ug, '');
          let p = a.p && a.p.slice(-1)[0];
          let id = p && p.id;
          if (id == null) {
            console.log(`a`, a.p);
          }
          a[state].push({
            id,
            [lang]: text,
          });
          state = states.pop() || 'html';
        } else if ( peekTag('p', a, line)) {
          let pparts = line.split("'");
          let id = pparts[1];
          for (let i=a.p.length; !id && i-- >= 0;) {
              id = a.p[i].id;
          }
          a[state].push({ line, id });
          idMap[id] = 1;
        } else if ( peekTag('html', a, line)
          || peekTag('head', a, line)
          || peekTag('body', a, line)
          || peekTag('article', a, line, true)
          || peekTag('header', a, line, true)
        ) {
          // do nothing
        } else {
          a[state].push(line);
        } 
        return a;
      }, a);
    }
  }

    module.exports = exports.ParseHtml = ParseHtml;
})(typeof exports === "object" ? exports : (exports = {}));

