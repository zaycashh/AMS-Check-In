/* =========================================================
   CLOUD COMPANIES FETCH (WITH FALLBACK)
========================================================= */

// 🔒 In-memory cache to prevent UI wipe on re-render
let companyCache = null;

async function fetchCompanies() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/companies"
    );

    if (!res.ok) throw new Error("Cloud fetch failed");

    const companies = await res.json();

    // Cache locally for offline use
    localStorage.setItem("ams_companies", JSON.stringify(companies));
    companyCache = companies;

    console.log("☁️ Companies loaded from cloud:", companies.length);
    return companies;
  } catch (err) {
    console.warn("⚠️ Using local companies");

    const local = JSON.parse(
      localStorage.getItem("ams_companies") || "[]"
    );

    companyCache = local;
    return local;
  }
}

/* =========================================================
   CLOUD SAVE
========================================================= */
async function saveCompaniesToCloud(companies) {
  // Always save locally
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
   RENDER MANAGER
========================================================= */
async function renderCompanyManager() {
  const container = document.getElementById("tabCompanies");
  if (!container) return;

  let companies;

  // ✅ Fetch from cloud ONCE, then trust cache
  if (!companyCache) {
    companies = await fetchCompanies();
  } else {
    companies = companyCache;
  }

  // ✅ CLEANUP: TRIM → CAPS → DEDUPE → SORT
  companies = Array.from(
    new Set(
      companies
        .map(c => c.trim().toUpperCase())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  companyCache = companies;

  container.innerHTML = `
  <h2 class="section-title">Manage Companies</h2>

  <div style="max-width:520px;margin-bottom:20px;">
    <label style="display:block;margin-bottom:6px;">Select Company</label>
    <select id="companySelect" style="width:100%;padding:12px;">
      <option value="">-- Select Company --</option>
      ${companies.map(c => `<option value="${c}">${c}</option>`).join("")}
    </select>
  </div>

  <div style="max-width:520px;margin-bottom:20px;">
    <input
      id="companyInput"
      type="text"
      placeholder="Enter new / updated company name"
      style="width:100%;padding:12px;margin-bottom:12px;"
    />

    <div style="display:flex;gap:10px;">
      <button id="addCompanyBtn" class="primary-btn" type="button">
        Add
      </button>
      <button id="editCompanyBtn" class="secondary-btn" type="button">
        Edit
      </button>
      <button id="deleteCompanyBtn" class="secondary-btn" type="button">
        Delete
      </button>
    </div>
  </div>
`;

const select = container.querySelector("#companySelect");
const input = container.querySelector("#companyInput");

/* =========================
   ADD COMPANY
========================= */
container.querySelector("#addCompanyBtn").onclick = () => {
  let name = input.value.trim();
  if (!name) return;

  name = name.toUpperCase();

  if (companies.some(c => c === name)) {
    alert("This company already exists.");
    return;
  }

  companies.push(name);
  saveCompaniesToCloud(companies);
  renderCompanyManager();
};

/* =========================
   EDIT COMPANY
========================= */
container.querySelector("#editCompanyBtn").onclick = () => {
  const selected = select.value;
  if (!selected) return alert("Select a company first.");

  let updated = input.value.trim().toUpperCase();
  if (!updated) return;

  if (companies.includes(updated) && updated !== selected) {
    alert("Company already exists.");
    return;
  }

  const index = companies.indexOf(selected);
  companies[index] = updated;

  saveCompaniesToCloud(companies);
  renderCompanyManager();
};

/* =========================
   DELETE COMPANY
========================= */
container.querySelector("#deleteCompanyBtn").onclick = () => {
  const selected = select.value;
  if (!selected) return alert("Select a company first.");

  if (!confirm(`Delete "${selected}"?\n\nPast check-ins will NOT be removed.`))
    return;

  companies = companies.filter(c => c !== selected);
  saveCompaniesToCloud(companies);
  renderCompanyManager();
};

/* =========================================================
   EXPOSE GLOBALLY
========================================================= */
window.renderCompanyManager = renderCompanyManager;
