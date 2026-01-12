/* =========================================================
   CLOUD COMPANIES FETCH (WITH FALLBACK)
========================================================= */

// In-memory cache
let companyCache = null;

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
   MANAGE COMPANIES (SINGLE INPUT FIELD)
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

  /* =========================
     ADD / SAVE COMPANY
  ========================= */
  document.getElementById("saveCompanyBtn").onclick = async () => {
    const input = document.getElementById("companyInput");
    let name = input.value.trim().toUpperCase();
    if (!name) return;

    let companies = companyCache || await fetchCompanies();

    if (!companies.includes(name)) {
      companies.push(name);
    }

    await saveCompaniesToCloud(companies);
    renderCompanyManager();
  };

  /* =========================
     DELETE COMPANY
  ========================= */
  document.getElementById("deleteCompanyBtn").onclick = async () => {
    const input = document.getElementById("companyInput");
    const name = input.value.trim().toUpperCase();
    if (!name) return;

    let companies = companyCache || await fetchCompanies();

    if (!companies.includes(name)) {
      alert("Company not found.");
      return;
    }

    if (!confirm(`Delete "${name}"?\n\nPast check-ins will remain.`)) return;

    companies = companies.filter(c => c !== name);
    await saveCompaniesToCloud(companies);
    renderCompanyManager();
  };
}

/* =========================================================
   EXPOSE GLOBALLY
========================================================= */
window.renderCompanyManager = renderCompanyManager;
