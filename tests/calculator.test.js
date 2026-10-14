import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTip } from '../src/calculator.js';

test('10,000원의 10% 팁은 1,000원이고 총액은 11,000원이다', () => {
  assert.deepEqual(calculateTip(10_000, 10), { tip: 1_000, total: 11_000 });
});

test('팁 0%이면 원래 금액을 유지한다', () => {
  assert.deepEqual(calculateTip(10_000, 0), { tip: 0, total: 10_000 });
});

test('금액이 0원이면 팁과 총액도 0원이다', () => {
  assert.deepEqual(calculateTip(0, 15), { tip: 0, total: 0 });
});

test('소수 원 단위 팁을 반올림한다', () => {
  assert.deepEqual(calculateTip(15, 10), { tip: 2, total: 17 });
  assert.deepEqual(calculateTip(14, 10), { tip: 1, total: 15 });
});

test('최대 금액과 팁 100%를 지원한다', () => {
  assert.deepEqual(calculateTip(1_000_000_000, 100), {
    tip: 1_000_000_000, total: 2_000_000_000,
  });
});

test('음수, 비정수, 범위 밖, 숫자가 아닌 금액은 거부한다', () => {
  for (const bill of [-1, 1.5, 1_000_000_001, NaN, Infinity, '100', null, undefined]) {
    assert.throws(() => calculateTip(bill, 10), RangeError);
  }
});

test('음수, 비정수, 100 초과, 숫자가 아닌 비율은 거부한다', () => {
  for (const percent of [-1, 1.5, 101, NaN, Infinity, '10', null, undefined]) {
    assert.throws(() => calculateTip(10_000, percent), RangeError);
  }
});
