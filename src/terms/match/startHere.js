'use strict';
const fullMatch = require('./fullMatch');
const lumpMatch = require('./lumpMatch');

// match everything until this point - '*'
const greedyUntil = (terms, i, reg) => {
  for(i = i; i < terms.length; i++) {
    if (fullMatch(terms.get(i), reg)) {
      return i;
    }
  }
  return null;
};

//keep matching this reg as long as possible
const greedyOf = (terms, i, reg, until) => {
  for(i = i; i < terms.length; i++) {
    let t = terms.get(i);
    //found next reg ('until')
    if (until && fullMatch(t, until)) {
      return i;
    }
    //die here
    if (!fullMatch(t, reg)) {
      return i;
    }
  }
  return i;
};

//try and match all regs, starting at this term
const startHere = (ts, startAt, regs) => {
  let term_i = startAt;
  //check each regex-thing
  for(let reg_i = 0; reg_i < regs.length; reg_i++) {
    let term = ts.get(term_i);
    let reg = regs[reg_i];
    let next_reg = regs[reg_i + 1];

    if (!term) {
      //we didn't need it anyways
      if (reg.optional) {
        continue;
      }
      return null;
    }

    //catch '^' errors
    if (reg.starting && term_i > 0) {
      return null;
    }

    //catch '$' errors
    if (reg.ending && term_i !== ts.length - 1 && !reg.minMax) {
      return null;
    }

    //support '*'
    if (regs[reg_i].astrix) {
      //just grab until the end..
      if (!next_reg) {
        return ts.terms.slice(startAt, ts.length);
      }
      let foundAt = greedyUntil(ts, term_i, regs[reg_i + 1]);
      if (!foundAt) {
        return null;
      }
      term_i = foundAt + 1;
      reg_i += 1;
      continue;
    }

    //support '{x,y}'
    if (regs[reg_i].minMax) {
      //on last reg?
      if (!next_reg) {
        let len = ts.length;
        let max = regs[reg_i].minMax.max + startAt;
        //if it must go to the end, but can't
        if (regs[reg_i].ending && max < len) {
          return null;
        }
        //dont grab past the end
        if (max < len) {
          len = max;
        }
        return ts.terms.slice(startAt, len);
      }
      //otherwise, match until this next thing
      let foundAt = greedyUntil(ts, term_i, next_reg);
      if (!foundAt) {
        return null;
      }
      //if it's too close/far..
      let minMax = regs[reg_i].minMax;
      if (foundAt < minMax.min || foundAt > minMax.max) {
        return null;
      }
      term_i = foundAt + 1;
      reg_i += 1;
      continue;
    }

    //if optional, check next one
    if (reg.optional) {
      let until = regs[reg_i + 1];
      term_i = greedyOf(ts, term_i, reg, until);
      continue;
    }

    //check a perfect match
    if (fullMatch(term, reg)) {
      term_i += 1;
      //try to greedy-match '+'
      if (reg.consecutive) {
        let until = regs[reg_i + 1];
        term_i = greedyOf(ts, term_i, reg, until);
      }
      continue;
    }

    //handle partial-matches of lumped terms
    let lumpUntil = lumpMatch(term, regs, reg_i);
    if (lumpUntil) {
      reg_i = lumpUntil;
      term_i += 1;
      continue;
    }

    //skip over silent contraction terms
    if (term.silent_term && !term.normal) {
      //try the next term, but with this regex again
      term_i += 1;
      reg_i -= 1;
      continue;
    }

    //was it optional anways?
    if (reg.optional) {
      continue;
    }
    return null;
  }
  return ts.terms.slice(startAt, term_i);
};

module.exports = startHere;