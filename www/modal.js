const modal = document.getElementById("modal");
const addBtn = document.getElementById("addBtn");
const saveBtn = document.getElementById("saveBtn");
const closeBtn = document.getElementById("closeBtn");

const nameInput = document.getElementById("name");
const weightInput = document.getElementById("weight");
const setsInput = document.getElementById("sets");
const minRepsInput = document.getElementById("minReps");
const maxRepsInput = document.getElementById("maxReps");

const workoutNameInput = document.getElementById("workoutName");
const workoutNameWrap = document.getElementById("workoutNameWrap");

const timeModal = document.getElementById("timeModal");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");

const saveTimeBtn = document.getElementById("saveTimeBtn");
const closeTimeBtn = document.getElementById("closeTimeBtn");
const timeBtn = document.getElementById("timeBtn");
const bodyweightBtn = document.getElementById("bodyweightBtn");

let isBodyweight = false;

const circuitCheck = document.getElementById("circuitCheck");
const circuitBox = document.getElementById("circuitBox");
const circuitExercisesContainer = document.getElementById(
  "circuitExercisesContainer",
);
const addCircuitExerciseBtn = document.getElementById("addCircuitExerciseBtn");
const normalTimeBox = document.getElementById("normalTimeBox");

const roundMinutesInput = document.getElementById("roundMinutes");
const roundSecondsInput = document.getElementById("roundSeconds");
const roundRestMinutesInput = document.getElementById("roundRestMinutes");
const roundRestSecondsInput = document.getElementById("roundRestSeconds");

const restSecondsInput = document.getElementById("setRestSeconds");
const restMinutesInput = document.getElementById("setRestMinutes");

const roundCountInput = document.getElementById("roundCount");

function updateTrainingFields() {
  if (circuitCheck.checked) {
    setsInput.value = 1;
    setsInput.disabled = true;

    minRepsInput.value = "";
    maxRepsInput.value = "";

    minRepsInput.disabled = true;
    maxRepsInput.disabled = true;
  } else {
    setsInput.disabled = false;

    minRepsInput.disabled = false;
    maxRepsInput.disabled = false;
  }
}

if (circuitCheck) {
  circuitCheck.addEventListener("change", () => {
    circuitBox.classList.toggle("hidden", !circuitCheck.checked);
    normalTimeBox.classList.toggle("hidden", circuitCheck.checked);

    if (circuitCheck.checked) {
      setsInput.value = 1;
      setsInput.disabled = true;
    } else {
      setsInput.disabled = false;
    }

    updateTrainingFields();
  });

  circuitBox.classList.toggle("hidden", !circuitCheck.checked);
  normalTimeBox.classList.toggle("hidden", circuitCheck.checked);
}

function addCircuitExerciseInput(value = "") {
  const row = document.createElement("div");
  row.className = "circuit-exercise-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "circuit-exercise-input";
  input.placeholder = "Harjutuse nimi";
  input.value = value;

  const removeBtn = document.createElement("button");
  removeBtn.className = "removeBtn";
  removeBtn.innerHTML = '<i data-lucide="trash-2"></i>';

  removeBtn.onclick = () => {
    row.remove();
  };

  row.appendChild(input);
  row.appendChild(removeBtn);

  circuitExercisesContainer.appendChild(row);
  lucide.createIcons();
}

addCircuitExerciseBtn.addEventListener("click", () => {
  addCircuitExerciseInput();
});

function updateWorkoutNameVisibility() {
  const dayEntry = getDayEntry(currentDate);
  const shouldShow = !dayEntry.workoutName;

  if (workoutNameWrap) {
    workoutNameWrap.classList.toggle("hidden", !shouldShow);
  }

  if (!shouldShow) {
    workoutNameInput.value = "";
  }
}

timeBtn.addEventListener("click", () => {
  circuitCheck.checked = false;

  circuitBox.classList.add("hidden");
  normalTimeBox.classList.remove("hidden");

  timeModal.classList.remove("hidden");
});

bodyweightBtn.addEventListener("click", () => {
  isBodyweight = !isBodyweight;

  if (isBodyweight) {
    weightInput.value = "Keharaskus";
    weightInput.disabled = true;
    bodyweightBtn.classList.add("active");
  } else {
    weightInput.value = "";
    weightInput.disabled = false;
    bodyweightBtn.classList.remove("active");
  }
});

addBtn.addEventListener("click", () => {
  clearInputs();

  circuitCheck.checked = false;

  circuitBox.classList.add("hidden");
  normalTimeBox.classList.remove("hidden");

  updateTrainingFields();

  modal.classList.remove("hidden");
  updateWorkoutNameVisibility();
});

closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

saveTimeBtn.addEventListener("click", () => {
  if (circuitCheck.checked) {
    const min = roundMinutesInput.value || 0;
    const sec = roundSecondsInput.value || 0;

    weightInput.value = `${min}:${String(sec).padStart(2, "0")}`;
  } else {
    const min = minutesInput.value || 0;
    const sec = secondsInput.value || 0;

    weightInput.value = `${min}:${String(sec).padStart(2, "0")}`;
  }

  timeModal.classList.add("hidden");
});

closeTimeBtn.addEventListener("click", () => {
  timeModal.classList.add("hidden");
});

saveBtn.addEventListener("click", () => {
  const circuitExercises = [];

  document.querySelectorAll(".circuit-exercise-input").forEach((input) => {
    const name = input.value.trim();

    if (name) {
      circuitExercises.push(name);
    }
  });
  const setsArray = [];

  const setsCount = Number(setsInput.value);

  for (let i = 0; i < setsCount; i++) {
    if (circuitCheck.checked) {
      setsArray.push({
        plannedReps: null,
        actualReps: null,

        circuit: true,
        circuitExercises: circuitExercises,

        roundTime:
          `${roundMinutesInput.value || 0}:` +
          `${String(roundSecondsInput.value || 0).padStart(2, "0")}`,

        restTime:
          `${restMinutesInput.value || 0}:` +
          `${String(restSecondsInput.value || 0).padStart(2, "0")}`,

        roundRestTime:
          `${roundRestMinutesInput.value || 0}:` +
          `${String(roundRestSecondsInput.value || 0).padStart(2, "0")}`,

        rounds: Number(roundCountInput.value),

        currentExercise: 0,
        currentRound: 1,
        phase: "work",
        actualTime: "0:00",

        done: null,
      });
    } else {
      const restMinutes = Number(restMinutesInput.value) || 0;
      const restSeconds = Number(restSecondsInput.value) || 0;

      const restTime = restMinutes * 60 + restSeconds;

      setsArray.push({
        plannedReps: Number(maxRepsInput.value),
        actualReps: null,

        weight: isBodyweight ? "BW" : weightInput.value.trim(),
        bodyweight: isBodyweight,

        restTime: restTime,
        actualTime: null,
        circuit: false,
        done: null,
      });
    }
  }

  const dayEntry = getDayEntry(currentDate);

  if (dayEntry.exercises.length >= 50) {
    showDialogPopup({
      title: "Liiga palju harjutusi",
      message: "Ühele päevale saab lisada kuni 50 harjutust.",
      confirmText: "OK",
    });
    return;
  }
  const workoutName = workoutNameInput.value.trim();

  if (!dayEntry.workoutName && workoutName) {
    dayEntry.workoutName = workoutName;
  }

  const exercise = {
    name: nameInput.value,
    type: circuitCheck.checked
      ? "time"
      : isBodyweight
        ? "bodyweight"
        : weightInput.value.includes(":")
          ? "time"
          : "weight",
    repRange: {
      min: Number(minRepsInput.value),
      max: Number(maxRepsInput.value),
    },
    open: true,
    sets: setsArray,
  };

  dayEntry.exercises.push(exercise);
  setDayEntry(currentDate, dayEntry);

  save();
  modal.classList.add("hidden");
  clearInputs();
  render();
});

function clearInputs() {
  nameInput.value = "";
  weightInput.value = "";
  weightInput.disabled = false;

  setsInput.value = "";
  setsInput.disabled = false;

  minRepsInput.value = "";
  maxRepsInput.value = "";

  minutesInput.value = ""; //delete kui tahan ajalise meelde jätta + seconds
  secondsInput.value = "";

  roundMinutesInput.value = ""; //kui tahan ajad meelde jätta circuit trainingul - siis delete kuni roundCountini
  roundSecondsInput.value = "";
  restMinutesInput.value = "";
  restSecondsInput.value = "";
  roundRestMinutesInput.value = "";
  roundRestSecondsInput.value = "";
  roundCountInput.value = "";

  circuitExercisesContainer.innerHTML = ""; //kui tahan circuit-il harjutused meelde jätta siis see rida delete

  minRepsInput.disabled = false;
  maxRepsInput.disabled = false;

  workoutNameInput.value = "";

  isBodyweight = false;
  bodyweightBtn.classList.remove("active");
}
