console.log("Manage Companies Module Loaded");

// ==============================
// STORAGE HELPERS
// ==============================
function getCompanies() {
  return JSON.parse(localStorage.getItem("ams_companies") || "[]");
}

function saveCompanies(companies) {
  localStorage.setItem("ams_companies", JSON.stringify(companies));
}

// ==============================
// RENDER COMPANY MANAGER
// ==============================
function renderCompanyManager() {
  const container = document.getElementById("companyList");
  if (!container) return;

  const companies = getCompanies();

  if (companies.length === 0) {
    container.innerHTML = "<p style='opacity:.6;'>No companies added yet.</p>";
    return;
  }

  let html = `
    <table class="log-table">
      <thead>
        <tr>
          <th>Company</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  companies.forEach((c, index) => {
    html += `
      <tr>
        <td>
          <input
            type="text"
            value="${c.name}"
            onchange="updateCompany(${index}, this.value)"
          />
        </td>
        <td>
          <button onclick="deleteCompany(${index})">Delete</button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

// ==============================
// ACTIONS
// ==============================
function addCompany() {
  const input = document.getElementById("newCompanyName");
  if (!input) return;

  const name = input.value.trim().toUpperCase();
  if (!name) return;

  let companies = getCompanies();

  if (companies.some(c => c.name === name)) {
    alert("Company already exists.");
    return;
  }

  companies.push({
    id: name.toLowerCase().replace(/\s+/g, "_"),
    name
  });

  saveCompanies(companies);
  input.value = "";
  renderCompanyManager();
  populateCompanyDropdown();
}

function updateCompany(index, newName) {
  let companies = getCompanies();
  companies[index].name = newName.toUpperCase();
  saveCompanies(companies);
  populateCompanyDropdown();
}

function deleteCompany(index) {
  if (!confirm("Delete this company?")) return;
  let companies = getCompanies();
  companies.splice(index, 1);
  saveCompanies(companies);
  renderCompanyManager();
  populateCompanyDropdown();
}

// ==============================
// INIT
// ==============================
document
  .getElementById("addCompanyBtn")
  ?.addEventListener("click", addCompany);

renderCompanyManager();
