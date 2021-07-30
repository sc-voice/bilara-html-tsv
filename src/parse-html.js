(function(exports) {
  const fs = require('fs');
  const path = require('path');
  
  class ParseHtml {
    constructor(opts={}) {
      this.lang = opts.lang || 'root';
      this.verbose = opts.verbose;
    }

    parseId(line, p=[]) {
      let pparts = line.split(/id=['"]/);
      let id = pparts.slice(-1)[0];
      id = /'/.test(id) && id.replace(/['"].*$/,'');
      return id;
    }

    async toTsv(fname) {
      let that = this;
      let parsed = await this.parse(fname);
      let { segment } = parsed;
      return segment.reduce((a,seg)=>{
        let keys = Object.keys(seg);
        let line = keys.reduce((al,k)=>{
          if (al.length) { al += '\t'; }
          al += seg[k];
          return al;
        }, "");

        if (a.length === 0) { a.push(keys.join('\t')); }
        a.push(line);
        return a;
      }, []);
    }

    async stripHtml(html, opts={}) {
      let { verbose=this.verbose } = opts;
      html = html.filter(line=>(
        !/DOCTYPE/.test(line) &&
        !/<\/?html>/.test(line) &&
        !/<\/?head>/.test(line) &&
        !/<\/?title>/.test(line) &&
        !/<\/?body>/.test(line) 
      ));

      let reSegment = /<segment/u;
      let reBreak = /<p/u;
      let segmentLine = '';
      let segHtml = html.reduce((a,line) => {
        if (reSegment.test(segmentLine)) {
          if (reSegment.test(line) || reBreak.test(line)) {
            verbose && console.log(`stripHtml:`, segmentLine);
            a.push(segmentLine);
            segmentLine = line;
          } else {
            segmentLine += line;
          }
        } else {
          segmentLine += line;
        }
        return a;
      }, []);
      if (segmentLine) {
        verbose && console.log(`stripHtml$:`, segmentLine);
        segHtml.push(segmentLine);
      }
      return segHtml;
    }

    async parseSegmentHtml(segHtml, opts={}) {
      let { verbose=this.verbose } = opts;
      let that = this;
      let a = {
        segment: [],
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
      let segBase = '';
      let segNum = 0;
      let html = '';

      return segHtml.reduce((a,line)=>{
        if (line.length === 0
          || /DOCTYPE/.test(line)
          || peekTag('html', a, line)
          || peekTag('head', a, line)
          || peekTag('body', a, line)) {
          throw new Error(`unexpected raw HTML input:${line}`);
        } 
        
        line = line.trim();
        let segmentParts = line.split('<segment').map(part=>{
          let tail = part.replace(/.*<.segment>/u, '');
          return tail;
        });
        html += segmentParts.join('{}');

        let segment_id = that.parseId(line, []);
        if (!segment_id) {
          segBase = `${segment_id}:0`;
          segNum = 1;
        }

        let root = (line.split('root>')[1] || '').replace(/<\/$/u,'');
        root = root || line
          .replace(/.*<segment[^>]*>/ug, '')
          .replace(/<\/segment>.*/ug, '');
        let commentParts = line.split('<comment>')
          .slice(1)
          .map(c=>c.replace(/<.comment>.*/iu, ''));
        let comment = commentParts.join('; ');

        a.segment.push({ segment_id, html, root, comment, });
        segNum++;
        html = '';
        return a;
      }, a);
    }
  }

    module.exports = exports.ParseHtml = ParseHtml;
})(typeof exports === "object" ? exports : (exports = {}));

