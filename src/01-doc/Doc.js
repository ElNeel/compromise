const methods = {
  misc: require('./methods'),
  out: require('./output'),
  match: require('./match'),
  selections: require('./selections'),
}
const tagger = require('../tagger')

/** a parsed text object */
class Doc {
  constructor(list, from, world) {
    this.list = list
    //quiet these properties in console.logs
    Object.defineProperty(this, 'from', {
      enumerable: false,
      value: from,
    })
    //borrow some missing data from parent
    if (world === undefined && from !== undefined) {
      world = from.world
    }
    //'world' getter
    Object.defineProperty(this, 'world', {
      enumerable: false,
      value: world,
    })
    //'found' getter
    Object.defineProperty(this, 'found', {
      get: () => this.list.length > 0,
    })
  }

  /** run part-of-speech tagger on all results*/
  tagger() {
    return tagger(this)
  }

  /** pool is stored on phrase objects */
  pool() {
    if (this.list.length > 0) {
      return this.list[0].pool
    }
    return this.all().list[0].pool
  }

  /** return the previous result */
  parent() {
    if (this.from) {
      return this.from
    }
    return this
  }

  /**  return a list of all previous results */
  parents() {
    let arr = []
    const addParent = function(doc) {
      if (doc.from) {
        arr.push(doc.from)
        addParent(doc.from)
      }
    }
    addParent(this)
    return arr.reverse()
  }

  /** return the root, first document */
  all() {
    return this.parents()[0]
  }
}

/** create a new Document object */
Doc.prototype.buildFrom = function(list) {
  return new Doc(list, this, this.world)
}

Object.assign(Doc.prototype, methods.match)
Object.assign(Doc.prototype, methods.selections)
Object.assign(Doc.prototype, methods.misc)
Object.assign(Doc.prototype, methods.out)

//aliases
const aliases = {
  unTag: 'untag',
  and: 'match',
  notIf: 'ifNo',
  only: 'if',
  onlyIf: 'if',
}
Object.keys(aliases).forEach(k => (Doc.prototype[k] = Doc.prototype[aliases[k]]))
module.exports = Doc
