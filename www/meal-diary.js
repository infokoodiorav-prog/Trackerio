const mealTypes = ["breakfast", "lunch", "snack", "dinner"];
const storageKey = "meal-diary-data";
const dateInput = document.getElementById("diaryDate");
const weekdayLabel = document.getElementById("weekdayLabel");
const closeAddMealButton = document.getElementById("closeAddMeal");
const addMealCard = document.getElementById("addMealCard");
const addMealForm = document.getElementById("addMealForm");
const mealTypeSelect = document.getElementById("mealTypeSelect");
const addMealBackdrop = document.getElementById("addMealBackdrop");

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

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultMealShape() {
  return {
    breakfast: [],
    lunch: [],
    snack: [],
    dinner: [],
  };
}

function getCurrentDate() {
  return dateInput?.value || formatLocalDate(new Date());
}

function ensureTodayDate() {
  if (!dateInput) return;
  dateInput.value = formatLocalDate(new Date());
}

function loadEntries() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey)) || {};

    if (
      data &&
      Array.isArray(data.breakfast) &&
      Array.isArray(data.lunch) &&
      Array.isArray(data.snack) &&
      Array.isArray(data.dinner)
    ) {
      return {
        [formatLocalDate(new Date())]: {
          breakfast: data.breakfast,
          lunch: data.lunch,
          snack: data.snack,
          dinner: data.dinner,
        },
      };
    }

    if (data && typeof data === "object") {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          {
            breakfast: value?.breakfast || [],
            lunch: value?.lunch || [],
            snack: value?.snack || [],
            dinner: value?.dinner || [],
          },
        ]),
      );
    }
  } catch {
    return {};
  }

  return {};
}

function saveEntries(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function getWeekdayLabel(dateString) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("et-EE", {
    weekday: "long",
  }).format(new Date(`${dateString}T00:00:00`));
}

function updateDateDisplay() {
  const date = new Date(`${getCurrentDate()}T00:00:00`);

  const dateButton = document.getElementById("dateButton");

  if (dateButton) {
    dateButton.textContent = date.toLocaleDateString("en-GB");
  }

  if (weekdayLabel) {
    const weekday = getWeekdayLabel(getCurrentDate());

    weekdayLabel.textContent =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }
}

function changeDate(offset) {
  if (!dateInput) return;
  const currentDate = new Date(`${getCurrentDate()}T00:00:00`);
  currentDate.setDate(currentDate.getDate() + offset);
  dateInput.value = formatLocalDate(currentDate);
  updateDateDisplay();
  render();
}

function render() {
  const selectedDate = getCurrentDate();
  const data = loadEntries();
  const dateEntries = data[selectedDate] || getDefaultMealShape();

  let dailyTotal = 0;
  let dailyProtein = 0;
  let dailyFat = 0;
  let dailyCarbs = 0;

  mealTypes.forEach((meal) => {
    const list = document.getElementById(`${meal}List`);
    const totalEl = document.getElementById(`${meal}Total`);
    const items = Array.isArray(dateEntries[meal]) ? dateEntries[meal] : [];

    const actions = document.getElementById(`${meal}Actions`);

    if (actions) {
      actions.style.display = "flex";
    }

    let mealTotal = 0;

    if (list) {
      list.innerHTML = "";

      if (items.length === 0) {
        list.innerHTML = `
  <li class="empty-meal">
    <i data-lucide="plus-circle"></i>
    <span>Pole veel toite lisatud</span>
  </li>
`;
      } else
        items.forEach((item, index) => {
          if (typeof item.done === "undefined") {
            item.done = false;
          }
          mealTotal += Number(item.calories) || 0;
          dailyTotal += Number(item.calories) || 0;
          dailyProtein += Number(item.protein) || 0;
          dailyFat += Number(item.fat) || 0;
          dailyCarbs += Number(item.carbs) || 0;

          const li = document.createElement("li");
          li.className = item.done ? "meal-item meal-item--done" : "meal-item";
          li.innerHTML = `
          <div class="meal-item__main">
            <span class="meal-item__name">${item.name}</span>
            <span class="meal-item__meta">
              ${item.calories} Kcal · P ${item.protein || 0}g · R ${item.fat || 0}g · S ${item.carbs || 0}g
            </span>
          </div>
          <div class="meal-item__actions">
  <button 
    type="button" 
    class="meal-item__action meal-item__action--done ${item.done ? "undo-btn" : "done-btn"}" 
    data-action="toggleDone" 
    data-meal="${meal}" 
    data-index="${index}">
    ${item.done ? '<i data-lucide="undo-2" ></i>' : '<i data-lucide="check" ></i>'}
  </button>

  <button 
    type="button" 
    class="meal-item__action meal-item__action--edit" 
    data-action="edit" 
    data-meal="${meal}" 
    data-index="${index}">
     <i data-lucide="pencil"></i>
  </button>

  <button 
    type="button" 
    class="meal-item__action meal-item__action--delete" 
    data-action="delete" 
    data-meal="${meal}" 
    data-index="${index}">
    <i data-lucide="trash-2"></i>
  </button>
</div>
        `;
          list.appendChild(li);
        });
    }

    if (totalEl) {
      totalEl.textContent = `${mealTotal} kcal`;
    }
  });

  const summary = document.getElementById("dailyTotal");
  if (summary) {
    summary.textContent = `Kokku: ${dailyTotal} kcal`;
  }

  updateDateDisplay();
  lucide.createIcons();

  const proteinEl = document.getElementById("dailyProtein");
  const fatEl = document.getElementById("dailyFat");
  const carbsEl = document.getElementById("dailyCarbs");

  if (proteinEl) proteinEl.textContent = `Proteiin: ${dailyProtein} g`;
  if (fatEl) fatEl.textContent = `Rasv: ${dailyFat} g`;
  if (carbsEl) carbsEl.textContent = `Süsivesikud: ${dailyCarbs} g`;
}

function resetFormState(form) {
  if (!form) return;
  form.dataset.editingIndex = "";
  form.dataset.editingMeal = "";
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.textContent = "Lisa";
  }
  if (mealTypeSelect) {
    mealTypeSelect.value = "breakfast";
  }
  form.reset();
}

function toggleAddMealCard(show) {
  if (addMealCard) {
    addMealCard.hidden = !show;
  }
  if (addMealBackdrop) {
    addMealBackdrop.hidden = !show;
  }
}

function openAddMealCard(meal = "breakfast") {
  toggleAddMealCard(true);
  if (mealTypeSelect) {
    mealTypeSelect.value = meal;
  }
  if (addMealForm) {
    const nameInput = addMealForm.querySelector('input[name="name"]');
    nameInput?.focus();
  }
}

function carryMealForward() {
  const selectedDate = getCurrentDate();
  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 7);

  const nextKey = formatLocalDate(nextDate);

  const currentData = loadEntries();

  const currentDayEntries = currentData[selectedDate] || getDefaultMealShape();

  const nextDayEntries = currentData[nextKey] || getDefaultMealShape();

  mealTypes.forEach((meal) => {
    const availableSpace = 15 - nextDayEntries[meal].length;

    if (availableSpace <= 0) return;

    const itemsToAdd = currentDayEntries[meal]
      .slice(0, availableSpace)
      .map((item) => ({
        ...item,
        done: false,
      }));

    nextDayEntries[meal].push(...itemsToAdd);
  });

  currentData[nextKey] = nextDayEntries;

  saveEntries(currentData);
  render();

  showMealPopup("Selle päeva menüü kanti üle järgmisesse nädalasse.");
}

function bindForms() {
  if (!addMealForm) return;

  addMealForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const meal = mealTypeSelect?.value || "breakfast";
    const nameInput = addMealForm.querySelector('input[name="name"]');
    const caloriesInput = addMealForm.querySelector('input[name="calories"]');
    const proteinInput = addMealForm.querySelector('input[name="protein"]');
    const fatInput = addMealForm.querySelector('input[name="fat"]');
    const carbsInput = addMealForm.querySelector('input[name="carbs"]');

    if (!meal || !nameInput) return;

    const selectedDate = getCurrentDate();
    const data = loadEntries();
    const dayEntries = data[selectedDate] || getDefaultMealShape();
    const mealEntries = Array.isArray(dayEntries[meal]) ? dayEntries[meal] : [];

    const editingIndex = addMealForm.dataset.editingIndex;

    const foodName = nameInput.value.trim();

    if (foodName.length > 60) {
      showMealPopup("Toidu nimi võib olla kuni 60 tähemärki.");
      return;
    }

    const entry = {
      name: foodName,
      calories: Number(caloriesInput.value) || 0,
      protein: Number(proteinInput?.value) || 0,
      fat: Number(fatInput?.value) || 0,
      carbs: Number(carbsInput?.value) || 0,
      done:
        editingIndex !== undefined && editingIndex !== ""
          ? mealEntries[Number(editingIndex)]?.done || false
          : false,
    };
    if (!entry.name) return;
    saveFoodToHistory(entry);

    if (editingIndex !== undefined && editingIndex !== "") {
      mealEntries[Number(editingIndex)] = entry;
    } else {
      if (mealEntries.length >= 15) {
        showMealPopup("Ühte toidukorda saab lisada kuni 15 toitu.");
        return;
      }

      mealEntries.push(entry);
    }

    dayEntries[meal] = mealEntries;
    data[selectedDate] = dayEntries;
    saveEntries(data);
    resetFormState(addMealForm);
    toggleAddMealCard(false);
    render();
  });
}
let copiedMeal = null;

function bindItemActions() {
  document.querySelectorAll(".meal-list").forEach((list) => {
    list.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const meal = button.dataset.meal;
      const index = Number(button.dataset.index);
      const selectedDate = getCurrentDate();
      const data = loadEntries();
      const dayEntries = data[selectedDate] || getDefaultMealShape();
      const mealEntries = Array.isArray(dayEntries[meal])
        ? dayEntries[meal]
        : [];

      // DONE / UNDONE
      if (button.dataset.action === "toggleDone") {
        const item = mealEntries[index];

        if (!item) return;

        item.done = !item.done;

        dayEntries[meal] = mealEntries;
        data[selectedDate] = dayEntries;

        saveEntries(data);
        render();

        return;
      }

      // DELETE + UNDO
      if (button.dataset.action === "delete") {
        const deletedItem = mealEntries[index];

        mealEntries.splice(index, 1);

        dayEntries[meal] = mealEntries;
        data[selectedDate] = dayEntries;

        saveEntries(data);
        render();

        showUndoPopup("Toit kustutatud", () => {
          const restoreData = loadEntries();
          const restoreDay = restoreData[selectedDate] || getDefaultMealShape();

          if (!restoreDay[meal]) {
            restoreDay[meal] = [];
          }

          restoreDay[meal].splice(index, 0, deletedItem);

          restoreData[selectedDate] = restoreDay;
          saveEntries(restoreData);

          render();
        });

        return;
      }

      // EDIT
      if (button.dataset.action === "edit") {
        const item = mealEntries[index];

        if (!item) return;

        const nameInput = addMealForm.querySelector('input[name="name"]');
        const caloriesInput = addMealForm.querySelector(
          'input[name="calories"]',
        );
        const proteinInput = addMealForm.querySelector('input[name="protein"]');
        const fatInput = addMealForm.querySelector('input[name="fat"]');
        const carbsInput = addMealForm.querySelector('input[name="carbs"]');

        const buttonEl = addMealForm.querySelector('button[type="submit"]');

        nameInput.value = item.name || "";
        caloriesInput.value = item.calories || 0;
        proteinInput.value = item.protein || 0;
        fatInput.value = item.fat || 0;
        carbsInput.value = item.carbs || 0;

        buttonEl.textContent = "Uuenda";

        mealTypeSelect.value = meal;

        addMealForm.dataset.editingIndex = index;
        addMealForm.dataset.editingMeal = meal;

        openAddMealCard(meal);

        nameInput.focus();

        return;
      }
    });
  });
}

function copyMeal(type) {
  const selectedDate = getCurrentDate();
  const data = loadEntries();
  const currentDay = data[selectedDate] || getDefaultMealShape();

  const meal = currentDay[type];

  if (!meal || meal.length === 0) {
    showMealPopup("Midagi pole kopeerida!");
    return;
  }

  copiedMeal = meal.map((item) => ({
    ...item,
    done: false,
  }));

  showMealPopup("Toit kopeeritud!");
}

function pasteMeal(type) {
  if (!copiedMeal) {
    showMealPopup("Midagi pole kleepida!");
    return;
  }

  const selectedDate = getCurrentDate();
  const data = loadEntries();

  const dayEntries = data[selectedDate] || getDefaultMealShape();

  const availableSpace = 15 - dayEntries[type].length;

  if (availableSpace <= 0) {
    showMealPopup("See toidukord on juba täis.");
    return;
  }

  const mealsToPaste = copiedMeal.slice(0, availableSpace);

  const pastedCount = mealsToPaste.length;
  const originalCount = copiedMeal.length;

  dayEntries[type] = [...dayEntries[type], ...mealsToPaste];

  data[selectedDate] = dayEntries;

  saveEntries(data);
  render();

  copiedMeal = null;

  if (pastedCount < originalCount) {
    showMealPopup(`Lisati ${pastedCount} toitu. Nimekiri sai täis.`);
  } else {
    showMealPopup("Toit kleebitud!");
  }
}

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", () => {
    copyMeal(btn.dataset.copy);
  });
});

document.querySelectorAll("[data-paste]").forEach((btn) => {
  btn.addEventListener("click", () => {
    pasteMeal(btn.dataset.paste);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  if (dateInput) {
    ensureTodayDate();
    dateInput.addEventListener("change", render);
  }

  document.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
      resetFormState(addMealForm);
      openAddMealCard(button.dataset.add);
    });
  });

  if (closeAddMealButton) {
    closeAddMealButton.addEventListener("click", () => {
      resetFormState(addMealForm);
      toggleAddMealCard(false);
    });
  }

  if (addMealBackdrop) {
    addMealBackdrop.addEventListener("click", () => {
      resetFormState(addMealForm);
      toggleAddMealCard(false);
    });
  }

  const carryButton = document.getElementById("carryButton");

  if (carryButton) {
    carryButton.addEventListener("click", () => {
      showConfirmPopup(
        "Kas soovid selle päeva toidud järgmisele nädalale üle kanda?",
        () => {
          carryMealForward();
        },
      );
    });
  }

  const prevDateButton = document.getElementById("prevDate");
  const nextDateButton = document.getElementById("nextDate");

  if (prevDateButton) {
    prevDateButton.addEventListener("click", () => changeDate(-1));
  }

  if (nextDateButton) {
    nextDateButton.addEventListener("click", () => changeDate(1));
  }

  if (dateInput) {
    dateInput.addEventListener("change", render);
  }

  bindForms();
  bindItemActions();

  const mealName = document.getElementById("mealName");
  const foodSuggestions = document.getElementById("foodSuggestions");

  if (mealName && foodSuggestions) {
    mealName.addEventListener("input", () => {
      const value = mealName.value.toLowerCase().trim();

      if (!value) {
        foodSuggestions.innerHTML = "";
        return;
      }

      const foods = JSON.parse(localStorage.getItem("food-database")) || [];

      const matches = foods
        .filter((food) => food.name.toLowerCase().includes(value))
        .slice(0, 5);

      renderSuggestions(matches);
    });
  }

  render();
});

function saveFoodToHistory(food) {
  const foods = JSON.parse(localStorage.getItem("food-database")) || [];

  const exists = foods.some(
    (item) => item.name.toLowerCase() === food.name.toLowerCase(),
  );

  if (!exists) {
    foods.push(food);
    localStorage.setItem("food-database", JSON.stringify(foods));
  }
}

function renderSuggestions(matches) {
  const foodSuggestions = document.getElementById("foodSuggestions");

  if (!foodSuggestions) return;

  foodSuggestions.innerHTML = "";

  matches.forEach((food) => {
    const item = document.createElement("div");

    item.className = "food-suggestion";

    item.textContent = food.name;

    item.addEventListener("click", () => {
      document.getElementById("mealName").value = food.name;
      document.getElementById("mealCalories").value = food.calories || 0;
      document.getElementById("mealProtein").value = food.protein || 0;
      document.getElementById("mealFat").value = food.fat || 0;
      document.getElementById("mealCarbs").value = food.carbs || 0;

      foodSuggestions.innerHTML = "";
    });

    foodSuggestions.appendChild(item);
  });
}
