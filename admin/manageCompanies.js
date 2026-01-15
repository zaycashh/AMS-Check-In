/* =========================================================
   MANAGE COMPANIES MODULE (SAFE / NO GLOBAL COLLISIONS)
========================================================= */

window.companyCache = window.companyCache || [];
window.selectedCompany = null;

let isEditMode = false;

/* =========================================================
   HELPERS
========================================================= */
function normalizeCompanyName(val) {
  return val.trim().toUpperCase();
}

/* =========================================================
   FETCH COMPANIES (CLOUD + FALLBACK)
========================================================= */
async function fetchCompanies() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/companies"
    );
    if (!res.ok) throw new Error("Cloud fetch failed");

    const companies = await res.json();
    localStorage.setItem("ams_companies", JSON.stringify(companies));
    window.companyCache = companies;
    return companies;
  } catch (err) {
    console.warn("⚠️ Using local companies");
    const local = JSON.parse(localStorage.getItem("ams_companies") || "[]");
    window.companyCache = local;
    return local;
  }
}

/* =========================================================
   SAVE COMPANIES (CLOUD + LOCAL)
========================================================= */
async function saveCompaniesToCloud(companies) {
  localStorage.setItem("ams_companies", JSON.stringify(companies));
  window.companyCache = companies;

  try {
    await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/companies",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companies)
      }
    );
  } catch (err) {
    console.error("⚠️ Cloud save failed", err);
  }
}

/* =========================================================
   RENDER MANAGE COMPANIES UI
========================================================= */
async function renderCompanyManager() {
  const container = document.getElementById("tabCompanies");
  if (!container) return;

  let companies = window.companyCache.length
    ? window.companyCache
    : await fetchCompanies();

  companies = Array.from(
    new Set(companies.map(c => normalizeCompanyName(c)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  window.companyCache = companies;
  window.selectedCompany = null;
  isEditMode = false;

  container.innerHTML = `
    <h2 class="section-title">Manage Companies</h2>

    <div style="max-width:520px;">
      <label><strong>Company</strong></label>

      <input
        id="companyManagerInput"
        list="companyManagerList"
        placeholder="Type or select a company"
        style="width:100%;padding:12px;margin-bottom:6px;"
      />

      <div id="editHint" style="font-size:13px;color:#666;margin-bottom:12px;"></div>

      <datalist id="companyManagerList">
        ${companies.map(c => `<option value="${c}"></option>`).join("")}
      </datalist>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="addBtn" class="primary-btn">Add</button>
        <button id="editBtn" class="secondary-btn">Edit</button>
        <button id="saveBtn" class="primary-btn" disabled>Save</button>
        <button id="deleteBtn" class="secondary-btn">Delete</button>
      </div>
    </div>
  `;

  const input = document.getElementById("companyManagerInput");
  const hint = document.getElementById("editHint");
  const addBtn = document.getElementById("addBtn");
  const editBtn = document.getElementById("editBtn");
  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  /* =========================
     ADD
  ========================= */
  addBtn.onclick = async () => {
    const name = normalizeCompanyName(input.value);
    if (!name) return;

    if (window.companyCache.includes(name)) {
      alert("Company already exists.");
      return;
    }

    window.companyCache.push(name);
    await saveCompaniesToCloud(window.companyCache);
    renderCompanyManager();
  };

  /* =========================
     EDIT
  ========================= */
  editBtn.onclick = () => {
    const value = normalizeCompanyName(input.value);

    if (!window.companyCache.includes(value)) {
      alert("Select an existing company first.");
      return;
    }

    window.selectedCompany = value;
    isEditMode = true;
    saveBtn.disabled = false;

    hint.textContent = `Editing: ${value}`;
  };

  /* =========================
     SAVE
  ========================= */
  saveBtn.onclick = async () => {
    if (!isEditMode) return;

    const newName = normalizeCompanyName(input.value);
    if (!newName) return;

    if (
      window.companyCache.includes(newName) &&
      newName !== window.selectedCompany
    ) {
      alert("That company already exists.");
      return;
    }

    const idx = window.companyCache.indexOf(window.selectedCompany);
    if (idx === -1) {
      alert("Original company not found.");
      return;
    }

    window.companyCache[idx] = newName;

    await saveCompaniesToCloud(window.companyCache);
    renderCompanyManager();
  };

  /* =========================
     DELETE
  ========================= */
  deleteBtn.onclick = async () => {
    const value = normalizeCompanyName(input.value);

    if (!window.companyCache.includes(value)) {
      alert("Select a company first.");
      return;
    }

    if (!confirm(`Delete "${value}"?\n\nPast check-ins remain.`)) return;

    window.companyCache = window.companyCache.filter(c => c !== value);
    await saveCompaniesToCloud(window.companyCache);
    renderCompanyManager();
  };
}

/* =========================================================
   EXPOSE
========================================================= */
window.renderCompanyManager = renderCompanyManager;

console.log("Manage Companies Module Loaded");
