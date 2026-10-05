import { CONFIG, DAYS_IN_MONTH, VIRUSES } from "./config.js";
import { gammaQuantile } from "./stats.js";

/**
 * Читает значения формы и возвращает объект входных данных.
 */
export function readForm() {
  const g = (id) => document.getElementById(id).value;
  const n = (id) => +document.getElementById(id).value;
  return {
    age: n("age"),
    sex: g("sex"),
    region: g("region"),
    work: g("work"),
    transport: n("transport"),
    kids: !!n("kids"),
    chronic: !!n("chronic"),
    vaccine: !!n("vaccine"),
    smoke: !!n("smoke"),
    sleep: n("sleep"),
    stress: g("stress"),
  };
}

/**
 * Считает λ — ожидаемое число эпизодов ОРВИ за год.
 * Использует коэффициенты из CONFIG.
 */
export function computeLambda(input) {
  let lam = input.personalBase ?? CONFIG.baseLambda;

  // Возраст: первый подходящий диапазон применяется
  for (const { min, max, factor } of CONFIG.ageFactors) {
    if (
      (min == null || input.age >= min) &&
      (max == null || input.age <= max)
    ) {
      lam *= factor;
      break;
    }
  }

  lam *= CONFIG.sexFactors[input.sex];
  lam *= CONFIG.regionFactors[input.region];
  lam *= CONFIG.workFactors[input.work];
  lam *= CONFIG.transportFactor(input.transport);

  if (input.kids) lam *= CONFIG.kidsFactor;
  if (input.chronic) lam *= CONFIG.chronicFactor;
  if (!input.vaccine) lam *= CONFIG.noVaccineFactor;
  if (input.smoke) lam *= CONFIG.smokeFactor;

  if (input.sleep < 6) lam *= CONFIG.sleepFactors.lt6;
  else if (input.sleep < 7) lam *= CONFIG.sleepFactors.lt7;

  lam *= CONFIG.stressFactors[input.stress];

  return Math.max(0.1, lam);
}

/**
 * Вычисляет месячные веса из весов вирусов.
 * Это единственный источник истины для сезонности:
 *   MONTH_WEIGHTS[m] = Σ_v (virus.weight × virus.season[m])
 * Возвращает массив из 12 чисел, сумма = 1.0.
 */
export function monthWeightsFromViruses(viruses = VIRUSES) {
  const out = new Array(12).fill(0);
  for (const v of viruses) {
    for (let m = 0; m < 12; m++) {
      out[m] += v.weight * v.season[m];
    }
  }
  return out;
}

/**
 * Сезонные дневные веса: доля годового риска, приходящаяся на каждый день.
 * Сумма всех 365 значений = 1.0.
 */
export function seasonalDaily(
  weights = monthWeightsFromViruses(),
  dim = DAYS_IN_MONTH,
) {
  const total = weights.reduce((a, b) => a + b, 0);
  const out = [];
  for (let m = 0; m < 12; m++) {
    const perDay = weights[m] / dim[m] / total;
    for (let d = 0; d < dim[m]; d++) out.push(perDay);
  }
  return out;
}

/**
 * Параметры Gamma-prior (эквивалент отрицательного биномиального распределения).
 * Возвращает alpha, beta и p для NegBinom.
 */
export function gammaParams(lam, cv = CONFIG.priorCV) {
  const sigma2 = (lam * cv) ** 2;
  const alpha = (lam * lam) / sigma2;
  const beta = lam / sigma2;
  const p_nb = beta / (beta + 1);
  return { alpha, beta, p_nb };
}

/**
 * Дневные вероятности по всем 365 дням 2027 года + 95% интервал.
 * Возвращает объекты для Plotly: days, haz, hLo, hHi.
 */
export function dailyProbabilities(lam, alpha, beta) {
  const daily = seasonalDaily();
  const start = new Date(2027, 0, 1);
  const days = [],
    haz = [],
    hLo = [],
    hHi = [];

  const aLo = gammaQuantile(alpha, 0.025);
  const aHi = gammaQuantile(alpha, 0.975);
  const lamLo = aLo / beta;
  const lamHi = aHi / beta;

  for (let i = 0; i < 365; i++) {
    days.push(
      new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10),
    );
    haz.push(lam * daily[i]);
    hLo.push(lamLo * daily[i]);
    hHi.push(lamHi * daily[i]);
  }
  return { days, haz, hLo, hHi };
}

/**
 * Байесовская оценка личной λ.
 * priorLambda — популяционное среднее.
 * priorWeight — вес приора в "годах наблюдений".
 * history — массив объектов { year, count }.
 */
export function personalLambda(priorLambda, priorWeight, history) {
  const n = history.length;
  if (n === 0) return priorLambda;

  const sum = history.reduce((a, h) => a + h.count, 0);
  return (priorWeight * priorLambda + sum) / (priorWeight + n);
}

/**
 * Разбивает общую λ по вирусам с учётом их сезонных профилей.
 * Возвращает массив:
 *   [{ id, name, color, daily: [365 чисел] }, ...]
 * где daily[i] — ожидаемое число эпизодов данного вируса в день i
 * (сумма по всем вирусам и дням = λ).
 */
export function viralBreakdown(lam, viruses = VIRUSES, dim = DAYS_IN_MONTH) {
  return viruses.map((v) => {
    const daily = [];
    for (let m = 0; m < 12; m++) {
      const perDay = (v.season[m] * v.weight * lam) / dim[m];
      for (let d = 0; d < dim[m]; d++) daily.push(perDay);
    }
    return { id: v.id, name: v.name, color: v.color, daily };
  });
}

/**
 * Сумма всех вирусов по дням — совпадает с общей λ × seasonalDaily().
 */
export function viralTotal(breakdown) {
  const n = breakdown[0]?.daily.length ?? 0;
  const total = new Array(n).fill(0);
  for (const v of breakdown) {
    for (let i = 0; i < n; i++) total[i] += v.daily[i];
  }
  return total;
}
