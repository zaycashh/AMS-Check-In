/* =========================================================
   CLOUD COMPANIES FETCH (WITH FALLBACK)
========================================================= */

// In-memory cache
let companyCache = null;

// Track selected company for edit/rename
let selectedCompany = null;

async function fetchCompanies() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/companies"
    );

    if (!res.ok) throw new Error("Cloud fetch failed");

    const companies = await res.json();

    localStorage.setItem("ams_companies", JSON.stringify(companies));
    companyCache = companies;

    console.log("☁️ Companies loaded from cloud:", companies.length);
    return companies;
  } catch {
    console.warn("⚠️ Using local companies");
    const local = JSON.parse(localStorage.getItem("ams_companies") || "[]");
    companyCache = local;
    return local;
  }
}

/* =========================================================
   CLOUD SAVE
========================================================= */
async function saveCompaniesToCloud(companies) {
  localStorage.setItem("ams_companies", JSON.stringify(companies));
  companyCache = companies;

  try {
    await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/companies",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companies)
      }
    );

    console.log("☁️ Companies saved to cloud:", companies.length);
  } catch (err) {
    console.error("❌ Failed to save companies to cloud", err);
  }
}

console.log("Manage Companies Module Loaded");

/* =========================================================
   MANAGE COMPANIES (SINGLE INPUT + EDIT SAFE)
========================================================= */
async function renderCompanyManager() {
  const container = document.getElementById("tabCompanies");
  if (!container) return;

  let companies = companyCache || await fetchCompanies();

  // CLEAN + DEDUPE + SORT
  companies = Array.from(
    new Set(
      companies
        .map(c => c.trim().toUpperCase())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  companyCache = companies;
  selectedCompany = null;

  container.innerHTML = `
    <h2 class="section-title">Manage Companies</h2>

    <div style="max-width:500px;">
      <label><strong>Company</strong></label>

      <input
        id="companyInput"
        list="companyList"
        placeholder="Select or type company name"
        style="width:100%;padding:12px;margin-bottom:12px;"
      />

      <datalist id="companyList">
        ${companies.map(c => `<option value="${c}"></option>`).join("")}
      </datalist>

      <div style="display:flex;gap:10px;">
        <button id="saveCompanyBtn" class="primary-btn" type="button">
          Add / Save
        </button>
        <button id="deleteCompanyBtn" class="secondary-btn" type="button">
          Delete
        </button>
      </div>
    </div>
  `;

  const companyInput = document.getElementById("companyInput");

  /* =========================
     TRACK SELECTION FOR EDIT
  ========================= */
  companyInput.addEventListener("input", () => {
    const value = companyInput.value.trim().toUpperCase();
    selectedCompany = companyCache.includes(value) ? value : null;
  });

  /* =========================
     ADD / EDIT / RENAME
  ========================= */
  document.getElementById("saveCompanyBtn").onclick = async () => {
    const name = companyInput.value.trim().toUpperCase();
    if (!name) return;

    let companies = companyCache || await fetchCompanies();

    // RENAME
    if (selectedCompany && selectedCompany !== name) {
      if (companies.includes(name)) {
        alert("That company already exists.");
        return;
      }

      const idx = companies.indexOf(selectedCompany);
      companies[idx] = name;
      selectedCompany = null;
    }

    // ADD
    else if (!companies.includes(name)) {
      companies.push(name);
    }

    await saveCompaniesToCloud(companies);
    renderCompanyManager();
  };

  /* =========================
     DELETE
  ========================= */
  document.getElementById("deleteCompanyBtn").onclick = async () => {
    const name = companyInput.value.trim().toUpperCase();
    if (!name) return;

    let companies = companyCache || await fetchCompanies();

    if (!companies.includes(name)) {
      alert("Company not found.");
      return;
    }

    if (!confirm(`Delete "${name}"?\n\nPast check-ins will remain.`)) return;

    companies = companies.filter(c => c !== name);
    selectedCompany = null;

    await saveCompaniesToCloud(companies);
    renderCompanyManager();
  };
}

/* =========================================================
   EXPOSE GLOBALLY
========================================================= */
window.renderCompanyManager = renderCompanyManager;
/* =========================================================
   ADMIN ACCESS (HIDDEN + SAFE)
========================================================= */

const ADMIN_PIN = "2468";

/* ===============================
   ENTER ADMIN MODE
=============================== */
function enterAdminMode() {
  document.getElementById("adminArea").style.display = "block";
  document.getElementById("checkInSection").style.display = "none";

  // Reset tabs
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => {
    c.style.display = "none";
  });

  // Default to Recent tab
  const recentTab = document.querySelector('.tab[data-tab="tabRecent"]');
  const recentContent = document.getElementById("tabRecent");

  if (recentTab && recentContent) {
    recentTab.classList.add("active");
    recentContent.style.display = "block";
    if (typeof renderRecentCheckIns === "function") {
      renderRecentCheckIns();
    }
  }
}

/* ===============================
   PROMPT FOR PIN
=============================== */
function promptAdminLogin() {
  const pin = prompt("Enter Admin PIN:");
  if (pin === ADMIN_PIN) {
    enterAdminMode();
  } else {
    alert("Incorrect PIN");
  }
}

/* ===============================
   ADMIN BUTTON (IF PRESENT)
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("toggleAdminBtn");
  if (btn) {
    btn.addEventListener("click", promptAdminLogin);
  }
});

/* ===============================
   HIDDEN LOGO LONG-PRESS (KIOSK)
=============================== */
let adminHoldTimer = null;
const ADMIN_HOLD_DURATION = 5000; // 5 seconds

document.addEventListener("DOMContentLoaded", () => {
  const logo =
    document.getElementById("amsLogo") ||
    document.querySelector("header img");

  if (!logo) return;

  // Desktop
  logo.addEventListener("mousedown", () => {
    adminHoldTimer = setTimeout(promptAdminLogin, ADMIN_HOLD_DURATION);
  });
  logo.addEventListener("mouseup", () => clearTimeout(adminHoldTimer));
  logo.addEventListener("mouseleave", () => clearTimeout(adminHoldTimer));

  // iPad / Touch
  logo.addEventListener("touchstart", e => {
    e.preventDefault();
    adminHoldTimer = setTimeout(promptAdminLogin, ADMIN_HOLD_DURATION);
  });
  logo.addEventListener("touchend", () => clearTimeout(adminHoldTimer));
  logo.addEventListener("touchcancel", () => clearTimeout(adminHoldTimer));
});

