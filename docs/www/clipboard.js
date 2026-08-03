const copyWorkoutBtn = document.getElementById("copyWorkoutBtn");
const pasteWorkoutBtn = document.getElementById("pasteWorkoutBtn");
if (copyWorkoutBtn) {
  copyWorkoutBtn.addEventListener("click", copyWorkout);
}

if (pasteWorkoutBtn) {
  pasteWorkoutBtn.addEventListener("click", pasteClipboard);
}

function copyWorkout() {
  const dayEntry = getDayEntry(currentDate);

  if (!dayEntry.exercises.length) {
    showDialogPopup({
      title: "Pole midagi kopeerida",
      message: "Sellel päeval pole ühtegi harjutust.",
      confirmText: "OK",
    });
    return;
  }

  localStorage.removeItem("copiedExercise");
  localStorage.setItem("copiedWorkout", JSON.stringify(dayEntry));

  showDialogPopup({
    title: "Kopeeritud",
    message: "Treening kopeeriti edukalt.",
    confirmText: "OK",
  });
}

function pasteWorkout() {
  const copied = localStorage.getItem("copiedWorkout");

  if (!copied) {
    showDialogPopup({
      title: "Pole midagi kleepida",
      message: "Kõigepealt kopeeri treening.",
      confirmText: "OK",
    });
    return;
  }

  const workout = structuredClone(JSON.parse(copied));

  const currentWorkout = getDayEntry(currentDate);

  const copiedExercises = workout.exercises.map((ex) => {
    ex.open = true;
    ex.userToggled = false;

    ex.sets.forEach((set) => {
      set.done = null;
      set.actualReps = null;
    });

    return ex;
  });

  if (currentWorkout.exercises.length + copiedExercises.length > 50) {
    showDialogPopup({
      title: "Liiga palju harjutusi",
      message: "Ühele päevale saab lisada kuni 50 harjutust.",
      confirmText: "OK",
    });
    return;
  }

  currentWorkout.exercises.push(...copiedExercises);

  currentWorkout._completedPopupShown = false;

  setDayEntry(currentDate, currentWorkout);

  save();
  render();
}

function copyExercise(ex) {
  localStorage.removeItem("copiedWorkout");
  localStorage.setItem("copiedExercise", JSON.stringify(ex));

  showToast(`${ex.name} kopeeritud`);
}

function pasteExercise() {
  const copied = localStorage.getItem("copiedExercise");

  if (!copied) {
    showDialogPopup({
      title: "Pole midagi kleepida",
      message: "Kõigepealt kopeeri harjutus.",
      confirmText: "OK",
    });

    return;
  }

  const exercise = structuredClone(JSON.parse(copied));

  exercise.open = true;
  exercise.userToggled = false;

  if (exercise.sets) {
    exercise.sets.forEach((set) => {
      set.done = null;
      set.actualReps = null;
      set.actualTime = null;
    });
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

  dayEntry.exercises.push(exercise);

  dayEntry._completedPopupShown = false;

  setDayEntry(currentDate, dayEntry);

  save();
  render();
  showToast(`${exercise.name} kleebitud`);
}

let toastTimer;

function showToast(message) {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

function pasteClipboard() {
  if (localStorage.getItem("copiedExercise")) {
    pasteExercise();
    return;
  }

  if (localStorage.getItem("copiedWorkout")) {
    pasteWorkout();
    return;
  }

  showDialogPopup({
    title: "Pole midagi kleepida",
    message: "Kõigepealt kopeeri harjutus või treening.",
    confirmText: "OK",
  });
}
