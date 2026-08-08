"use strict";

const crossings = [
  {
    name: "Van Dyke Ave & Nevada Ave",
    status: "clear",
    detail: "Traffic moving normally"
  },
  {
    name: "Conant St & Davison St",
    status: "blocked",
    detail: "Freight train • about 8 minutes"
  },
  {
    name: "Dequindre St & 8 Mile Rd",
    status: "approaching",
    detail: "Train approaching • about 3 minutes"
  },
  {
    name: "Mt. Elliott St & Harper Ave",
    status: "clear",
    detail: "Last report 4 minutes ago"
  }
];

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => [
  ...document.querySelectorAll(selector)
];

const crossingList = $("#crossingList");
const toast = $("#toast");

let toastTimer;

function safeText(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function statusLabel(status) {
  if (status === "approaching") {
    return "Approaching";
  }

  return status[0].toUpperCase() + status.slice(1);
}

function renderCrossings() {
  crossingList.innerHTML = crossings
    .map((crossing) => {
      return `
        <article class="crossing-card">
          <span
            class="status-dot ${crossing.status}"
            aria-hidden="true"
          ></span>

          <div class="crossing-info">
            <strong>${safeText(crossing.name)}</strong>
            <small>${safeText(crossing.detail)}</small>
          </div>

          <span
            class="status-badge ${crossing.status}"
          >
            ${statusLabel(crossing.status)}
          </span>
        </article>
      `;
    })
    .join("");

  $("#clearCount").textContent = crossings.filter(
    (item) => item.status === "clear"
  ).length;

  $("#blockedCount").textContent = crossings.filter(
    (item) => item.status === "blocked"
  ).length;

  $("#warningCount").textContent = crossings.filter(
    (item) => item.status === "approaching"
  ).length;

  $("#lastUpdated").textContent =
    `Updated ${new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

function showScreen(screenId) {
  $$(".screen").forEach((screen) => {
    screen.classList.toggle(
      "active",
      screen.id === screenId
    );
  });

  $$(".nav-button").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.screen === screenId
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

$$(".nav-button").forEach((button) => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.screen);
  });
});

$("#demoButton").addEventListener("click", () => {
  const demoCrossing = crossings.find((item) =>
    item.name.includes("Van Dyke")
  );

  demoCrossing.status = "approaching";
  demoCrossing.detail =
    "Demo train approaching • about 2 minutes";

  renderCrossings();

  showToast(
    "Demo started: train approaching Van Dyke & Nevada."
  );

  setTimeout(() => {
    demoCrossing.status = "blocked";
    demoCrossing.detail =
      "Demo crossing blocked • about 6 minutes";

    renderCrossings();

    showToast(
      "Demo update: Van Dyke & Nevada is now blocked."
    );
  }, 4500);

  setTimeout(() => {
    demoCrossing.status = "clear";
    demoCrossing.detail =
      "Demo complete • crossing is clear";

    renderCrossings();

    showToast(
      "Demo complete: Van Dyke & Nevada is clear."
    );
  }, 10000);
});

$("#locationButton").addEventListener("click", () => {
  const message = $("#locationMessage");

  if (!navigator.geolocation) {
    message.textContent =
      "Location is not supported on this device. " +
      "Demo crossings are still available.";

    return;
  }

  message.textContent = "Requesting your location…";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      message.textContent =
        `Location on (${latitude.toFixed(3)}, ` +
        `${longitude.toFixed(3)}). ` +
        "Showing nearby demo crossings.";

      showToast(
        "Location enabled. Nearby crossing alerts are ready."
      );
    },

    () => {
      message.textContent =
        "Location permission was not granted. " +
        "You can still use the live demo.";

      showToast(
        "Location stayed off. Enable it in browser settings."
      );
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
});

$("#notificationButton").addEventListener(
  "click",
  requestNotifications
);

async function requestNotifications() {
  if (!("Notification" in window)) {
    showToast(
      "This browser does not support notifications."
    );

    return;
  }

  try {
    const permission =
      await Notification.requestPermission();

    if (permission === "granted") {
      new Notification("TTA Worldwide", {
        body:
          "Rail alerts are turned on for this device."
      });

      showToast("Notifications are turned on.");
    } else {
      showToast(
        "Notifications were not enabled. " +
        "You can change this in browser settings."
      );
    }
  } catch (error) {
    showToast(
      "Notification permission is unavailable " +
      "in this preview."
    );
  }
}

$$(".map-pin").forEach((pin) => {
  pin.addEventListener("click", () => {
    const crossing = crossings.find(
      (item) =>
        item.name === pin.dataset.crossing
    );

    if (crossing) {
      $("#mapMessage").textContent =
        `${crossing.name}: ` +
        `${statusLabel(crossing.status)} — ` +
        `${crossing.detail}.`;
    } else {
      $("#mapMessage").textContent =
        pin.dataset.crossing;
    }
  });
});

$("#reportForm").addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const formData =
      new FormData(event.currentTarget);

    const name =
      formData.get("crossingName").trim();

    const submittedStatus =
      formData.get("reportStatus");

    let status = "clear";

    if (submittedStatus === "Crossing blocked") {
      status = "blocked";
    }

    if (submittedStatus === "Train approaching") {
      status = "approaching";
    }

    const wait = formData.get("waitTime");

    const existing = crossings.find(
      (item) =>
        item.name.toLowerCase() ===
        name.toLowerCase()
    );

    const report = {
      name: name,
      status: status,
      detail: `Community report • ${wait}`
    };

    if (existing) {
      Object.assign(existing, report);
    } else {
      crossings.unshift(report);
    }

    renderCrossings();

    event.currentTarget.reset();

    $("#reportMessage").textContent =
      `Thank you. Your report for ${name} ` +
      "was added to this demo.";

    showToast(
      "Train report submitted successfully."
    );

    setTimeout(() => {
      showScreen("home");
    }, 900);
  }
);

const alertCheckboxes = $$(
  ".settings-card input[type='checkbox']"
);

let savedSettings = null;

try {
  savedSettings = JSON.parse(
    localStorage.getItem("ttaAlertSettings")
  );
} catch (error) {
  savedSettings = null;
}

if (savedSettings) {
  alertCheckboxes.forEach((box, index) => {
    box.checked = Boolean(savedSettings[index]);
  });
}

alertCheckboxes.forEach((box) => {
  box.addEventListener("change", () => {
    const settings = alertCheckboxes.map(
      (item) => item.checked
    );

    localStorage.setItem(
      "ttaAlertSettings",
      JSON.stringify(settings)
    );

    $("#alertMessage").textContent =
      "Your alert settings were saved " +
      "on this device.";
  });
});

$("#testAlertButton").addEventListener(
  "click",
  () => {
    const enabledCount =
      alertCheckboxes.filter(
        (box) => box.checked
      ).length;

    if (!enabledCount) {
      $("#alertMessage").textContent =
        "Turn on at least one alert type " +
        "before testing.";

      showToast(
        "No alert types are turned on."
      );

      return;
    }

    $("#alertMessage").textContent =
      "Test successful: Train approaching " +
      "Van Dyke & Nevada in about 3 minutes.";

    showToast(
      "TEST ALERT: Train approaching " +
      "Van Dyke & Nevada."
    );

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(
        "TTA Worldwide test alert",
        {
          body:
            "Train approaching Van Dyke & " +
            "Nevada in about 3 minutes."
        }
      );
    }
  }
);

renderCrossings();
