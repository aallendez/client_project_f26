/* =========================================================
   UMSI Engaged Learning Office | Deliverable #3 JavaScript
   Juan Alonso-Allende (aallende)

   1. Footer year: keeps the copyright year current.
   2. Objective progress tracker (unique addition): turns each
      Focus & Objectives list into a checklist, saves progress in
      localStorage, and shows each stage's progress on the home page.
   3. 404 page: shows the address the visitor tried to reach.

   Citations:
   - Date.prototype.getFullYear(), MDN:
     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getFullYear
   - Window.localStorage, MDN:
     https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
   - aria-live regions, MDN:
     https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live
   - Script drafted with help from Claude (Anthropic, claude.ai),
     reviewed and edited by Juan.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- 1. Footer year ---------- */
  var yearEls = document.querySelectorAll(".current-year");
  var year = String(new Date().getFullYear());
  yearEls.forEach(function (el) {
    el.textContent = year;
  });

  /* ---------- 2. Objective progress tracker ---------- */
  var STORAGE_KEY = "elo-objective-progress";

  // localStorage can throw (private mode, blocked storage), so the
  // tracker still works for the current visit without saving.
  function loadProgress() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  function saveProgress(data) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      /* progress just won't persist */
    }
  }

  var progress = loadProgress();

  function countDone(page) {
    var items = progress[page] || {};
    return Object.keys(items).filter(function (key) {
      return items[key] === true;
    }).length;
  }

  // Subject pages: <ul class="focus-list" data-tracker="page-name" aria-labelledby="heading-id">
  var lists = document.querySelectorAll(".focus-list[data-tracker]");

  lists.forEach(function (list) {
    var page = list.getAttribute("data-tracker");
    var listId = list.getAttribute("aria-labelledby");
    var items = list.querySelectorAll("li");
    var phase = list.closest(".phase");
    var phaseHeading = phase ? phase.querySelector("h2") : null;
    var phaseName = phaseHeading ? phaseHeading.textContent : "this section";

    if (!progress[page]) {
      progress[page] = {};
    }

    // Panel: hint, live status, reset button, visual progress bar
    var panel = document.createElement("div");
    panel.className = "tracker";

    var hint = document.createElement("p");
    hint.className = "tracker-hint";
    hint.textContent = "Check off each objective as you work on it. Your progress is saved in this browser only.";

    var status = document.createElement("p");
    status.className = "tracker-status";
    status.setAttribute("aria-live", "polite");

    var reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Clear checks";
    reset.setAttribute("aria-label", "Clear checks for " + phaseName);

    // The status text already says "x of y", so the bar is visual only
    var bar = document.createElement("progress");
    bar.max = items.length;
    bar.setAttribute("aria-hidden", "true");

    panel.appendChild(hint);
    panel.appendChild(status);
    panel.appendChild(reset);
    panel.appendChild(bar);
    list.parentNode.insertBefore(panel, list);

    var checkboxes = [];

    function updateStatus() {
      var done = checkboxes.filter(function (box) {
        return box.checked;
      }).length;
      bar.value = done;
      status.textContent = done + " of " + items.length + " objectives checked off";
    }

    items.forEach(function (li, index) {
      var itemId = listId + "-" + index;

      // Wrap the existing text in a label so the whole card is clickable
      var label = document.createElement("label");
      var box = document.createElement("input");
      box.type = "checkbox";
      box.checked = progress[page][itemId] === true;

      label.appendChild(box);
      while (li.firstChild) {
        label.appendChild(li.firstChild);
      }
      li.appendChild(label);
      li.classList.toggle("is-done", box.checked);

      box.addEventListener("change", function () {
        progress[page][itemId] = box.checked;
        li.classList.toggle("is-done", box.checked);
        saveProgress(progress);
        updateStatus();
      });

      checkboxes.push(box);
    });

    reset.addEventListener("click", function () {
      checkboxes.forEach(function (box, index) {
        box.checked = false;
        items[index].classList.remove("is-done");
        progress[page][listId + "-" + index] = false;
      });
      saveProgress(progress);
      updateStatus();
    });

    updateStatus();
  });

  // Home page: <article class="stage-card" data-tracker-page="..." data-tracker-total="6">
  var cards = document.querySelectorAll(".stage-card[data-tracker-page]");

  cards.forEach(function (card) {
    var page = card.getAttribute("data-tracker-page");
    var total = Number(card.getAttribute("data-tracker-total"));
    var done = countDone(page);

    var pill = document.createElement("p");
    pill.className = "stage-progress";
    if (done === 0) {
      pill.textContent = "Not started: 0 of " + total + " objectives";
    } else if (done >= total) {
      pill.textContent = "Complete: " + total + " of " + total + " objectives";
      pill.classList.add("is-complete");
    } else {
      pill.textContent = "In progress: " + done + " of " + total + " objectives";
    }

    // Place it just above the card's link paragraph
    var linkPara = card.querySelector("p:last-of-type");
    card.insertBefore(pill, linkPara);
  });

  /* ---------- 3. 404 page: show the missing address ---------- */
  var missing = document.querySelector(".missing-url");
  if (missing) {
    var code = missing.querySelector("code");
    code.textContent = window.location.pathname;
    missing.hidden = false;
  }
})();
