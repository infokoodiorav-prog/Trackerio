const list = document.getElementById("list");
let completionPopup = null;
let dialogPopup = null;

function hideCompletionPopup() {
  if (completionPopup) {
    completionPopup.classList.add("hidden");
  }
}

function hideDialogPopup() {
  if (dialogPopup) {
    dialogPopup.classList.add("hidden");
  }
}

function showDialogPopup({
  title,
  message,
  confirmText = "OK",
  cancelText = null,
  inputPlaceholder = "",
  onConfirm,
  onCancel,
}) {
  if (!dialogPopup) {
    dialogPopup = document.createElement("div");
    dialogPopup.className = "completion-popup hidden";
    document.body.appendChild(dialogPopup);

    dialogPopup.addEventListener("click", (event) => {
      if (event.target === dialogPopup) {
        hideDialogPopup();
      }
    });
  }

  dialogPopup.innerHTML = `
    <div class="completion-popup__content">
      <h3>${title}</h3>
      <p>${message}</p>
      ${inputPlaceholder ? `<input class="completion-popup__input" placeholder="${inputPlaceholder}" />` : ""}
      <div class="completion-popup__actions">
        <button id="confirmDialogBtn">${confirmText}</button>
        ${cancelText ? `<button id="cancelDialogBtn">${cancelText}</button>` : ""}
      </div>
    </div>
  `;

  dialogPopup.classList.remove("hidden");

  dialogPopup.querySelector("#confirmDialogBtn").onclick = () => {
    const inputEl = dialogPopup.querySelector(".completion-popup__input");
    const value = inputEl ? inputEl.value.trim() : null;
    onConfirm?.(value);
    hideDialogPopup();
  };

  const cancelBtn = dialogPopup.querySelector("#cancelDialogBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      hideDialogPopup();
      onCancel?.();
    };
  }
}

function showCompletionPopup() {
  if (!completionPopup) {
    completionPopup = document.createElement("div");
    completionPopup.className = "completion-popup hidden";
    completionPopup.innerHTML = `
      <div class="completion-popup__content">
        <h3>Treening on lõpetatud 🎉</h3>
        <p>Kas soovid selle treeningu järgmisesse nädalasse kaasa võtta?</p>
        <div class="completion-popup__actions">
          <button id="carryNextWeekBtn">Jah</button>
          <button id="closePopupBtn">Ei</button>
        </div>
      </div>
    `;

    document.body.appendChild(completionPopup);

    completionPopup.querySelector("#carryNextWeekBtn").onclick = () => {
      carryWorkoutForward();
      hideCompletionPopup();
    };

    completionPopup.querySelector("#closePopupBtn").onclick =
      hideCompletionPopup;

    completionPopup.addEventListener("click", (event) => {
      if (event.target === completionPopup) {
        hideCompletionPopup();
      }
    });
  }

  completionPopup.classList.remove("hidden");
}

function checkWorkoutCompletion() {
  const dayEntry = getDayEntry(currentDate);
  const dayExercises = dayEntry.exercises.filter(Boolean);

  if (!dayExercises.length) return;

  const allCompleted = dayExercises.every(
    (ex) => ex?.sets && ex.sets.every((set) => set.done !== null),
  );

  if (allCompleted) {
    if (!dayEntry._completedPopupShown) {
      dayEntry._completedPopupShown = true;
      setDayEntry(currentDate, dayEntry);
      save();
      showCompletionPopup();
    }
  } else {
    dayEntry._completedPopupShown = false;
    setDayEntry(currentDate, dayEntry);
    save();
  }
}

function carryWorkoutForward() {
  const nextDate = new Date(currentDate);
  nextDate.setDate(nextDate.getDate() + 7);
  const nextKey = formatLocalDate(nextDate);

  const dayEntry = getDayEntry(currentDate);
  const copiedWorkout = JSON.parse(
    JSON.stringify(dayEntry.exercises.filter(Boolean)),
  );

  if (copiedWorkout.length > 30) {
    showDialogPopup({
      title: "Liiga palju harjutusi",
      message: "Treeningus saab olla kuni 30 harjutust.",
      confirmText: "OK",
    });
    return;
  }

  copiedWorkout.forEach((ex) => {
    ex.open = true;
    ex.userToggled = false;

    ex.sets.forEach((set) => {
      set.done = null;
      set.actualReps = null;
    });
  });

  setDayEntry(nextKey, {
    workoutName: dayEntry.workoutName || "",
    exercises: copiedWorkout,
    _completedPopupShown: false,
  });

  dayEntry._completedPopupShown = false;
  setDayEntry(currentDate, dayEntry);
  save();
  render();

  showDialogPopup({
    title: "Valmis! 🎉",
    message: "Treening kopeeriti edukalt järgmisesse nädalasse ✅",
    confirmText: "OK",
  });
}

const timerIntervals = new Map();

function render() {
  list.innerHTML = "";

  const dayEntry = getDayEntry(currentDate);
  const dayData = dayEntry.exercises.filter(Boolean);

  if (dayData.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";

    emptyState.innerHTML = `
      <i data-lucide="dumbbell"></i>
      <h2>Täna pole veel ühtegi harjutust</h2>
      <p>Vajuta "Lisa uus harjutus", et alustada.</p>
    `;

    list.appendChild(emptyState);

    lucide.createIcons();

    return;
  }

  if (dayEntry.workoutName) {
    const workoutTitle = document.createElement("div");
    workoutTitle.className = "workout-title";
    workoutTitle.textContent = dayEntry.workoutName;
    list.appendChild(workoutTitle);
  }

  const exercisesList = document.createElement("div");
  exercisesList.id = "exerciseList";

  list.appendChild(exercisesList);

  dayData.forEach((ex, exIndex) => {
    if (!ex?.sets) return;

    const completed = isExerciseCompleted(ex);

    if (typeof ex.open !== "boolean") {
      ex.open = true;
    }

    if (completed && !ex.userToggled) {
      ex.open = false;
    }

    const card = document.createElement("div");
    card.className = "card";

    let pressTimer;

    card.addEventListener("touchstart", (event) => {
      pressTimer = setTimeout(() => {
        copyExercise(ex);
      }, 700);
    });

    card.addEventListener("touchend", () => {
      clearTimeout(pressTimer);
    });

    card.addEventListener("touchmove", () => {
      clearTimeout(pressTimer);
    });

    card.addEventListener("touchcancel", () => {
      clearTimeout(pressTimer);
    });

    const header = document.createElement("div");
    header.className = "card-header";

    const left = document.createElement("div");
    left.className = "card-left";

    const dragHandle = document.createElement("span");
    dragHandle.innerHTML = "☷";
    dragHandle.className = "drag-handle";

    const setsContainer = document.createElement("div");
    setsContainer.className = "sets";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = ex.open ? "▼" : "▶";
    toggleBtn.className = "toggleBtn";
    toggleBtn.onclick = () => {
      ex.open = !ex.open;
      ex.userToggled = true;
      save();
      render();
    };

    const info = document.createElement("div");
    info.className = "exercise-info";

    const title = document.createElement("h3");
    title.textContent = ex.name || "Unnamed";
    const repRangeText = document.createElement("div");
    repRangeText.className = "rep-range";

    if (ex.repRange && ex.type !== "time") {
      repRangeText.textContent = `Korduste vahemik: ${ex.repRange.min} - ${ex.repRange.max}`;
    }

    info.appendChild(title);
    info.appendChild(repRangeText);
    title.style.cursor = "pointer";
    title.title = "Klõpsa nime muutmiseks";
    title.onclick = () => {
      showDialogPopup({
        title: "Muuda harjutuse nime",
        message: "Sisesta uus harjutuse nimi.",
        confirmText: "Salvesta",
        cancelText: "Tühista",
        inputPlaceholder: ex.name || "Unnamed",
        onConfirm: (value) => {
          const nextName = value?.trim();
          if (!nextName) return;

          ex.name = nextName;
          save();
          render();
        },
      });
    };
    card.classList.toggle("completed", isExerciseCompleted(ex));

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
    deleteBtn.className = "deleteBtn";

    const restBtn = document.createElement("button");
    restBtn.innerHTML = '<i data-lucide="timer"></i>';
    restBtn.className = "restBtn";

    // Vasak pool
    left.appendChild(dragHandle);
    left.appendChild(toggleBtn);
    left.appendChild(info);

    // Header
    header.appendChild(left);
    header.appendChild(deleteBtn);

    restBtn.onclick = () => {
      showRestTimePopup(ex);
    };

    deleteBtn.onclick = () => {
      const dayEntry = getDayEntry(currentDate);

      const deletedExercise = dayEntry.exercises[exIndex];
      dayEntry.exercises.splice(exIndex, 1);

      if (dayEntry.exercises.length === 0 && !dayEntry.workoutName) {
        delete workouts[currentDate];
      } else {
        setDayEntry(currentDate, dayEntry);
      }

      save();
      render();

      showUndoPopup("Harjutus kustutatud", () => {
        const restoreEntry = getDayEntry(currentDate);

        restoreEntry.exercises.splice(exIndex, 0, deletedExercise);

        setDayEntry(currentDate, restoreEntry);

        save();
        render();
      });
    };

    const setsDiv = document.createElement("div");
    setsDiv.className = "sets-panel";
    setsDiv.classList.toggle("hidden", !ex.open);
    setsDiv.style.display = ex.open ? "block" : "none";

    ex.sets.forEach((set) => {
      const row = document.createElement("div");
      row.className = "set-row";

      const values = document.createElement("div");
      values.className = "set-values";

      values.addEventListener("touchstart", (event) => {
        event.stopPropagation();
      });

      const repsText = document.createElement("span");
      repsText.className = "set-text";

      const weightText = document.createElement("span");
      weightText.className = "set-text set-text--secondary";

      const separator = document.createElement("span");
      separator.className = "set-separator";
      separator.textContent = "×";

      const doubleTapDelay = 280;

      function bindDoubleTap(element, type, currentValue, onSave) {
        let lastTapTime = 0;

        element.addEventListener("touchend", (event) => {
          const now = Date.now();
          const isDoubleTap = now - lastTapTime < doubleTapDelay;

          if (isDoubleTap) {
            event.preventDefault();
            event.stopPropagation();

            if (type === "time") {
              showEditTimePopup(set);
              lastTapTime = now;
              return;
            }

            showDialogPopup({
              title:
                type === "reps"
                  ? "Muuda seeriat"
                  : type === "time"
                    ? "Muuda aega"
                    : "Muuda raskust",
              message:
                type === "reps"
                  ? "Sisesta uus korduste arv."
                  : type === "time"
                    ? "Sisesta uus aeg (nt 2:30)."
                    : "Sisesta uus kaal kilogrammides.",
              confirmText: "Salvesta",
              cancelText: "Tühista",
              inputPlaceholder: String(currentValue),
              onConfirm: (value) => {
                if (type === "time") {
                  if (!value.includes(":")) {
                    return;
                  }

                  onSave(value);
                } else {
                  const numericValue = Number(value);

                  if (!Number.isFinite(numericValue) || numericValue <= 0) {
                    return;
                  }

                  onSave(numericValue);
                }

                save();
                render();
              },
            });
          }

          lastTapTime = now;
        });
      }

      function bindDeleteTap(element) {
        let lastTapTime = 0;

        element.addEventListener("touchend", (event) => {
          const now = Date.now();
          const isDoubleTap = now - lastTapTime < doubleTapDelay;

          if (isDoubleTap) {
            event.preventDefault();
            event.stopPropagation();
            showDeleteUI(set, ex, row);
          }

          lastTapTime = now;
        });
      }

      const isTime = set.circuit === true || String(set.weight).includes(":");
      function updateUI() {
        const isTime = set.circuit === true || String(set.weight).includes(":");

        if (isTime) {
          repsText.textContent = "";
          separator.textContent = "";

          if (set.circuit) {
            let phaseText;

            if (set.phase === "work") {
              phaseText = set.circuitExercises?.[set.currentExercise] || "Töö";
            } else if (set.phase === "rest") {
              const nextIndex = set.currentExercise + 1;

              const nextExercise =
                set.circuitExercises?.[nextIndex] || "Järgmine harjutus";

              phaseText = `Puhkus → ${nextExercise}`;
            } else if (set.phase === "roundRest") {
              const nextRound = set.currentRound + 1;

              const nextExercise = set.circuitExercises?.[0] || "Järgmine ring";

              phaseText = `Ringi puhkus → Ring ${nextRound}: ${nextExercise}`;
            }

            if (set.circuit) {
              repsText.textContent = `🔄 ${set.currentRound}/${set.rounds}`;
            }

            let targetTime;

            if (set.phase === "work") {
              targetTime = set.roundTime;
            } else if (set.phase === "rest") {
              targetTime = set.restTime;
            } else if (set.phase === "roundRest") {
              targetTime = set.roundRestTime;
            }

            weightText.textContent = `⏱️ ${set.actualTime || "0:00"} / ${targetTime} ${phaseText}`;
          } else {
            weightText.textContent = set.actualTime
              ? `⏱️ ${set.actualTime} / ${set.weight}`
              : `⏱️ ${set.weight}`;
          }
        } else {
          repsText.textContent = `${set.actualReps ?? set.plannedReps}`;
          separator.textContent = "×";

          if (set.bodyweight) {
            weightText.textContent = "Keharaskus";
          } else {
            weightText.textContent = `${set.weight}kg`;
          }
        }

        const repsDone = set.actualReps ?? set.plannedReps;
        const reachedGoal = repsDone >= set.plannedReps;

        repsText.classList.toggle("done", set.done === true);
        repsText.classList.toggle("undone", set.done === false);
        weightText.classList.toggle("done", set.done === true);
        weightText.classList.toggle("undone", set.done === false);
      }

      const playBtn = document.createElement("button");
      playBtn.innerHTML = '<i data-lucide="play"></i>';
      playBtn.className = "playBtn";

      const stopBtn = document.createElement("button");
      stopBtn.innerHTML = '<i data-lucide="square"></i>';
      stopBtn.className = "stopBtn";

      const resetBtn = document.createElement("button");
      resetBtn.innerHTML = '<i data-lucide="rotate-ccw"></i>';
      resetBtn.className = "resetBtn";

      playBtn.onclick = () => {
        prepareTimerAlert();
        startTimer(set);
      };

      resetBtn.onclick = () => {
        resetTimer(set);
      };

      stopBtn.onclick = () => {
        stopTimer(set);

        if (!set.actualTime) {
          set.actualTime = "0:00";
        }

        if (set.circuit) {
          // katkestatud ringtreening
          set.done = false;
        } else {
          // tavaline timer
          if (timeToSeconds(set.actualTime) < timeToSeconds(set.weight)) {
            set.done = false;
          }
        }

        save();
        render();
        checkWorkoutCompletion();
      };

      function resetTimer(set) {
        stopTimer(set);

        set.actualTime = "0:00";
        set.done = null;

        if (set.circuit) {
          set.currentRound = 1;
          set.phase = "work";
        }

        save();
        render();
      }

      function timeToSeconds(time) {
        const [min, sec] = time.split(":").map(Number);
        return min * 60 + sec;
      }

      function startTimer(set) {
        if (timerIntervals.has(set)) return;

        if (set.circuit) {
          set.currentRound = set.currentRound || 1;
          set.phase = set.phase || "work";
          set.actualTime = set.actualTime || "0:00";
        }

        const interval = setInterval(() => {
          if (!set.actualTime) {
            set.actualTime = "0:00";
          }

          let [min, sec] = set.actualTime.split(":").map(Number);

          sec++;

          if (sec >= 60) {
            min++;
            sec = 0;
          }

          set.actualTime = `${min}:${String(sec).padStart(2, "0")}`;

          // 🔥 RINGTREENING
          if (set.circuit) {
            if (set.phase === "work") {
              if (
                timeToSeconds(set.actualTime) >= timeToSeconds(set.roundTime)
              ) {
                if (set.currentExercise < set.circuitExercises.length - 1) {
                  playTimerAlert("rest");
                  set.phase = "rest";
                  set.actualTime = "0:00";
                } else {
                  if (set.currentRound >= set.rounds) {
                    playTimerAlert("complete");
                    stopTimer(set);

                    set.actualTime = set.roundTime;
                    set.done = true;
                    checkWorkoutCompletion();
                  } else {
                    playTimerAlert("round");
                    set.actualTime = "0:00";
                    set.phase = "roundRest";
                  }
                }
              }
            } else if (set.phase === "rest") {
              if (
                timeToSeconds(set.actualTime) >= timeToSeconds(set.restTime)
              ) {
                playTimerAlert("work");
                set.actualTime = "0:00";

                if (set.currentExercise < set.circuitExercises.length - 1) {
                  set.currentExercise++;
                }

                set.phase = "work";
              }
            } else if (set.phase === "roundRest") {
              if (
                timeToSeconds(set.actualTime) >=
                timeToSeconds(set.roundRestTime)
              ) {
                set.actualTime = "0:00";

                playTimerAlert("work");
                set.currentRound++;

                set.currentExercise = 0;
                set.phase = "work";
              }
            }
          }

          // 🔥 TAVALINE TIMER
          else {
            if (timeToSeconds(set.actualTime) >= timeToSeconds(set.weight)) {
              stopTimer(set);

              set.actualTime = set.weight;
              set.done = true;
              playTimerAlert("complete");
              startRestTimer(set.restTime || 0);
              checkWorkoutCompletion();
            }
          }

          save();
          updateUI();
        }, 1000);

        timerIntervals.set(set, interval);
      }

      function stopTimer(set) {
        const interval = timerIntervals.get(set);

        if (interval) {
          clearInterval(interval);
          timerIntervals.delete(set);
        }
      }

      const doneBtn = document.createElement("button");
      doneBtn.innerHTML = '<i data-lucide="check"></i>';
      doneBtn.className = "doneBtn";

      const undoneBtn = document.createElement("button");
      undoneBtn.innerHTML = '<i data-lucide="x"></i>';
      undoneBtn.className = "undoneBtn";

      doneBtn.onclick = () => {
        set.done = true;
        set.actualReps = null;
        save();
        updateUI();

        console.log("Seeria puhkeaeg:", set.restTime);
        startRestTimer(set.restTime || 0);

        doneBtn.classList.add("pulse");
        setTimeout(() => {
          doneBtn.classList.remove("pulse");
          render();
          checkWorkoutCompletion();
        }, 140);
      };

      undoneBtn.onclick = () => {
        if (set.circuit || String(set.weight).includes(":")) {
          set.done = false;

          save();
          updateUI();
          render();
          checkWorkoutCompletion();
          startRestTimer(set.restTime || 0);

          return;
        }

        showDialogPopup({
          title: "Mitu kordust tegelikult tuli?",
          message: "Sisesta tehtud korduste arv.",
          confirmText: "Salvesta",
          cancelText: "Tühista",
          inputPlaceholder: "nt. 10",

          onConfirm: (value) => {
            if (!value) return;

            set.actualReps = Number(value);
            set.done = set.actualReps >= set.plannedReps;

            save();
            updateUI();
            render();
            checkWorkoutCompletion();
            startRestTimer(set.restTime);
          },
        });
      };

      function showEditTimePopup(set) {
        showDialogPopup({
          title: "Muuda aega",
          message: "",

          confirmText: "Salvesta",
          cancelText: "Tühista",

          onConfirm: () => {
            const min = document.getElementById("resultMinutes").value || 0;
            const sec = document.getElementById("resultSeconds").value || 0;

            set.weight = `${min}:${String(sec).padStart(2, "0")}`;

            save();
            render();
          },
        });

        const content = dialogPopup.querySelector(".completion-popup__content");

        content.querySelector("p").insertAdjacentHTML(
          "afterend",
          `
    <div class="time-row">
      <input id="resultMinutes" type="number" placeholder="Min">
      <span>:</span>
      <input id="resultSeconds" type="number" placeholder="Sek">
    </div>
  `,
        );
      }

      bindDoubleTap(repsText, "reps", set.plannedReps, (value) => {
        set.plannedReps = value;
      });

      if (set.circuit) {
        bindDoubleTap(weightText, "time");
      } else if (String(set.weight).includes(":")) {
        bindDoubleTap(weightText, "time");
      } else if (!set.bodyweight) {
        bindDoubleTap(weightText, "weight", set.weight, (value) => {
          set.weight = value;
        });
      }

      bindDeleteTap(values);

      values.appendChild(repsText);
      values.appendChild(separator);
      values.appendChild(weightText);
      updateUI();
      row.appendChild(values);

      if (!isTime) {
        row.appendChild(doneBtn);
        row.appendChild(undoneBtn);
      }
      setsDiv.appendChild(row);
      if (isTime) {
        const timerButtons = document.createElement("div");
        timerButtons.className = "timerButtons";

        timerButtons.appendChild(playBtn);
        timerButtons.appendChild(stopBtn);
        timerButtons.appendChild(resetBtn);

        row.appendChild(timerButtons);
      }
    });

    const addSetBtn = document.createElement("button");
    addSetBtn.className = "addSetBtn";
    addSetBtn.textContent = "+ Lisa seeria";

    addSetBtn.onclick = () => {
      if (ex.sets.length >= 8) {
        showToast("Ühel harjutusel saab olla kuni 8 seeriat.");
        return;
      }

      const lastSet = ex.sets[ex.sets.length - 1];

      if (lastSet?.circuit) {
        ex.sets.push({
          plannedReps: null,
          actualReps: null,
          restTime: 0,

          circuit: true,

          circuitExercises: [...lastSet.circuitExercises],

          roundTime: lastSet.roundTime,
          restTime: lastSet.restTime,
          roundRestTime: lastSet.roundRestTime,

          rounds: lastSet.rounds,

          currentRound: 1,
          currentExercise: 0,

          phase: "work",
          actualTime: "0:00",

          done: null,
        });
      } else {
        ex.sets.push({
          plannedReps: lastSet?.plannedReps || 10,
          actualReps: null,

          weight: lastSet?.weight || 0,
          bodyweight: lastSet?.bodyweight || false,

          restTime: lastSet?.restTime || 0,
          actualTime: null,

          circuit: false,
          done: null,
        });
      }

      save();
      render();
    };

    const setActions = document.createElement("div");
    setActions.className = "set-actions-row";

    setActions.appendChild(addSetBtn);
    setActions.appendChild(restBtn);

    setsDiv.appendChild(setActions);
    card.appendChild(header);
    card.appendChild(setsDiv);
    exercisesList.appendChild(card);
  });

  lucide.createIcons();
  initSortable();
}
let sortableInstance = null;

function initSortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
  }

  sortableInstance = new Sortable(document.getElementById("exerciseList"), {
    handle: ".drag-handle",
    animation: 150,

    onEnd(evt) {
      const dayEntry = getDayEntry(currentDate);

      const moved = dayEntry.exercises.splice(evt.oldIndex, 1)[0];

      dayEntry.exercises.splice(evt.newIndex, 0, moved);

      setDayEntry(currentDate, dayEntry);
      save();
      render();
    },
  });
}

function showDeleteUI(set, ex, row) {
  row.classList.add("danger");

  const actions = document.createElement("div");
  actions.className = "set-actions";

  const del = document.createElement("button");
  del.classList.add("deleteSetBtn");
  del.innerHTML = '<i data-lucide="trash-2"></i>';

  const cancel = document.createElement("button");
  cancel.classList.add("cancelDeleteBtn");
  cancel.innerHTML = '<i data-lucide="undo-2"></i>';

  const index = ex.sets.indexOf(set);

  del.onclick = () => {
    ex.sets.splice(index, 1);

    save();
    render();

    showUndoPopup("Seeria kustutatud", () => {
      ex.sets.splice(index, 0, set);

      save();
      render();
    });
  };

  cancel.onclick = () => {
    row.classList.remove("danger");
    actions.remove();
  };

  actions.appendChild(del);
  actions.appendChild(cancel);
  row.appendChild(actions);
  lucide.createIcons();
}
