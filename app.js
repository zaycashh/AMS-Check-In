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

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  let drawing = false;

  const getPos = e => {
    const rect = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  const draw = e => {
    if (!drawing) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (e.touches) e.preventDefault();
  };

  canvas.addEventListener("mousedown", e => {
  drawing = true;
  hasSigned = true; // ✅ USER SIGNED
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

  canvas.addEventListener("touchstart", e => {
  drawing = true;
  hasSigned = true; // ✅ USER SIGNED
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
  hasSigned = false; // 🔁 RESET SIGNATURE
});

/* =========================================================
   DROPDOWN LOGIC
========================================================= */
document.getElementById("companySelect").addEventListener("change", e => {
  document.getElementById("otherCompanyWrapper").style.display =
    e.target.value === "__OTHER__" ? "block" : "none";
});

document.getElementById("reasonSelect").addEventListener("change", e => {
  document.getElementById("otherReasonWrapper").style.display =
    e.target.value === "other" ? "block" : "none";
});

document
  .querySelector('input[value="Other"]')
  .addEventListener("change", e => {
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
  const finalReason =
    reasonSelect === "other" ? otherReason : reasonSelect;

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
   
// ===============================
// REQUIRED SIGNATURE VALIDATION
// ===============================
if (!hasSigned) {
  alert("Please provide a signature before submitting.");
  return; // ⛔ HARD STOP
}
   
  const signature = canvas.toDataURL();

  /* ===============================
     SAVE RECORD
  =============================== */
  const now = new Date();

  const record = {
    date: now.toISOString().split("T")[0],
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    first,
    last,
    company: finalCompany,
    reason: finalReason,
    services: services.join(", "),
    signature,
    timestamp: Date.now()
  };

  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");
  logs.push(record);
  localStorage.setItem("ams_logs", JSON.stringify(logs));

  alert("Check-in submitted!");
  location.reload();
});

/* =========================================================
   RESET FORM
========================================================= */
document
  .getElementById("resetFormBtn")
  .addEventListener("click", () => location.reload());

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
   SEARCH INIT (SAFE)
========================================================= */
function initRunSearch() {
  const btn = document.getElementById("runSearch");
  const box = document.getElementById("searchResultsTable");
  if (!btn || !box) return;

  btn.addEventListener("click", () => {
    const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

    box.innerHTML = logs.length
      ? logs
          .map(
            r => `
        <tr>
          <td>${r.date}</td>
          <td>${r.time}</td>
          <td>${r.first}</td>
          <td>${r.last}</td>
          <td>${r.company}</td>
          <td>${r.services}</td>
          <td>${r.reason}</td>
        </tr>`
          )
          .join("")
      : "<tr><td colspan='7'>No results found</td></tr>";
  });
}

/* =========================================================
   AUTO CAPS
========================================================= */
document.addEventListener("input", e => {
  if (e.target.tagName === "INPUT" && e.target.type === "text") {
    e.target.value = e.target.value.toUpperCase();
  }
});

/* =========================================================
   COMPANY DROPDOWN (SINGLE VERSION)
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

window.populateCompanyDropdown = populateCompanyDropdown;

/* =========================================================
   PAGE LOAD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  setupSignaturePad();
  populateCompanyDropdown();
});
