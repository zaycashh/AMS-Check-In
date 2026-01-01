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
        style="width:100%; padding:10px; margin-bottom:10px;"
      />
      <button id="addCompanyBtn" class="primary-btn">Add Company</button>
    </div>

    <div id="companyList"></div>
  `;

  const list = container.querySelector("#companyList");

  if (!companies.length) {
    list.innerHTML = "<p>No companies added yet.</p>";
    return;
  }

  list.innerHTML = companies
    .map(
      (c, i) => `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span style="flex:1;">${c}</span>
          <button class="secondary-btn edit-company" data-index="${i}">Edit</button>
          <button class="secondary-btn delete-company" data-index="${i}">Delete</button>
        </div>
      `
    )
    .join("");

  // ADD
  document.getElementById("addCompanyBtn").onclick = () => {
  const input = document.getElementById("companyInput");
  const name = input.value.trim();

  if (!name) return;

  // prevent duplicates
  if (companies.some(c => c.toLowerCase() === name.toLowerCase())) {
    alert("Company already exists.");
    return;
  }

  companies.push(name);
  saveCompanies(companies);
  input.value = "";

  renderCompanyManager();
  window.populateCompanyDropdown?.();
};

  // EDIT
  container.querySelectorAll(".edit-company").forEach(btn => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      const updated = prompt("Edit company name:", companies[index]);
      if (!updated) return;

      companies[index] = updated.trim();
      saveCompanies(companies);
      renderCompanyManager();
      window.populateCompanyDropdown?.();
    };
  });

  // DELETE
  container.querySelectorAll(".delete-company").forEach(btn => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      if (!confirm("Delete this company?")) return;

      companies.splice(index, 1);
      saveCompanies(companies);
      renderCompanyManager();
      window.populateCompanyDropdown?.();
    };
  });
}

window.renderCompanyManager = renderCompanyManager;
