function showMealPopup(message) {
  const popup = document.createElement("div");

  popup.className = "meal-popup";
  popup.textContent = message;

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 2500);
}

function showConfirmPopup(message, onConfirm) {
  const popup = document.createElement("div");

  popup.className = "confirm-popup";

  popup.innerHTML = `
    <div class="confirm-popup__box">
      <p>${message}</p>

      <div class="confirm-popup__actions">
        <button class="confirm-popup__cancel">Ei, katkesta</button>
        <button class="confirm-popup__confirm">Jah, kanna üle</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  const cancel = popup.querySelector(".confirm-popup__cancel");
  const confirm = popup.querySelector(".confirm-popup__confirm");

  cancel.addEventListener("click", () => {
    popup.remove();
  });

  confirm.addEventListener("click", () => {
    onConfirm();
    popup.remove();
  });
}

function showUndoPopup(text, undoFunction) {
  const popup = document.createElement("div");

  popup.className = "meal-popup undo-popup";
  popup.innerHTML = `
    ${text}
    <button>Taasta</button>
  `;

  popup.querySelector("button").onclick = () => {
    undoFunction();
    popup.remove();
  };

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 5000);
}
