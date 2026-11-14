import { shuffle } from './shuffle';

describe('shuffle', () => {
  const input = [1, 2, 3, 4, 5];

  it('keeps the same members', () => {
    expect([...shuffle(input)].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not change the input', () => {
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });

  it('is deterministic with a fixed random function', () => {
    const fixed = () => 0;
    expect(shuffle(input, fixed)).toEqual(shuffle(input, fixed));
    expect(shuffle(input, fixed)).toEqual([2, 3, 4, 5, 1]);
  });

  it('handles empty and single item lists', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([7])).toEqual([7]);
  });
});
