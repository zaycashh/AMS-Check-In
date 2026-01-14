/* =========================================================
   CLOUD COMPANIES FETCH (WITH FALLBACK)
========================================================= */
// ❌ REMOVED: let companyCache = null;
let selectedCompany = null;
let isEditMode = false;

async function fetchCompanies() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/companies"
    );
    if (!res.ok) throw new Error("Cloud fetch failed");

    const companies = await res.json();
    localStorage.setItem("ams_companies", JSON.stringify(companies));

    // ✅ USE GLOBAL CACHE
    window.companyCache = companies;

    return companies;
  } catch {
    const local = JSON.parse(localStorage.getItem("ams_companies") || "[]");
    window.companyCache = local;
    return local;
  }
}

/* =========================================================
   CLOUD SAVE
========================================================= */
async function saveCompaniesToCloud(companies) {
  localStorage.setItem("ams_companies", JSON.stringify(companies));

  // ✅ USE GLOBAL CACHE
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
    console.error("Cloud save failed", err);
  }
}

/* =========================================================
   MANAGE COMPANIES (SAFE EDIT MODE)
========================================================= */
async function renderCompanyManager() {
  const container = document.getElementById("tabCompanies");
  if (!container) return;

  let companies = window.companyCache || await fetchCompanies();

  companies = Array.from(
    new Set(companies.map(c => c.trim().toUpperCase()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  window.companyCache = companies;
  selectedCompany = null;
  isEditMode = false;

  container.innerHTML = `
    <h2 class="section-title">Manage Companies</h2>

    <div style="max-width:500px;">
      <label><strong>Company</strong></label>

      <input
        id="companyInput"
        list="companyList"
        placeholder="Select or type company name"
        style="width:100%;padding:12px;margin-bottom:6px;"
      />

      <div id="editHint" style="font-size:13px;color:#666;margin-bottom:12px;"></div>

      <datalist id="companyList">
        ${companies.map(c => `<option value="${c}"></option>`).join("")}
      </datalist>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="addBtn" class="primary-btn">Add</button>
        <button id="editBtn" class="secondary-btn">Edit</button>
        <button id="saveBtn" class="primary-btn" disabled>Save Changes</button>
        <button id="deleteBtn" class="secondary-btn">Delete</button>
      </div>
    </div>
  `;

  const input = document.getElementById("companyInput");
  const hint = document.getElementById("editHint");

  const addBtn = document.getElementById("addBtn");
  const editBtn = document.getElementById("editBtn");
  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  /* =========================
     SELECT COMPANY
  ========================= */
  input.addEventListener("input", () => {
    const value = input.value.trim().toUpperCase();

    if (window.companyCache.includes(value)) {
      selectedCompany = value;
      hint.textContent = `Selected: ${value}`;
      saveBtn.disabled = true;
      isEditMode = false;
    } else {
      selectedCompany = null;
      hint.textContent = "";
    }
  });

  /* =========================
     ADD
  ========================= */
  addBtn.onclick = async () => {
    const name = input.value.trim().toUpperCase();
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
    if (!selectedCompany) {
      alert("Select a company to edit.");
      return;
    }

    isEditMode = true;
    saveBtn.disabled = false;
    hint.textContent = `Editing: ${selectedCompany}`;
  };

  /* =========================
     SAVE CHANGES
  ========================= */
  saveBtn.onclick = async () => {
    if (!isEditMode || !selectedCompany) return;

    const newName = input.value.trim().toUpperCase();
    if (!newName) return;

    if (window.companyCache.includes(newName) && newName !== selectedCompany) {
      alert("That company already exists.");
      return;
    }

    const idx = window.companyCache.indexOf(selectedCompany);
    window.companyCache[idx] = newName;

    await saveCompaniesToCloud(window.companyCache);
    renderCompanyManager();
  };

  /* =========================
     DELETE
  ========================= */
  deleteBtn.onclick = async () => {
    if (!selectedCompany) {
      alert("Select a company first.");
      return;
    }

    if (!confirm(`Delete "${selectedCompany}"?\n\nPast check-ins remain.`)) return;

    window.companyCache = window.companyCache.filter(c => c !== selectedCompany);
    await saveCompaniesToCloud(window.companyCache);
    renderCompanyManager();
  };
}

/* =========================================================
   EXPOSE
========================================================= */
window.renderCompanyManager = renderCompanyManager;
