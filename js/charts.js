import { negBinomPMF, gammaQuantile } from "./stats.js";

/**
 * Гистограмма распределения числа эпизодов ОРВИ за год.
 * Плюс 95% интервал — две пунктирные линии.
 */
export function renderCountChart(elementId, alpha, p_nb) {
  const ks = [],
    pmf = [],
    lo = [],
    hi = [];

  const aLo = gammaQuantile(alpha, 0.025);
  const aHi = gammaQuantile(alpha, 0.975);

  for (let k = 0; k <= 12; k++) {
    ks.push(k);
    pmf.push(negBinomPMF(k, alpha, p_nb));
    lo.push(negBinomPMF(k, aLo, p_nb));
    hi.push(negBinomPMF(k, aHi, p_nb));
  }

  Plotly.react(
    elementId,
    [
      {
        x: ks,
        y: pmf,
        type: "bar",
        name: "P(N=k)",
        marker: { color: "#1f6feb", line: { color: "#1558c0", width: 1 } },
        hovertemplate: "k=%{x}<br>P=%{y:.4f}<extra></extra>",
      },
      {
        x: ks,
        y: lo,
        type: "scatter",
        mode: "lines",
        name: "2.5%",
        line: { color: "#f0a020", dash: "dash", width: 1 },
        hoverinfo: "skip",
      },
      {
        x: ks,
        y: hi,
        type: "scatter",
        mode: "lines",
        name: "97.5%",
        line: { color: "#f0a020", dash: "dash", width: 1 },
        hoverinfo: "skip",
      },
    ],
    {
      title: {
        text: "Распределение числа эпизодов ОРВИ за 2027",
        font: { size: 15 },
      },
      xaxis: { title: "Число эпизодов", dtick: 1 },
      yaxis: { title: "Вероятность", tickformat: ".1%" },
      margin: { l: 60, r: 20, t: 50, b: 50 },
      legend: { orientation: "h", y: -0.2 },
      plot_bgcolor: "#fafbfc",
      paper_bgcolor: "#fff",
    },
    { responsive: true },
  );
}

/**
 * Линия дневной вероятности по 365 дням + 95% интервал.
 */
export function renderDailyChart(elementId, days, haz, hLo, hHi) {
  Plotly.react(
    elementId,
    [
      {
        x: days,
        y: hLo,
        type: "scatter",
        mode: "lines",
        name: "2.5%",
        line: { color: "#f0a020", dash: "dot", width: 1 },
        hoverinfo: "skip",
      },
      {
        x: days,
        y: hHi,
        type: "scatter",
        mode: "lines",
        name: "97.5%",
        line: { color: "#f0a020", dash: "dot", width: 1 },
        hoverinfo: "skip",
      },
      {
        x: days,
        y: haz,
        type: "scatter",
        mode: "lines",
        name: "Средняя",
        line: { color: "#1f6feb", width: 2 },
        fill: "tozeroy",
        fillcolor: "rgba(31,111,235,0.12)",
      },
    ],
    {
      title: {
        text: "Вероятность начала эпизода по дням (λ и 95% интервал)",
        font: { size: 15 },
      },
      xaxis: { title: "Дата", type: "date" },
      yaxis: { title: "Вероятность в день", tickformat: ".2%" },
      margin: { l: 70, r: 20, t: 50, b: 50 },
      legend: { orientation: "h", y: -0.2 },
      plot_bgcolor: "#fafbfc",
      paper_bgcolor: "#fff",
    },
    { responsive: true },
  );
}
