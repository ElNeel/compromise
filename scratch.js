var nlp = require('./src/index')
// nlp.verbose(true);

// var m = nlp('John eats glue').replace('john [#Verb]', 'sniffs');

let doc = nlp('ralf spencer john eat the glue')
// .match('[spencer john] eat')
// .debug()

// doc.ifNo('lkj').debug()

// doc.hello()
doc.untag().debug()
