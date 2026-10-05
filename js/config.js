// Все константы модели в одном месте.
// Легко менять, не трогая логику.
// Позже можно загружать из data/*.json или из API.

export const CONFIG = {
  // Базовая интенсивность: сколько эпизодов ОРВИ в год у "среднего" человека
  baseLambda: 2.0,

  // Влияние возраста: первый подходящий диапазон применяется
  ageFactors: [
    { max: 17, factor: 1.6, label: "до 18 лет" },
    { min: 60, factor: 1.25, label: "60+" },
  ],

  sexFactors: { m: 1.0, f: 1.05 },

  regionFactors: { moscow: 1.0, spb: 1.1, other: 0.9 },

  workFactors: { office: 1.0, hybrid: 0.85, remote: 0.6 },

  // Функция от числа дней в неделю в общественном транспорте
  transportFactor: (days) => 0.7 + 0.1 * days,

  kidsFactor: 1.5,
  chronicFactor: 1.35,
  noVaccineFactor: 1.15,
  smokeFactor: 1.2,

  sleepFactors: { lt6: 1.3, lt7: 1.1 },

  stressFactors: { low: 0.9, mid: 1.0, high: 1.2 },

  // Коэффициент вариации для Gamma-prior (байесовская часть)
  priorCV: 0.5,
};

// Сезонные веса по месяцам (январь .. декабрь).
// Источник: обобщённые данные по Москве, позже заменим на API.
export const MONTH_WEIGHTS = [
  0.1, 0.15, 0.1, 0.08, 0.06, 0.04, 0.03, 0.04, 0.12, 0.1, 0.08, 0.1,
];

// Дней в месяцах для 2027 года (не високосный)
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
