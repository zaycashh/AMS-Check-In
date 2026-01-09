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

    <div id="companyList"></div>
  `;

  const list = container.querySelector("#companyList");

  if (companies.length === 0) {
    list.innerHTML = `<p>No companies added yet.</p>`;
  } else {
    list.innerHTML = companies
      .map(
        (company, index) => `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span>${company}</span>
          <div>
            <button
              class="secondary-btn edit-company"
              data-index="${index}"
              style="margin-right:6px;"
            >
              Edit
            </button>
            <button
              class="secondary-btn delete-company"
              data-index="${index}"
            >
              Delete
            </button>
          </div>
        </div>
      `
      )
      .join("");
  }

  /* =========================
     ADD COMPANY (NO DUPES)
  ========================= */
  container.querySelector("#addCompanyBtn").onclick = () => {
    const input = container.querySelector("#companyInput");
    let name = input.value.trim();
    if (!name) return;

    name = name.toUpperCase();

    const exists = companies.some(
      c => c.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert("This company already exists.");
      return;
    }

    companies.push(name);
    saveCompaniesToCloud(companies);
    input.value = "";
    renderCompanyManager();
  };

  /* =========================
     DELETE COMPANY
  ========================= */
  container.querySelectorAll(".delete-company").forEach(btn => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      const companyName = companies[index];

      if (
        !confirm(
          `Delete "${companyName}"?\n\nPast check-ins will NOT be removed.`
        )
      )
        return;

      companies.splice(index, 1);
      saveCompaniesToCloud(companies);
      renderCompanyManager();
    };
  });

  /* =========================
     EDIT COMPANY (NO DUPES)
  ========================= */
  container.querySelectorAll(".edit-company").forEach(btn => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      const current = companies[index];

      let updated = prompt("Edit company name:", current);
      if (!updated) return;

      updated = updated.trim().toUpperCase();

      const exists = companies.some(
        (c, i) =>
          c.toLowerCase() === updated.toLowerCase() && i !== index
      );

      if (exists) {
        alert("A company with this name already exists.");
        return;
      }

      companies[index] = updated;
      saveCompaniesToCloud(companies);
      renderCompanyManager();
    };
  });
}

/* =========================================================
   EXPOSE GLOBALLY
========================================================= */
window.renderCompanyManager = renderCompanyManager;
