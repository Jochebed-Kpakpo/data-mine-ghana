const DATA = [
  [2000,1688,0,568,0,4410,6666],[2001,1761,0,568,0,4236,6565],[2002,2277,0,433,0,4135,6845],[2003,2347,0,334,0,4009,6691],[2004,2094,0,454,0,4041,6589],[2005,2103,0,484,0,4030,6617],[2006,2908,0,483,0,4047,7437],[2007,3082,0,320,0,4036,7438],[2008,2862,0,533,0,3975,7370],[2009,2390,5,591,0,3975,6961],[2010,2934,416,601,0,3903,7855],[2011,2874,813,650,0,3918,8255],[2012,3467,412,694,0,4137,8710],[2013,4137,308,708,0,4485,9639],[2014,4061,655,721,0,4614,10051],[2015,3766,1253,503,0,4738,10260],[2016,4613,732,478,2,4868,10694],[2017,3998,1211,483,2,5066,10761],[2018,4276,1676,517,3,5015,11488],[2019,4395,2107,624,4,4942,12072],[2020,4305,3014,627,5,4822,12773],[2021,4470,3189,647,11,4275,12591],[2022,4152,3472,704,14,4073,12416],[2023,4642,3487,790,13,4043,12975],[2024,4943,3906,851,16,4026,13741]
];
const SERIES = [
  { name: "Oil", index: 1, color: "#d86b45" },
  { name: "Natural gas", index: 2, color: "#287eae" },
  { name: "Hydro", index: 3, color: "#534eb3" },
  { name: "Solar", index: 4, color: "#d79f16" },
  { name: "Biomass", index: 5, color: "#18845c" }
];
const state = { mode: "value", start: 2000, active: new Set(SERIES.map(s => s.name)) };
const svg = document.querySelector("#energy-chart");
const controls = document.querySelector(".source-controls");
const tooltip = document.querySelector("#tooltip");
const NS = "http://www.w3.org/2000/svg";

const LENSES = {
  investor: { kicker: "INVESTMENT SIGNAL", title: "Demand growth is clear. The opportunity is in how future supply is met.", body: "Total energy supply increased by 106% between 2000 and 2024. Solar’s reported contribution remains very small, signalling room for deeper investigation into renewable generation, grid readiness, financing and project pipelines.", points: ["Track the fastest-growing supply sources", "Identify underrepresented technologies", "Combine with tariffs, demand and project data before investing"], note: "Energy-supply statistics are a screening signal, not investment advice." },
  policy: { kicker: "POLICY QUESTION", title: "Can supply growth become cleaner, more resilient and more inclusive?", body: "The mix is more diversified than it was in 2000, but fossil sources now account for almost two-thirds of supply. Biomass remains significant and solar remains small, making clean cooking, renewable scale-up and system resilience important policy questions.", points: ["Monitor fossil-fuel concentration and exposure", "Connect biomass trends to clean-cooking outcomes", "Measure whether renewable policy is changing the mix"], note: "This dataset describes supply; policy evaluation requires access, affordability and reliability indicators too." },
  student: { kicker: "LEARNING PATH", title: "This is a real-world example of an energy transition in motion.", body: "The series shows that transitions are not simple replacements. Ghana added natural gas, retained substantial oil and biomass use, and grew hydro and solar at different speeds while total demand expanded.", points: ["Compare absolute supply with percentage share", "Relate turning points to historical events", "Use the downloadable data for assignments and projects"], note: "Start with the chart, then consult the original bulletin for definitions and wider context." },
  analyst: { kicker: "ANALYTICAL STARTING POINT", title: "A traceable series ready for comparison, modelling and extension.", body: "The structured dataset retains year, source, unit and publication provenance. Analysts can reproduce the displayed shares, calculate growth rates and join the series with GDP, population, prices, emissions or capacity data.", points: ["Download a tidy, machine-readable CSV", "Reproduce every derived figure", "Return to the cited table and page for verification"], note: "Document revisions and methodological changes should be checked before combining editions." }
};

document.querySelectorAll(".lens-tabs button").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".lens-tabs button").forEach(item => item.setAttribute("aria-selected", String(item === button)));
  const lens = LENSES[button.dataset.lens];
  const panel = document.querySelector(".lens-panel");
  panel.innerHTML = `<p class="lens-kicker">${lens.kicker}</p><h3>${lens.title}</h3><p>${lens.body}</p><ul>${lens.points.map(point => `<li>${point}</li>`).join("")}</ul><small>${lens.note}</small>`;
  panel.focus();
}));

SERIES.forEach(series => {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-pressed", "true");
  button.innerHTML = `<i style="background:${series.color}"></i>${series.name}`;
  button.addEventListener("click", () => {
    state.active.has(series.name) ? state.active.delete(series.name) : state.active.add(series.name);
    button.setAttribute("aria-pressed", String(state.active.has(series.name)));
    draw();
  });
  controls.append(button);
});

document.querySelectorAll(".metric-toggle button").forEach(button => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    document.querySelectorAll(".metric-toggle button").forEach(item => {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    draw();
  });
});

document.querySelector("#start-year").addEventListener("input", event => {
  state.start = Number(event.target.value);
  document.querySelector("#start-output").value = state.start;
  document.querySelector("#range-summary").textContent = `Showing ${state.start}–2024`;
  draw();
});

function add(type, attributes, parent = svg) {
  const element = document.createElementNS(NS, type);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  parent.append(element);
  return element;
}

function draw() {
  svg.replaceChildren();
  const rows = DATA.filter(row => row[0] >= state.start);
  const margin = { top: 24, right: 24, bottom: 42, left: 64 };
  const width = 1000 - margin.left - margin.right;
  const height = 440 - margin.top - margin.bottom;
  const max = state.mode === "share" ? 70 : Math.ceil(Math.max(...rows.flatMap(row => SERIES.map(s => row[s.index]))) / 1000) * 1000;
  const x = year => margin.left + ((year - rows[0][0]) / Math.max(1, rows.at(-1)[0] - rows[0][0])) * width;
  const value = (row, series) => state.mode === "share" ? (row[series.index] / row[6]) * 100 : row[series.index];
  const y = val => margin.top + height - (val / max) * height;

  for (let step = 0; step <= 4; step++) {
    const val = max * step / 4;
    const py = y(val);
    add("line", { x1: margin.left, y1: py, x2: 1000 - margin.right, y2: py, class: "grid-line" });
    const label = add("text", { x: margin.left - 12, y: py + 4, "text-anchor": "end", class: "axis-label" });
    label.textContent = state.mode === "share" ? `${val.toFixed(0)}%` : val.toLocaleString();
  }
  rows.forEach((row, index) => {
    if (index % Math.max(1, Math.ceil(rows.length / 6)) === 0 || index === rows.length - 1) {
      const label = add("text", { x: x(row[0]), y: 426, "text-anchor": "middle", class: "axis-label" });
      label.textContent = row[0];
    }
  });

  SERIES.filter(series => state.active.has(series.name)).forEach(series => {
    const points = rows.map(row => `${x(row[0])},${y(value(row, series))}`).join(" ");
    add("polyline", { points, stroke: series.color, class: "series-line" });
    const hit = add("polyline", { points, class: "hit-line", tabindex: "0", "aria-label": `${series.name} series` });
    const show = event => {
      const rect = svg.getBoundingClientRect();
      const relativeX = (event.clientX - rect.left) / rect.width * 1000;
      const closest = rows.reduce((best, row) => Math.abs(x(row[0]) - relativeX) < Math.abs(x(best[0]) - relativeX) ? row : best, rows[0]);
      const val = value(closest, series);
      tooltip.innerHTML = `<strong>${series.name} · ${closest[0]}</strong><span>${state.mode === "share" ? val.toFixed(1) + "%" : Math.round(val).toLocaleString() + " ktoe"}</span>`;
      tooltip.hidden = false;
      tooltip.style.left = `${x(closest[0]) / 10}%`;
      tooltip.style.top = `${y(val) / 4.4}%`;
    };
    hit.addEventListener("mousemove", show);
    hit.addEventListener("mouseleave", () => tooltip.hidden = true);
    hit.addEventListener("focus", () => {
      const latest = rows.at(-1), val = value(latest, series);
      tooltip.innerHTML = `<strong>${series.name} · ${latest[0]}</strong><span>${state.mode === "share" ? val.toFixed(1) + "%" : Math.round(val).toLocaleString() + " ktoe"}</span>`;
      tooltip.hidden = false;
      tooltip.style.left = `${x(latest[0]) / 10}%`;
      tooltip.style.top = `${y(val) / 4.4}%`;
    });
    hit.addEventListener("blur", () => tooltip.hidden = true);
  });
}
draw();

function drawOverview() {
  const totalSvg = document.querySelector("#total-chart");
  const max = 14000, margin = { left: 30, right: 18, top: 22, bottom: 30 }, width = 700 - margin.left - margin.right, height = 280 - margin.top - margin.bottom;
  const x = year => margin.left + (year - 2000) / 24 * width;
  const y = value => margin.top + height - value / max * height;
  [0, 7000, 14000].forEach(value => {
    const line = document.createElementNS(NS, "line");
    Object.entries({ x1: margin.left, y1: y(value), x2: 682, y2: y(value), class: "grid-line" }).forEach(([k,v]) => line.setAttribute(k,v));
    totalSvg.append(line);
  });
  const area = document.createElementNS(NS, "path");
  const points = DATA.map(row => `${x(row[0])},${y(row[6])}`).join(" L ");
  area.setAttribute("d", `M ${x(2000)},${y(0)} L ${points} L ${x(2024)},${y(0)} Z`);
  area.setAttribute("class", "total-area"); totalSvg.append(area);
  const line = document.createElementNS(NS, "path"); line.setAttribute("d", `M ${points}`); line.setAttribute("class", "total-line"); totalSvg.append(line);
  [2000, 2012, 2024].forEach(year => { const text = document.createElementNS(NS, "text"); text.setAttribute("x", x(year)); text.setAttribute("y", 272); text.setAttribute("text-anchor", "middle"); text.setAttribute("class", "axis-label"); text.textContent = year; totalSvg.append(text); });

  const latest = DATA.at(-1), colors = SERIES.map(s => s.color), stops = []; let cursor = 0;
  SERIES.forEach((series, i) => { const share = latest[series.index] / latest[6] * 100; stops.push(`${colors[i]} ${cursor}% ${cursor + share}%`); cursor += share; });
  document.querySelector(".donut").style.background = `conic-gradient(${stops.join(",")})`;
  document.querySelector(".mix-legend").innerHTML = SERIES.map(series => `<li><i style="background:${series.color}"></i><span>${series.name}</span><strong>${(latest[series.index]/latest[6]*100).toFixed(1)}%</strong></li>`).join("");

  const first = DATA[0];
  document.querySelector("#shift-bars").innerHTML = SERIES.map(series => {
    const oldShare = first[series.index] / first[6] * 100, newShare = latest[series.index] / latest[6] * 100;
    return `<div class="shift-row"><span>${series.name}</span><div class="bar-pair"><i style="width:${oldShare}%;background:#cbd5d0"></i><i style="width:${newShare}%;background:${series.color}"></i></div><small>${oldShare.toFixed(1)}% → ${newShare.toFixed(1)}%</small></div>`;
  }).join("");
}
drawOverview();
