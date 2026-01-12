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

  let companies = companyCache || await fetchCompanies();

  // CLEAN + DEDUPE + SORT
  companies = Array.from(
    new Set(companies.map(c => c.trim().toUpperCase()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  companyCache = companies;
    
    container.innerHTML = `
  <h2 class="section-title">Manage Companies</h2>

  <div style="max-width:500px;margin-bottom:20px;">
    <input
      id="companyInput"
      type="text"
      placeholder="Enter company name"
      style="width:100%;padding:12px;margin-bottom:12px;"
    />
    <button id="addCompanyBtn" class="primary-btn" type="button">
      Add Company
    </button>
  </div>

  <div style="max-width:500px;">
    <select id="companySelect" style="width:100%;padding:12px;">
      <option value="">-- Select Company --</option>
      ${companies.map(c => `<option value="${c}">${c}</option>`).join("")}
    </select>

    <div style="margin-top:12px;">
      <button id="editCompanyBtn" class="secondary-btn">Edit</button>
      <button id="deleteCompanyBtn" class="secondary-btn">Delete</button>
    </div>
  </div>
`;


  // ADD COMPANY
  container.querySelector("#addCompanyBtn").onclick = () => {
    const input = container.querySelector("#companyInput");
    let name = input.value.trim().toUpperCase();
    if (!name) return;

    if (companies.includes(name)) {
      alert("Company already exists.");
      return;
    }

    companies.push(name);
    saveCompaniesToCloud(companies);
    input.value = "";
    renderCompanyManager();
  };

  // EDIT / DELETE
  const select = container.querySelector("#companySelect");

  if (select) {
    container.querySelector("#editCompanyBtn").onclick = () => {
      const current = select.value;
      let updated = prompt("Edit company name:", current);
      if (!updated) return;

      updated = updated.trim().toUpperCase();
      if (companies.includes(updated)) {
        alert("Company already exists.");
        return;
      }

      companies[companies.indexOf(current)] = updated;
      saveCompaniesToCloud(companies);
      renderCompanyManager();
    };

    container.querySelector("#deleteCompanyBtn").onclick = () => {
      const current = select.value;
      if (!confirm(`Delete "${current}"?`)) return;

      companies = companies.filter(c => c !== current);
      saveCompaniesToCloud(companies);
      renderCompanyManager();
    };
  }
}

/* =========================================================
   EXPOSE GLOBALLY (THIS WAS MISSING / BROKEN)
========================================================= */
window.renderCompanyManager = renderCompanyManager;
