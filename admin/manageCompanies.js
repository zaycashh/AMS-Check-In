console.log("Manage Companies Module Loaded");

function getCompanies() {
  return JSON.parse(localStorage.getItem("ams_companies")) || [];
}

function saveCompanies(companies) {
  localStorage.setItem("ams_companies", JSON.stringify(companies));
}

function renderCompanyManager() {
  const container = document.getElementById("tabManage");
  if (!container) return;

  const companies = getCompanies();

  container.innerHTML = `
    <h2 class="section-title">Manage Companies</h2>

    <div style="max-width:500px; margin-bottom:20px;">
      <input
        id="companyInput"
        type="text"
        placeholder="Enter company name"
        style="width:100%; padding:12px; margin-bottom:12px;"
      />
      <button
        id="addCompanyBtn"
        type="button"
        class="primary-btn"
      >
        Add Company
      </button>
    </div>

    <div id="companyList"></div>
  `;

  const list = container.querySelector("#companyList");

  if (companies.length === 0) {
    list.innerHTML = companies
  .map((c, i) => `
    <div class="company-row" style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
      
      <input
        type="text"
        class="company-edit-input"
        data-index="${i}"
        value="${c}"
        disabled
        style="flex:1; padding:6px;"
      />

      <button
        class="secondary-btn edit-company"
        data-index="${i}"
      >
        Edit
      </button>

      <button
        class="secondary-btn delete-company"
        data-index="${i}"
      >
        Delete
      </button>

    </div>
  `)
  .join("");


  // ADD COMPANY
  container.querySelector("#addCompanyBtn").onclick = () => {
    const input = container.querySelector("#companyInput");
    const name = input.value.trim();
    if (!name) return;

    companies.push(name);
    saveCompanies(companies);
    input.value = "";
    renderCompanyManager();
  };

  // DELETE COMPANY
  container.querySelectorAll(".delete-company").forEach(btn => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      companies.splice(index, 1);
      saveCompanies(companies);
      renderCompanyManager();
    };
  });
}
// EDIT COMPANY
container.querySelectorAll(".edit-company").forEach(btn => {
  btn.onclick = () => {
    const index = Number(btn.dataset.index);
    const input = container.querySelector(
      `.company-edit-input[data-index="${index}"]`
    );

    if (!input) return;

    // SAVE MODE
    if (!input.disabled) {
      const newName = input.value.trim();
      if (!newName) {
        alert("Company name cannot be empty");
        return;
      }

      companies[index] = newName;
      saveCompanies(companies);
      renderCompanyManager();
      return;
    }

    // EDIT MODE
    input.disabled = false;
    input.focus();
  };
});

// expose globally
window.renderCompanyManager = renderCompanyManager;
