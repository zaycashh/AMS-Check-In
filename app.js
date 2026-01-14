function unlockSubmit() {
  window.__submitting = false;
}
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
  const otherCompany = document.getElementById("otherCompanyWrapper");
  const otherReason = document.getElementById("otherReasonWrapper");
  const otherService = document.getElementById("otherServiceWrapper");

  if (otherCompany) otherCompany.style.display = "none";
  if (otherReason) otherReason.style.display = "none";
  if (otherService) otherService.style.display = "none";

  // Clear signature
  const canvas = document.getElementById("signaturePad");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Reset signature state
  hasSigned = false;
  const placeholder = document.getElementById("sigPlaceholder");
  if (placeholder) placeholder.style.display = "block";

  // Scroll back to top (kiosk-friendly)
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   GLOBAL VARIABLES
========================================================= */
const ADMIN_PIN = "2468";
let hasSigned = false;

/* =========================================================
   SIGNATURE PAD INITIALIZATION
========================================================= */
function setupSignaturePad() {
  const canvas = document.getElementById("signaturePad");
  const placeholder = document.getElementById("sigPlaceholder");
  if (!canvas) return;

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

  document.getElementById("clearSigBtn")?.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    placeholder.style.display = "block";
    hasSigned = false;
  });
}

/* =========================================================
   DROPDOWN LOGIC
========================================================= */
document.getElementById("companySelect")?.addEventListener("change", (e) => {
  document.getElementById("otherCompanyWrapper").style.display =
    e.target.value === "__OTHER__" ? "block" : "none";
});

document.getElementById("reasonSelect")?.addEventListener("change", (e) => {
  document.getElementById("otherReasonWrapper").style.display =
    e.target.value === "other" ? "block" : "none";
});

document
  .querySelector('input[value="Other"]')
  ?.addEventListener("change", (e) => {
    document.getElementById("otherServiceWrapper").style.display =
      e.target.checked ? "block" : "none";
  });

/* =========================================================
   SUBMIT FORM
========================================================= */
async function saveCheckIn(record) {
  const res = await fetch(
    "https://ams-checkin-api.josealfonsodejesus.workers.dev/checkin",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    }
  );

  if (!res.ok) {
    throw new Error("Cloud save failed");
  }
}

document.getElementById("submitBtn").addEventListener("click", async () => {
if (window.__submitting) return;
window.__submitting = true;
  
  const first = document.getElementById("firstName").value.trim();
  const last = document.getElementById("lastName").value.trim();
  const companyValue = document.getElementById("companyInput").value.trim();

  if (!first || !last) return alert("Please enter first and last name.");
  if (!companyValue) {
  return alert("Please enter a company.");
}

  const finalCompany = companyValue;


  const reasonSelect = document.getElementById("reasonSelect").value;
  const otherReason = document.getElementById("otherReasonInput").value.trim();
  const finalReason = reasonSelect === "other" ? otherReason : reasonSelect;
  if (!finalReason) {
  alert("Please select a reason.");
  unlockSubmit();
  return;
}

  const services = Array.from(
    document.querySelectorAll('input[name="services"]:checked')
  ).map(cb => cb.value);

  if (!services.length) {
  alert("Please select a service.");
  unlockSubmit();
  return;
}
  if (!hasSigned) {
  alert("Please provide a signature.");
  unlockSubmit();
  return;
}

  const canvas = document.getElementById("signaturePad");
  const signature = canvas.toDataURL();
  const now = new Date();

  const record = {
  id: crypto.randomUUID(), // ✅ unique ID (critical)
  date: now.toISOString().split("T")[0],
  time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  first,
  last,
  company: finalCompany,
  reason: finalReason,
  services: services.join(", "),
  signature,
  timestamp: now.getTime()
};
  try {
  await saveCheckIn(record);

  alert("Check-in submitted!");
  resetForm();
  window.__submitting = false;

} catch (err) {
  alert("Unable to submit. Please try again.");
  window.__submitting = false;
}

/* =========================================================
   ADMIN LOGIN (DOUBLE CLICK LOGO)
========================================================= */
function enterAdminMode() {
  document.getElementById("adminArea").style.display = "block";
  document.getElementById("checkInSection").style.display = "none";
}

function promptAdminLogin() {
  const pin = prompt("Enter Admin PIN:");
  if (pin === ADMIN_PIN) enterAdminMode();
  else alert("Incorrect PIN");
}

document.addEventListener("DOMContentLoaded", () => {
  const logo =
    document.getElementById("amsLogo") ||
    document.querySelector("header img");

  if (!logo) return;

  logo.addEventListener("dblclick", (e) => {
    e.preventDefault();
    promptAdminLogin();
  });
});

/* =========================================================
   EXIT ADMIN MODE
========================================================= */
document.getElementById("exitAdminBtn")?.addEventListener("click", () => {
  document.getElementById("adminArea").style.display = "none";
  document.getElementById("checkInSection").style.display = "block";
});

/* =========================================================
   AUTO CAPS
========================================================= */
document.addEventListener("input", (e) => {
  if (e.target.tagName === "INPUT" && e.target.type === "text") {
    e.target.value = e.target.value.toUpperCase();
  }
});

/* =========================================================
   COMPANY DROPDOWN
========================================================= */
function populateCompanyDropdown() {
  const select = document.getElementById("companySelect");
  if (!select) return;

  const companies = JSON.parse(localStorage.getItem("ams_companies")) || [];

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

/* =========================================================
   PAGE LOAD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  setupSignaturePad();
  populateCompanyDropdown();
});

document.getElementById("resetFormBtn")
  ?.addEventListener("click", resetForm);
/* =========================================================
   ONE-TIME DUPLICATE CLEANUP
   (Keeps newest record per unique check-in)
========================================================= */
(function dedupeLogsOnce() {
  const raw = JSON.parse(localStorage.getItem("ams_logs") || "[]");
  if (!raw.length) return;

  const map = new Map();

  raw.forEach(log => {
    // Use ID if available, fallback for old records
    const key =
      log.id ||
      `${log.timestamp}-${log.first}-${log.last}-${log.company}`;

    // Keep the newest version
    if (!map.has(key) || map.get(key).timestamp < log.timestamp) {
      map.set(key, log);
    }
  });

  const cleaned = Array.from(map.values());

  if (cleaned.length !== raw.length) {
    console.warn(
      `🧹 AMS cleanup: ${raw.length - cleaned.length} duplicate(s) removed`
    );
    localStorage.setItem("ams_logs", JSON.stringify(cleaned));
  }
})();
/* =========================================================
   COMPANY AUTOCOMPLETE
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("companyInput");
  const suggestions = document.getElementById("companySuggestions");

  if (!input || !suggestions) return;

  const companies =
    JSON.parse(localStorage.getItem("ams_companies")) || [];

  input.addEventListener("input", () => {
    const query = input.value.trim().toUpperCase();
    suggestions.innerHTML = "";

    if (query.length < 2) {
      suggestions.style.display = "none";
      return;
    }

    const matches = companies.filter(c =>
      c.toUpperCase().includes(query)
    );

    if (!matches.length) {
      suggestions.style.display = "none";
      return;
    }

    matches.forEach(company => {
      const div = document.createElement("div");
      div.className = "company-suggestion";
      div.textContent = company;

      div.addEventListener("click", () => {
        input.value = company;
        suggestions.innerHTML = "";
        suggestions.style.display = "none";
      });

      suggestions.appendChild(div);
    });

    suggestions.style.display = "block";
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", e => {
    if (!e.target.closest(".company-autocomplete")) {
      suggestions.innerHTML = "";
      suggestions.style.display = "none";
    }
  });
});
