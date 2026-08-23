let restTimerInterval = null;
let restTimerRemaining = 0;

const restTimer = document.getElementById("restTimer");
const restTimerValue = document.getElementById("restTimerValue");

function startRestTimer(seconds) {
  console.log("Rest timer käivitus:", seconds);

  if (typeof seconds === "string" && seconds.includes(":")) {
    const [minutes, remainingSeconds] = seconds.split(":").map(Number);
    seconds = minutes * 60 + remainingSeconds;
  } else {
    seconds = Number(seconds) || 0;
  }

  if (seconds <= 0) return;

  clearInterval(restTimerInterval);

  restTimerRemaining = seconds;

  restTimer.classList.remove("hidden");

  updateRestTimer();

  restTimerInterval = setInterval(() => {
    restTimerRemaining--;

    updateRestTimer();

    if (restTimerRemaining <= 0) {
      clearInterval(restTimerInterval);
      restTimerInterval = null;

      restTimer.classList.add("hidden");
    }
  }, 1000);
}

function updateRestTimer() {
  const minutes = Math.floor(restTimerRemaining / 60);
  const seconds = restTimerRemaining % 60;

  restTimerValue.textContent =
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`;
}

function showRestTimePopup(ex) {
  const currentRestTime = ex.sets[0]?.restTime || 0;

  const minutes = Math.floor(currentRestTime / 60);
  const seconds = currentRestTime % 60;

  showDialogPopup({
    title: "Puhkeaeg",
    message: "Määra puhkeaeg seeriate vahel.",
    confirmText: "Salvesta",
    cancelText: "Tühista",

    onConfirm: () => {
      const min =
        Number(document.getElementById("restMinutesInput").value) || 0;

      const sec =
        Number(document.getElementById("restSecondsInput").value) || 0;

      const restTime = min * 60 + sec;

      ex.sets.forEach((set) => {
        set.restTime = restTime;
      });

      save();
      render();
    },
  });

  const content = dialogPopup.querySelector(".completion-popup__content");

  content.querySelector("p").insertAdjacentHTML(
    "afterend",
    `
    <div class="time-row">
      <input
        id="restMinutesInput"
        type="number"
        min="0"
        placeholder="${minutes}"
      >

      <span>:</span>

      <input
        id="restSecondsInput"
        type="number"
        min="0"
        max="59"
        placeholder="${String(seconds).padStart(2, "0")}"
      >
    </div>
  `,
  );

  const minuteInput = document.getElementById("restMinutesInput");
  const secondInput = document.getElementById("restSecondsInput");

  [minuteInput, secondInput].forEach((input) => {
    input.addEventListener("focus", () => {
      requestAnimationFrame(() => {
        input.select();
      });
    });
  });
}
