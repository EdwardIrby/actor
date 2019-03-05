import { expect } from 'chai';

const assert = ({
  given = undefined,
  should = '',
  actual = undefined,
  expected = undefined,
}) => expect(actual)
  .to
  .equal(
    expected,
    `Given ${given}: should ${should}`,
  );
