console.log("Manage Companies Module Loaded");

// STORAGE KEY
const COMPANY_KEY = "ams_companies";

// GET COMPANIES
function getCompanies() {
  return JSON.parse(localStorage.getItem(COMPANY_KEY)) || [];
}

// SAVE COMPANIES
function saveCompanies(companies) {
  localStorage.setItem(COMPANY_KEY, JSON.stringify(companies));
}

// RENDER LIST
function renderCompanyManager() {
  const list = document.getElementById("companyList");
  if (!list) return;

  const companies = getCompanies();
  list.innerHTML = "";

  if (companies.length === 0) {
    list.innerHTML = "<p style='color:#777;'>No companies added yet.</p>";
    return;
  }

  companies.forEach((name, index) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.marginBottom = "8px";

    row.innerHTML = `
      <span>${name}</span>
      <button data-index="${index}" class="danger-btn">Delete</button>
    `;

    list.appendChild(row);
  });

  // DELETE HANDLERS
  list.querySelectorAll(".danger-btn").forEach(btn => {
    btn.onclick = () => {
      const i = btn.dataset.index;
      const companies = getCompanies();
      companies.splice(i, 1);
      saveCompanies(companies);
      renderCompanyManager();
    };
  });
}

// ADD COMPANY
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("companyInput");
  const btn = document.getElementById("addCompanyBtn");

  if (!btn || !input) return;

  btn.addEventListener("click", () => {
    const name = input.value.trim();
    if (!name) return alert("Enter a company name");

    const companies = getCompanies();
    if (companies.includes(name)) {
      alert("Company already exists");
      return;
    }

    companies.push(name);
    saveCompanies(companies);
    input.value = "";
    renderCompanyManager();
  });

  // INITIAL RENDER
  renderCompanyManager();
});
