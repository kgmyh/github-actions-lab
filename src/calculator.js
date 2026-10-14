// 실습용: npm run lab:break / lab:fix가 이 상수만 변경합니다.
const TIP_DIVISOR = 100;

export function calculateTip(bill, percent) {
  if (!Number.isInteger(bill) || bill < 0 || bill > 1_000_000_000) {
    throw new RangeError('금액은 0~1,000,000,000 사이의 정수로 입력하세요.');
  }
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new RangeError('팁 비율은 0~100 사이의 정수로 입력하세요.');
  }
  const tip = Math.round(bill * percent / TIP_DIVISOR);
  return { tip, total: bill + tip };
}
