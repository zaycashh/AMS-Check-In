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
document.getElementById("submitBtn")?.addEventListener("click", () => {
  const first = document.getElementById("firstName").value.trim();
  const last = document.getElementById("lastName").value.trim();
  const companyValue = document.getElementById("companySelect").value;

  if (!first || !last) return alert("Please enter first and last name.");
  if (!companyValue) return alert("Please select a company.");

  let finalCompany = companyValue;
  if (companyValue === "__OTHER__") {
    finalCompany = document.getElementById("otherCompany").value.trim();
    if (!finalCompany) return alert("Please enter the company name.");
  }

  const reasonSelect = document.getElementById("reasonSelect").value;
  const otherReason = document.getElementById("otherReasonInput").value.trim();
  const finalReason = reasonSelect === "other" ? otherReason : reasonSelect;
  if (!finalReason) return alert("Please select a reason.");

  const services = Array.from(
    document.querySelectorAll('input[name="services"]:checked')
  ).map(cb => cb.value);

  if (!services.length) return alert("Please select a service.");
  if (!hasSigned) return alert("Please provide a signature.");

  const canvas = document.getElementById("signaturePad");
  const signature = canvas.toDataURL();
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
