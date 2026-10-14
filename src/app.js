import { calculateTip } from './calculator.js';

const form = document.querySelector('#calculator-form');
const billInput = document.querySelector('#bill');
const percentInput = document.querySelector('#percent');
const error = document.querySelector('#error');
const tipOutput = document.querySelector('#tip');
const totalOutput = document.querySelector('#total');
const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });

form.addEventListener('submit', (event) => {
  event.preventDefault();
  error.textContent = '';
  try {
    if (billInput.value.trim() === '' || percentInput.value.trim() === '') {
      throw new RangeError('금액과 팁 비율을 모두 입력하세요.');
    }
    const { tip, total } = calculateTip(billInput.valueAsNumber, percentInput.valueAsNumber);
    tipOutput.textContent = won.format(tip);
    totalOutput.textContent = won.format(total);
  } catch (cause) {
    error.textContent = cause.message;
    tipOutput.textContent = '—';
    totalOutput.textContent = '—';
  }
});

form.requestSubmit();
