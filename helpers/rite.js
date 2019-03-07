const { assert: t } = require('chai');

module.exports.assert = ({
  given = undefined,
  should = '',
  actual = undefined,
  expected = undefined,
}) => t.strictEqual(
  actual,
  expected,
  `Given ${given}: should ${should}`,
);
