'use strict';

var parseMarkdown = require('./parse_markdown');

/**
 * Sort two documentation objects, given an optional order object. Returns
 * a numeric sorting value that is compatible with stream-sort.
 *
 * @param {Array<Object>} comments all comments
 * @param {Object} options options from documentation.yml
 * @return {number} sorting value
 * @private
 */
module.exports = function sortDocs(comments, options) {
  if (!options || !options.toc) {
    return comments.sort(function (a, b) {
      return a.context.sortKey.localeCompare(b.context.sortKey);
    });
  }
  var indexes = options.toc.reduce(function (memo, val, i) {
    if (typeof val === 'object' && val.name) {
      val.kind = 'note';
      memo[val.name] = i;
    } else {
      memo[val] = i;
    }
    return memo;
  }, {});
  var fixed = options.toc.filter(function (val) {
    return typeof val === 'object' && val.name;
  }).map(function (val) {
    if (typeof val.description === 'string') {
      val.description = parseMarkdown(val.description);
    }
    return val;
  });
  var unfixed = [];
  comments
  .forEach(function (comment) {
    // If comment is of kind 'note', this means that we must be _re_ sorting
    // the list, and the TOC note entries were already added to the list. Bail
    // out here so that we don't add duplicates.
    if (comment.kind === 'note') {
      return;
    }

    // If comment is top-level and `name` matches a TOC entry, add it to the
    // to-be-sorted list.
    if (!comment.memberof && indexes[comment.name] !== undefined) {
      fixed.push(comment);
    } else {
      unfixed.push(comment);
    }
  });
  fixed.sort(function (a, b) {
    if (indexes[a.name] !== undefined && indexes[b.name] !== undefined) {
      return indexes[a.name] - indexes[b.name];
    }
  });
  unfixed.sort(function (a, b) {
    return a.context.sortKey.localeCompare(b.context.sortKey);
  });
  return fixed.concat(unfixed);
};
