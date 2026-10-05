import {
  readForm,
  computeLambda,
  personalLambda,
  gammaParams,
  dailyProbabilities,
  viralBreakdown,
  viralTotal,
} from "./model.js";
import {
  renderCountChart,
  renderCDFChart,
  renderDailyChart,
  renderViralChart,
} from "./charts.js";
import { CONFIG } from "./config.js";

// История: массив объектов { year, count }
let history = [
  { year: 2024, count: 2 },
  { year: 2025, count: 3 },
  { year: 2026, count: 2 },
];

function renderHistoryInputs() {
  const container = document.getElementById("history_inputs");
  container.innerHTML = history
    .map(
      (h, i) => `
    <div class="row" style="margin-bottom:4px;">
      <span style="min-width:50px; font-size:13px; color:#666;">${h.year}</span>
      <input type="number" min="0" max="12" value="${h.count}" data-idx="${i}" class="history-input">
      <button type="button" data-idx="${i}" class="history-remove">×</button>
    </div>
  `,
    )
    .join("");

  container.querySelectorAll(".history-input").forEach((el) => {
    el.addEventListener("input", () => {
      history[+el.dataset.idx].count = +el.value;
      update();
    });
  });

  container.querySelectorAll(".history-remove").forEach((el) => {
    el.addEventListener("click", () => {
      history.splice(+el.dataset.idx, 1);
      renderHistoryInputs();
      update();
    });
  });
}

// Кнопка "+ Добавить год": добавляет более ранний год сверху
document.getElementById("addYear").addEventListener("click", () => {
  const firstYear = history.length ? history[0].year : 2026;
  history.unshift({ year: firstYear - 1, count: 0 });
  renderHistoryInputs();
  update();
});

function update() {
  const input = readForm();
  const priorLam = CONFIG.baseLambda;

  // Байесовская оценка с учётом истории
  input.personalBase = personalLambda(priorLam, CONFIG.priorWeight, history);

  const lam = computeLambda(input);

  document.getElementById("prior_out").textContent = priorLam.toFixed(2);
  document.getElementById("lambda_out").textContent = lam.toFixed(2);

  const { alpha, beta, p_nb } = gammaParams(lam);

  const mode = document.querySelector('input[name="chartMode"]:checked').value;
  if (mode === "cdf") {
    renderCDFChart("chart_count", alpha, p_nb);
  } else {
    renderCountChart("chart_count", alpha, p_nb);
  }

  const { days, haz, hLo, hHi } = dailyProbabilities(lam, alpha, beta);

  // График по вирусам
  const breakdown = viralBreakdown(lam);
  const total = viralTotal(breakdown);

  const seasonMode = document.querySelector(
    'input[name="seasonMode"]:checked',
  ).value;
  const dailyEl = document.getElementById("chart_daily");
  const viralEl = document.getElementById("chart_viral");

  if (seasonMode === "viruses") {
    dailyEl.style.display = "none";
    viralEl.style.display = "block";
    renderViralChart("chart_viral", days, breakdown, total);
  } else {
    viralEl.style.display = "none";
    dailyEl.style.display = "block";
    renderDailyChart("chart_daily", days, haz, hLo, hHi);
  }
}

// Ползунки: показываем текущее значение рядом
["transport", "sleep"].forEach((id) => {
  const el = document.getElementById(id);
  const out = document.getElementById(id + "_v");
  out.textContent = el.value;
  el.addEventListener("input", () => {
    out.textContent = el.value;
  });
});

// Все инпуты и селекты вызывают update
document
  .querySelectorAll("input, select")
  .forEach((el) => el.addEventListener("change", update));
document
  .querySelectorAll("input[type=range]")
  .forEach((el) => el.addEventListener("input", update));

// Стартовая инициализация
renderHistoryInputs();
update();
