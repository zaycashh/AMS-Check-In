/* =========================================================
   GLOBAL VARIABLES
========================================================= */
const ADMIN_PIN = "2468";
let hasSigned = false;
/* =========================================================
   AUTO RESET ON INACTIVITY (KIOSK SAFETY)
========================================================= */
let inactivityTimer = null;

// 3 minutes (adjust if needed)
const INACTIVITY_LIMIT = 3 * 60 * 1000;

function startInactivityTimer() {
  clearTimeout(inactivityTimer);

  inactivityTimer = setTimeout(() => {
    console.log("⏱️ Inactivity timeout — resetting form");

    // Only reset if we're on check-in screen
    const checkInVisible =
      document.getElementById("checkInSection")?.style.display !== "none";

    if (checkInVisible) {
      resetForm();
      scrollToTop();
    }
  }, INACTIVITY_LIMIT);
}

// Reset timer on any interaction
["click", "input", "touchstart", "keydown"].forEach(evt => {
  document.addEventListener(evt, startInactivityTimer, true);
});
/* =========================================================
   CLOUD + LOCAL SAVE
========================================================= */
async function saveCheckIn(record) {
  // ===============================
  // 1. ALWAYS SAVE LOCALLY (BACKUP)
  // ===============================
  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");
  logs.push(record);
  localStorage.setItem("ams_logs", JSON.stringify(logs));

  // ===============================
  // 2. TRY CLOUD SAVE (PRIMARY)
  // ===============================
  try {
    const res = await fetch("https://ams-checkin-api.josealfonsodejesus.workers.dev/checkin", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(record)
});

    const data = await res.json();

    if (data.success) {
      console.log("✅ Cloud save OK:", data.id);
    } else {
      console.warn("⚠️ Cloud save failed, local only");
    }
  } catch (err) {
    console.warn("⚠️ Offline or Cloudflare unreachable", err);
  }
}
/* =========================================================
   CLOUD ADMIN FETCH (WITH FALLBACK)
========================================================= */
async function fetchAdminLogs() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs"
    );

    if (!res.ok) throw new Error("Cloud fetch failed");

    const cloudLogs = await res.json();

    // Cache cloud logs locally for offline use
    localStorage.setItem("ams_logs", JSON.stringify(cloudLogs));

    console.log("☁️ Admin logs loaded from cloud:", cloudLogs.length);

    return cloudLogs;
  } catch (err) {
    console.warn("⚠️ Using local admin logs (offline or error)");
    return JSON.parse(localStorage.getItem("ams_logs") || "[]");
  }
}
/* ===============================================
   SCROLL TO TOP HELPER
=============================================== */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}
/* =========================================================
   RESET FORM FUNCTION
========================================================= */
function resetForm() {
  // Clear text inputs
  document.querySelectorAll(
    "#checkInSection input[type='text']"
  ).forEach(input => input.value = "");

  // Reset selects
  document.querySelectorAll(
    "#checkInSection select"
  ).forEach(select => select.selectedIndex = 0);

  // Uncheck checkboxes
  document.querySelectorAll(
    "#checkInSection input[type='checkbox']"
  ).forEach(cb => cb.checked = false);

  // Hide conditional fields
  document.getElementById("otherCompanyWrapper").style.display = "none";
  document.getElementById("otherReasonWrapper").style.display = "none";
  document.getElementById("otherServiceWrapper").style.display = "none";

  // Clear signature
  const canvas = document.getElementById("signaturePad");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Reset signature state
  hasSigned = false;
  document.getElementById("sigPlaceholder").style.display = "block";
}

/* =========================================================
   SIGNATURE PAD INITIALIZATION
========================================================= */
function setupSignaturePad() {
  const canvas = document.getElementById("signaturePad");
  const placeholder = document.getElementById("sigPlaceholder");

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  let drawing = false;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  const draw = (e) => {
    if (!drawing) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (e.touches) e.preventDefault();
  };

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    hasSigned = true;
    placeholder.style.display = "none";
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.beginPath();
  });

  canvas.addEventListener("mousemove", draw);

  canvas.addEventListener("touchstart", (e) => {
    drawing = true;
    hasSigned = true;
    placeholder.style.display = "none";
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.preventDefault();
  });

  canvas.addEventListener("touchend", () => {
    drawing = false;
    ctx.beginPath();
  });

  canvas.addEventListener("touchmove", draw);

  document.getElementById("clearSigBtn").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    placeholder.style.display = "block";
    hasSigned = false;
  });
}

/* =========================================================
   DROPDOWN LOGIC
========================================================= */
document.getElementById("companySelect").addEventListener("change", (e) => {
  document.getElementById("otherCompanyWrapper").style.display =
    e.target.value === "__OTHER__" ? "block" : "none";
});

document.getElementById("reasonSelect").addEventListener("change", (e) => {
  document.getElementById("otherReasonWrapper").style.display =
    e.target.value === "other" ? "block" : "none";
});

document
  .querySelector('input[value="Other"]')
  .addEventListener("change", (e) => {
    document.getElementById("otherServiceWrapper").style.display =
      e.target.checked ? "block" : "none";
  });

/* =========================================================
   SUBMIT FORM
========================================================= */
document.getElementById("submitBtn").addEventListener("click", () => {
  const first = document.getElementById("firstName").value.trim();
  const last = document.getElementById("lastName").value.trim();
  const companyValue = document.getElementById("companySelect").value;

  if (!first || !last) {
    alert("Please enter first and last name.");
    return;
  }

  if (!companyValue) {
    alert("Please select a company.");
    return;
  }

  let finalCompany = companyValue;
  if (companyValue === "__OTHER__") {
    finalCompany = document.getElementById("otherCompany").value.trim();
    if (!finalCompany) {
      alert("Please enter the company name.");
      return;
    }
  }

  /* ===============================
     REQUIRED REASON VALIDATION
  =============================== */
  const reasonSelect = document.getElementById("reasonSelect").value;
  const otherReason = document.getElementById("otherReasonInput").value.trim();
  const finalReason = reasonSelect === "other" ? otherReason : reasonSelect;

  if (!finalReason) {
    alert("Please select or enter a Reason for Testing.");
    return;
  }

  /* ===============================
     REQUIRED SERVICES VALIDATION
  =============================== */
  const selectedServices = Array.from(
    document.querySelectorAll('input[name="services"]:checked')
  );

  if (selectedServices.length === 0) {
    alert("Please select at least one Service.");
    return;
  }

  const services = [];
  for (const cb of selectedServices) {
    if (cb.value === "Other") {
      const custom = document.getElementById("srvOtherText").value.trim();
      if (!custom) {
        alert("Please enter the Other Service.");
        return;
      }
      services.push(custom);
    } else {
      services.push(cb.value);
    }
  }

  /* ===============================
     REQUIRED SIGNATURE VALIDATION
  =============================== */
  if (!hasSigned) {
    alert("Please provide a signature before submitting.");
    return;
  }

  const canvas = document.getElementById("signaturePad");
  const signature = canvas.toDataURL();

  /* ===============================
     SAVE RECORD
  =============================== */
  const now = new Date();

const record = {
  id: crypto.randomUUID(), // REQUIRED for offline + cloud sync

  date:
    now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0"),

  time: now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }),

  first,
  last,
  company: finalCompany,
  reason: finalReason,
  services: services.join(", "),
  signature,

  timestamp: Date.now(),
  synced: false
};

  saveCheckIn(record);

   alert("Check-in submitted!");
scrollToTop();
resetForm();
});

/* =========================================================
   RESET FORM
========================================================= */
document
  .getElementById("resetFormBtn")
  .addEventListener("click", () => {
    resetForm();
    setTimeout(scrollToTop, 50);
  });

/* =========================================================
   ADMIN LOGIN
========================================================= */
document.getElementById("toggleAdminBtn").addEventListener("click", () => {
  const pin = prompt("Enter Admin PIN:");
  if (pin !== ADMIN_PIN) {
    alert("Incorrect PIN");
    return;
  }

  document.getElementById("adminArea").style.display = "block";
  document.getElementById("checkInSection").style.display = "none";

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => (c.style.display = "none"));

  const recentTab = document.querySelector('.tab[data-tab="tabRecent"]');
  const recentContent = document.getElementById("tabRecent");

  if (recentTab && recentContent) {
    recentTab.classList.add("active");
    recentContent.style.display = "block";
    if (typeof renderRecentCheckIns === "function") renderRecentCheckIns();
  }

  initRunSearch();
});

/* =========================================================
   EXIT ADMIN MODE
========================================================= */
document.getElementById("exitAdminBtn").addEventListener("click", () => {
  document.getElementById("adminArea").style.display = "none";
  document.getElementById("checkInSection").style.display = "block";
});

/* =========================================================
   SEARCH INIT
========================================================= */
function initRunSearch() {
  const btn = document.getElementById("runSearch");
  const box = document.getElementById("searchResultsTable");
  if (!btn || !box) return;

  btn.addEventListener("click", async () => {
  const logs = await fetchAdminLogs();

    box.innerHTML = logs.length
      ? logs.map(r => `
        <tr>
          <td>${r.date}</td>
          <td>${r.time}</td>
          <td>${r.first}</td>
          <td>${r.last}</td>
          <td>${r.company}</td>
          <td>${r.services}</td>
          <td>${r.reason}</td>
        </tr>
      `).join("")
      : "<tr><td colspan='7'>No results found</td></tr>";
  });
}

/* =========================================================
   AUTO CAPS
========================================================= */
document.addEventListener("input", (e) => {
  if (e.target.tagName === "INPUT" && e.target.type === "text") {
    e.target.value = e.target.value.toUpperCase();
  }
});
async function fetchCompanies() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/companies"
    );

    if (!res.ok) throw new Error("Cloud fetch failed");

    const companies = await res.json();

    // Cache locally for donor side
    localStorage.setItem("ams_companies", JSON.stringify(companies));

    console.log("☁️ Companies loaded from cloud:", companies.length);
    return companies;
  } catch (err) {
    console.warn("⚠️ Using local companies (offline)");
    return JSON.parse(localStorage.getItem("ams_companies") || "[]");
  }
}
/* =========================================================
   COMPANY DROPDOWN (CLOUD + OFFLINE SAFE)
========================================================= */
async function populateCompanyDropdown() {
  const select = document.getElementById("companySelect");
  if (!select) return;

  const companies = await fetchCompanies();

  select.innerHTML = `
    <option value="">-- Select Company --</option>
    <option value="__OTHER__">Other (enter manually)</option>
  `;

  companies.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.insertBefore(opt, select.lastElementChild);
  });
}

window.populateCompanyDropdown = populateCompanyDropdown;

/* =========================================================
   AUTO SYNC OFFLINE RECORDS WHEN ONLINE
========================================================= */
async function syncOfflineCheckIns() {
  if (!navigator.onLine) return;

  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

  let updated = false;

  for (const record of logs) {
    if (record.synced) continue;

    try {
      const res = await fetch(
        "https://ams-checkin-api.josealfonsodejesus.workers.dev/checkin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record)
        }
      );

      const data = await res.json();

      if (data.success) {
        record.synced = true;
        updated = true;
        console.log("☁️ Synced offline record:", data.id);
      }
    } catch (err) {
      console.warn("⚠️ Sync attempt failed, will retry later");
      break;
    }
  }

  if (updated) {
    localStorage.setItem("ams_logs", JSON.stringify(logs));
  }
}
/* =========================================================
   NETWORK LISTENER
========================================================= */
window.addEventListener("online", () => {
  console.log("📶 Internet restored — syncing check-ins");
  syncOfflineCheckIns();
});

/* =========================================================
   PAGE LOAD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  setupSignaturePad();
  populateCompanyDropdown();
  syncOfflineCheckIns(); // ✅ SAFE AUTO SYNC
});
