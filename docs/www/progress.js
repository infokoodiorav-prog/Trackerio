const burgerBtn = document.getElementById("burgerBtn");
const navMenu = document.getElementById("navMenu");

if (burgerBtn && navMenu) {
  burgerBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isHidden = navMenu.classList.toggle("hidden");
    burgerBtn.setAttribute("aria-expanded", String(!isHidden));
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = navMenu.contains(event.target);
    const clickedBurger = burgerBtn.contains(event.target);

    if (
      !clickedInsideMenu &&
      !clickedBurger &&
      !navMenu.classList.contains("hidden")
    ) {
      navMenu.classList.add("hidden");
      burgerBtn.setAttribute("aria-expanded", "false");
    }
  });
}

function getExerciseHistory() {
  const history = {};

  const allWorkouts = getAllWorkouts();

  Object.entries(allWorkouts).forEach(([date, day]) => {
    day.exercises.forEach((ex) => {
      if (!history[ex.name]) {
        history[ex.name] = [];
      }

      let bestSet = null;

      ex.sets.forEach((set) => {
        if (set.done === null) return;

        if (set.circuit) {
          const value = timeToSeconds(set.roundTime) * set.rounds;

          if (!bestSet || value > bestSet.value) {
            bestSet = {
              type: "circuit",
              value,
              reps: set.rounds,
            };
          }
        } else if (set.weight && String(set.weight).includes(":")) {
          const value = timeToSeconds(set.weight);

          if (!bestSet || value > bestSet.value) {
            bestSet = {
              type: "time",
              value,
            };
          }
        } else if (set.weight) {
          const value = Number(set.weight);

          if (!bestSet || value > bestSet.weight) {
            bestSet = {
              type: "weight",
              weight: value,
              reps: set.actualReps ?? set.plannedReps,
            };
          }
        } else if (set.actualReps || set.plannedReps) {
          const reps = set.actualReps ?? set.plannedReps;

          if (!bestSet || reps > bestSet.reps) {
            bestSet = {
              type: "bodyweight",
              reps,
            };
          }
        }
      });

      if (bestSet) {
        history[ex.name].push({
          date,
          sets: ex.sets.filter((set) => set.done !== null).length,
          weight: bestSet.weight ?? null,
          reps: bestSet.reps ?? null,
          value: bestSet.value ?? null,
          type: bestSet.type,
        });
      }
    });
  });

  return history;
}

function timeToSeconds(time) {
  if (!time) return 0;

  const [min, sec] = time.split(":").map(Number);

  return min * 60 + sec;
}

function formatProgressValue(item) {
  if (item.type === "circuit") {
    const min = Math.floor(item.value / 60);
    const sec = item.value % 60;

    return `${min}:${String(sec).padStart(2, "0")}`;
  }
  if (item.type === "time") {
    const min = Math.floor(item.value / 60);
    const sec = item.value % 60;

    return `${min}:${String(sec).padStart(2, "0")}`;
  }

  if (item.type === "bodyweight") {
    return `${item.value ?? item.reps} kordust`;
  }

  return `${item.value ?? item.weight}kg`;
}

function getMostFrequentExercises() {
  const allWorkouts = getAllWorkouts();

  const exerciseCount = {};

  const now = new Date();

  Object.entries(allWorkouts).forEach(([date, day]) => {
    const workoutDate = new Date(date);

    if (workoutDate > now) return;

    const diff = (now - workoutDate) / (1000 * 60 * 60 * 24);

    if (diff > 30) return;

    const countedToday = new Set();

    day.exercises.forEach((ex) => {
      const completed = ex.sets.some((set) => set.done !== null);

      if (!completed) return;

      countedToday.add(ex.name);
    });

    countedToday.forEach((name) => {
      exerciseCount[name] = (exerciseCount[name] || 0) + 1;
    });
  });

  return Object.entries(exerciseCount)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function getExerciseStats(name) {
  const data = getExerciseHistory()[name];

  if (!data || data.length === 0) {
    return null;
  }

  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  const first = data[0];
  const last = data[data.length - 1];

  const best = data.reduce((max, item) => {
    const current =
      item.type === "time"
        ? item.value
        : item.type === "bodyweight"
          ? item.reps
          : item.weight;
    const previous =
      max.type === "time"
        ? max.value
        : max.type === "bodyweight"
          ? max.reps
          : max.weight;

    return current > previous ? item : max;
  });

  return {
    name,
    firstValue:
      first.type === "time"
        ? first.value
        : first.type === "bodyweight"
          ? first.reps
          : first.weight,

    lastValue:
      last.type === "time"
        ? last.value
        : last.type === "bodyweight"
          ? last.reps
          : last.weight,

    bestValue:
      best.type === "time"
        ? best.value
        : best.type === "bodyweight"
          ? best.reps
          : best.weight,
    progress:
      best.type === "time"
        ? best.value - first.value
        : best.type === "bodyweight"
          ? best.reps - first.reps
          : best.weight - first.weight,
    type: first.type,

    workouts: [...new Set(data.map((x) => x.date))].length,
  };
}

function getWorkoutStats() {
  const allWorkouts = getAllWorkouts();

  const now = new Date();

  let planned = 0;

  let completed = 0;

  Object.entries(allWorkouts).forEach(([date, day]) => {
    const workoutDate = new Date(date);

    const diff = (now - workoutDate) / (1000 * 60 * 60 * 24);

    if (diff >= 0 && diff <= 30) {
      if (day.exercises?.length) {
        planned++;

        const workoutDone = day.exercises.every((ex) =>
          ex.sets.some((set) => set.done !== null),
        );

        if (workoutDone) {
          completed++;
        }
      }
    }
  });

  return {
    planned,
    completed,
  };
}

const statsContainer = document.getElementById("workoutStats");

const stats = getWorkoutStats();

statsContainer.innerHTML = `



<h2>Viimased 30 päeva</h2>


<p>
Treeningud:
<strong>
${stats.completed}/${stats.planned}
</strong>
</p>

`;

function renderFrequentExercises() {
  const container = document.getElementById("topExercises");

  if (!container) return;

  const exercises = getMostFrequentExercises().slice(0, 3);

  const medals = ["🥇", "🥈", "🥉"];

  container.innerHTML = `
    <h3>Kõige sagedasemad harjutused</h3>
<hr>
    ${exercises
      .map(
        (ex, index) => `
        <div class="top-exercise">
  <span class="rank">${medals[index]}</span>

  <div class="exercise-info">
    <span>${ex.name}</span>
    <strong>${ex.count}x kuus</strong>
    
  </div>
 
</div>

        `,
      )
      .join("")}
  `;
}
renderFrequentExercises();

function createProgressCard(stats) {
  const card = document.createElement("div");

  card.className = "progress-card";

  card.innerHTML = `

<div class="progress-header">


<h2>${stats.name}</h2>

<div class="progress-summary">

<span class="progress-number">


${
  stats.type === "time"
    ? "+" +
      formatProgressValue({
        type: stats.type,
        value: stats.progress,
      })
    : stats.type === "bodyweight"
      ? "+" + stats.progress + " kordust"
      : (stats.progress > 0 ? "+" : "") + stats.progress + "kg"
}


</span>


<span class="arrow">
  <i data-lucide="chevron-down"></i>
</span>


</div>


</div>




<div class="progress-content hidden">


<p>
  <span>Algus:</span>

  <strong>
    ${formatProgressValue({
      type: stats.type,
      value: stats.firstValue,
    })}
  </strong>
</p>

<p>
  <span>Praegu:</span>

  <strong>
    ${formatProgressValue({
      type: stats.type,
      value: stats.lastValue,
    })}
  </strong>
</p>

<p>
  <span>Parim:</span>

  <strong>
    ${formatProgressValue({
      type: stats.type,
      value: stats.bestValue,
    })}
  </strong>
</p>

<p>
  <span>Treeninguid:</span>

  <strong>
    ${stats.workouts}
  </strong>
</p>


<button class="historyBtn">
  Ava ajalugu
</button>
</div>

`;

  const header = card.querySelector(".progress-header");

  const content = card.querySelector(".progress-content");

  const arrow = card.querySelector(".arrow");

  const historyBtn = card.querySelector(".historyBtn");

  if (historyBtn) {
    historyBtn.onclick = (event) => {
      event.stopPropagation();

      openExerciseHistory(stats.name);
    };
  }

  header.onclick = () => {
    content.classList.toggle("hidden");
    arrow.classList.toggle("open");

    lucide.createIcons();
  };

  lucide.createIcons();

  return card;
}

const allExercisesContainer = document.getElementById("allExercises");

if (allExercisesContainer) {
  const exerciseList = getAllExercises();

  exerciseList.forEach((name) => {
    const stats = getExerciseStats(name);

    if (stats) {
      allExercisesContainer.appendChild(createProgressCard(stats));
    }
  });
}

const showAllBtn = document.getElementById("showAllExercises");
const allExercises = document.getElementById("allExercises");
const search = document.getElementById("exerciseSearch");
const searchBox = document.querySelector(".search-box");
const clearSearch = document.getElementById("clearSearch");

let currentFilter = 30;

if (showAllBtn && allExercises && search && searchBox && clearSearch) {
  showAllBtn.onclick = () => {
    allExercises.classList.toggle("hidden");
    searchBox.classList.toggle("hidden");

    showAllBtn.textContent = allExercises.classList.contains("hidden")
      ? "Vaata kõiki harjutusi"
      : "Peida harjutused";

    if (allExercises.classList.contains("hidden")) {
      search.value = "";
      clearSearch.classList.add("hidden");

      allExercises.querySelectorAll(".progress-card").forEach((card) => {
        card.style.display = "";
      });
    } else {
      search.focus();
    }
  };

  search.addEventListener("input", () => {
    const value = search.value.toLowerCase();

    clearSearch.classList.toggle("hidden", value === "");

    allExercises.querySelectorAll(".progress-card").forEach((card) => {
      const name = card.querySelector("h2").textContent.toLowerCase();

      card.style.display = name.includes(value) ? "" : "none";
    });
  });

  clearSearch.onclick = () => {
    search.value = "";

    clearSearch.classList.add("hidden");

    allExercises.querySelectorAll(".progress-card").forEach((card) => {
      card.style.display = "";
    });

    search.focus();
  };
}
lucide.createIcons();

function getTotalExercises() {
  const history = getExerciseHistory();

  return Object.keys(history).length;
}

const totalExercises = document.getElementById("totalExercises");

if (totalExercises) {
  totalExercises.textContent = `Harjutusi kokku: ${getTotalExercises()}`;
}

function openExerciseHistory(exerciseName, resetFilter = true) {
  if (resetFilter) {
    currentFilter = 30;
  }

  const history = getExerciseHistory()[exerciseName];

  if (!history || history.length === 0) return;
  const headers = getHistoryHeaders(history[0].type);

  if (!history || history.length === 0) return;

  let historyPopup = document.getElementById("historyPopup");

  if (!historyPopup) {
    historyPopup = document.createElement("div");
    historyPopup.id = "historyPopup";
    historyPopup.className = "history-popup";

    document.body.appendChild(historyPopup);
  }

  function filterHistory(history, days) {
    if (days === "all") {
      return history;
    }

    const now = new Date();

    return history.filter((item) => {
      const workoutDate = new Date(item.date);

      const diff = (now - workoutDate) / (1000 * 60 * 60 * 24);

      return diff <= days;
    });
  }

  const latest = [...filterHistory(history, currentFilter)].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  historyPopup.innerHTML = `

  
    <div class="history-popup-content">
<button class="history-close" aria-label="Sulge ajalugu">
  <i data-lucide="x"></i>  
</button>

      <h2>${exerciseName}</h2>
 <hr class="hr">
     <div class="history-table">

  <div class="history-row history-header">
    <span>Kuupäev</span>
    <span>Seeriad</span>
    <span>${headers.value}</span>
${headers.extra ? `<span>${headers.extra}</span>` : ""}
  </div>

  ${latest
    .map(
      (item) => `
        <div class="history-row">

          <span>
            ${formatDate(item.date)}
          </span>

          <span>
            ${item.sets}
          </span>

          <span>
  ${
    item.type === "weight"
      ? item.weight + "kg"
      : item.type === "time" || item.type === "circuit"
        ? formatProgressValue(item)
        : item.type === "bodyweight"
          ? "BW"
          : "-"
  }
</span>

          <span>
            ${item.reps ?? "-"}
          </span>

        </div>
      `,
    )
    .join("")}

</div>

      <div class="history-filters">

        <button data-filter="30">Viimane kuu</button>
<button data-filter="180">6 kuud</button>
<button data-filter="365">1 aasta</button>
<button data-filter="1825">5 aastat</button>
<button data-filter="all">Kõik</button>

      </div>

    </div>
  `;

  lucide.createIcons();

  historyPopup.classList.add("show");

  const filterButtons = historyPopup.querySelectorAll(
    ".history-filters button",
  );

  filterButtons.forEach((button) => {
    if (String(currentFilter) === button.dataset.filter) {
      button.classList.add("active");
    }

    button.onclick = () => {
      filterButtons.forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      currentFilter =
        button.dataset.filter === "all" ? "all" : Number(button.dataset.filter);

      openExerciseHistory(exerciseName, false);
    };
  });

  historyPopup.querySelector(".history-close").onclick = () => {
    historyPopup.classList.remove("show");
  };
}

function getHistoryHeaders(type) {
  if (type === "weight") {
    return {
      value: "Raskus",
      extra: "Kordused",
    };
  }

  if (type === "bodyweight") {
    return {
      value: "BW",
      extra: "Kordused",
    };
  }

  if (type === "time") {
    return {
      value: "Kestus",
      extra: null,
    };
  }

  if (type === "circuit") {
    return {
      value: "Aeg",
      extra: "Ringid",
    };
  }

  return {
    value: "Tulemus",
    extra: "Kordused",
  };
}

function formatDate(date) {
  const [year, month, day] = date.split("-");

  return `${day}.${month}.${year}`;
}

function getAllExercises() {
  const exercises = new Set();

  const allWorkouts = getAllWorkouts();

  Object.values(allWorkouts).forEach((day) => {
    day.exercises.forEach((ex) => {
      exercises.add(ex.name);
    });
  });

  return [...exercises];
}
