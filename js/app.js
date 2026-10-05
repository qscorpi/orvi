import {
  readForm,
  computeLambda,
  gammaParams,
  dailyProbabilities,
} from "./model.js";
import {
  renderCountChart,
  renderCDFChart,
  renderDailyChart,
} from "./charts.js";

/**
 * Главная функция: читает форму, считает модель, рисует графики.
 * Вызывается при загрузке и при любом изменении в форме.
 */
function update() {
  const input = readForm();
  const lam = computeLambda(input);

  // Обновляем цифру λ рядом с формой
  document.getElementById("lambda_out").textContent = lam.toFixed(2);

  // Параметры Gamma-prior → NegBinom
  const { alpha, beta, p_nb } = gammaParams(lam);

  // График 1: распределение числа эпизодов.
  // Режим выбирается переключателем; по умолчанию — CDF («хотя бы k раз»).
  const mode = document.querySelector('input[name="chartMode"]:checked').value;
  if (mode === "cdf") {
    renderCDFChart("chart_count", alpha, p_nb);
  } else {
    renderCountChart("chart_count", alpha, p_nb);
  }

  // График 2: дневные вероятности + 95% интервал
  const { days, haz, hLo, hHi } = dailyProbabilities(lam, alpha, beta);
  renderDailyChart("chart_daily", days, haz, hLo, hHi);
}

/**
 * Ползунки: показываем текущее значение рядом с ними.
 */
["transport", "sleep"].forEach((id) => {
  const el = document.getElementById(id);
  const out = document.getElementById(id + "_v");
  out.textContent = el.value;
  el.addEventListener("input", () => {
    out.textContent = el.value;
  });
});

/**
 * Любое изменение в форме, ползунке или переключателе → пересчёт.
 */
document
  .querySelectorAll("input, select")
  .forEach((el) => el.addEventListener("change", update));
document
  .querySelectorAll("input[type=range]")
  .forEach((el) => el.addEventListener("input", update));

// Первый рендер при загрузке страницы
update();
