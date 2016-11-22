'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var test = require('tape');
var retext = require('retext');
var english = require('retext-english');
var emoticons = require('emoticon');
var negate = require('negate');
var hidden = require('is-hidden');
var toString = require('nlcst-to-string');
var modifier = require('..');

var position = retext(english).use(plugin);
var noPosition = retext(english).use(plugin).use(function (instance) {
  instance.Parser.prototype.position = false;
});

test('nlcst-emoticon-modifier()', function (t) {
  var root = path.join(__dirname, 'fixtures');

  t.throws(
    function () {
      modifier({});
    },
    /Missing children in `parent`/,
    'should throw when not given a parent'
  );

  fs
    .readdirSync(root)
    .filter(negate(hidden))
    .forEach(function (filename) {
      var tree = JSON.parse(fs.readFileSync(path.join(root, filename)));
      var fixture = toString(tree);
      var name = path.basename(filename, path.extname(filename));

      t.deepEqual(position.parse(fixture), tree, name);
      t.deepEqual(noPosition.parse(fixture), clean(tree), name + ' (positionless)');
    });

  t.end();
});

test('emoticons', function (t) {
  emoticons.forEach(function (emoticon) {
    emoticon.emoticons.forEach(function (value) {
      var fixture = 'Who doesn’t like ' + value + '?';
      var node = position.run(position.parse(fixture));
      var emoticon = node.children[0].children[0].children[6];

      t.doesNotThrow(
        function () {
          assert.strictEqual(emoticon.type, 'EmoticonNode');
          assert.strictEqual(emoticon.value, value);
        },
        value
      );
    });
  });

  t.end();
});

/* Add modifier to processor. */
function plugin(processor) {
  processor.Parser.prototype.use('tokenizeSentence', modifier);
}

/* Clone `object` but omit positional information. */
function clean(object) {
  var clone = 'length' in object ? [] : {};
  var key;
  var value;

  for (key in object) {
    value = object[key];

    if (key === 'position') {
      continue;
    }

    clone[key] = typeof object[key] === 'object' ? clean(value) : value;
  }

  return clone;
}