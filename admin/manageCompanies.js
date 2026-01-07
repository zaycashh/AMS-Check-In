console.log("Manage Companies Module Loaded");

/* =========================================================
   STORAGE HELPERS
========================================================= */
function getCompanies() {
  return JSON.parse(localStorage.getItem("ams_companies")) || [];
}

function saveCompanies(companies) {
  localStorage.setItem("ams_companies", JSON.stringify(companies));
}

/* =========================================================
   RENDER MANAGER
========================================================= */
function renderCompanyManager() {
  const container = document.getElementById("tabManage");
  if (!container) return;

  const companies = getCompanies();

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
     ADD COMPANY
  ========================= */
  container.querySelector("#addCompanyBtn").onclick = () => {
    const input = container.querySelector("#companyInput");
    const name = input.value.trim();
    if (!name) return;

    companies.push(name);
    saveCompanies(companies);
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

    const confirmDelete = confirm(
      `Are you sure you want to delete "${companyName}"?\n\nThis will NOT remove past check-ins.`
    );

    if (!confirmDelete) return;

    companies.splice(index, 1);
    saveCompanies(companies);
    renderCompanyManager();
  };
});
   
   /* =========================
     EDIT COMPANY
  ========================= */
  container.querySelectorAll(".edit-company").forEach(btn => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      const current = companies[index];

      const updated = prompt("Edit company name:", current);
      if (!updated) return;

      companies[index] = updated.trim();
      saveCompanies(companies);
      renderCompanyManager();
    };
  });
}

/* =========================================================
   EXPOSE GLOBALLY
========================================================= */
window.renderCompanyManager = renderCompanyManager;
