let audioCtx = null;
let timerAlertElement = null;
let timerAlertTimer = null;

const timerAlertPatterns = {
  rest: {
    tones: [
      [494, 0, 0.12],
      [392, 0.18, 0.16],
    ],
    vibration: [80, 70, 120],
    title: "PUHKUS",
    message: "Tee lühike paus.",
  },
  work: {
    tones: [
      [523, 0, 0.1],
      [659, 0.14, 0.12],
      [784, 0.29, 0.18],
    ],
    vibration: [70, 55, 70, 55, 120],
    title: "ALUSTA!",
    message: "Jätka järgmise harjutusega.",
  },
  round: {
    tones: [
      [440, 0, 0.1],
      [440, 0.15, 0.1],
      [587, 0.3, 0.2],
    ],
    vibration: [90, 70, 90, 70, 150],
    title: "RINGI PUHKUS",
    message: "Valmista end järgmiseks ringiks.",
  },
  complete: {
    tones: [
      [523, 0, 0.12],
      [659, 0.16, 0.12],
      [784, 0.32, 0.42],
    ],
    vibration: [100, 80, 100, 80, 220],
    title: "AEG TÄIS!",
    message: "Seeria on lõpetatud.",
  },
};

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    audioCtx = new AudioContext();
  }

  return audioCtx;
}

// Käivitatakse nupu "Play" vajutamisel, et heli töötaks ka mobiilibrauseris.
function prepareTimerAlert() {
  const context = getAudioContext();

  if (context?.state === "suspended") {
    context.resume().catch(() => {});
  }
}

function showTimerAlert(type) {
  const pattern = timerAlertPatterns[type] || timerAlertPatterns.complete;

  if (!timerAlertElement) {
    timerAlertElement = document.createElement("div");
    timerAlertElement.className = "timer-alert";
    timerAlertElement.setAttribute("role", "alert");
    timerAlertElement.setAttribute("aria-live", "assertive");
    document.body.appendChild(timerAlertElement);
  }

  timerAlertElement.innerHTML = `
    <strong>${pattern.title}</strong>
    <span>${pattern.message}</span>
  `;

  timerAlertElement.classList.add("timer-alert--visible");

  clearTimeout(timerAlertTimer);

  timerAlertTimer = setTimeout(() => {
    timerAlertElement.classList.remove("timer-alert--visible");
  }, 3200);
}

function playTimerAlert(type = "complete") {
  const pattern = timerAlertPatterns[type] || timerAlertPatterns.complete;
  const context = getAudioContext();

  showTimerAlert(type);

  if (navigator.vibrate) {
    navigator.vibrate(pattern.vibration);
  }

  if (!context) return;

  const scheduleAlert = () => {
    const startTime = context.currentTime + 0.04;

    pattern.tones.forEach(([frequency, offset, duration], index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const toneStart = startTime + offset;
      const toneEnd = toneStart + duration;

      oscillator.type =
        index === pattern.tones.length - 1 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, toneStart);

      gain.gain.setValueAtTime(0.0001, toneStart);
      gain.gain.exponentialRampToValueAtTime(0.24, toneStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(toneStart);
      oscillator.stop(toneEnd + 0.03);
    });
  };

  if (context.state === "suspended") {
    context
      .resume()
      .then(scheduleAlert)
      .catch(() => {});
  } else {
    scheduleAlert();
  }
}

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
