console.log("Manage Companies Module Loaded");

// Storage key
const COMPANY_KEY = "ams_companies";

// Get companies
function getCompanies() {
  return JSON.parse(localStorage.getItem(COMPANY_KEY)) || [];
}

// Save companies
function saveCompanies(companies) {
  localStorage.setItem(COMPANY_KEY, JSON.stringify(companies));
}

// Render list
function renderCompanyManager() {
  const list = document.getElementById("companyList");
  if (!list) return;

  const companies = getCompanies();
  list.innerHTML = "";

  if (companies.length === 0) {
    list.innerHTML = "<p>No companies added yet.</p>";
    return;
  }

  companies.forEach((name, index) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.marginBottom = "8px";
    row.style.gap = "8px";

    const label = document.createElement("span");
    label.textContent = name;
    label.style.flex = "1";

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = () => {
      companies.splice(index, 1);
      saveCompanies(companies);
      renderCompanyManager();
    };

    row.appendChild(label);
    row.appendChild(del);
    list.appendChild(row);
  });
}

// Add company
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("addCompanyBtn");
  const input = document.getElementById("companyInput");

  if (!btn || !input) return;

  btn.addEventListener("click", () => {
    const name = input.value.trim();
    if (!name) return;

    const companies = getCompanies();
    companies.push(name);
    saveCompanies(companies);

    input.value = "";
    renderCompanyManager();
  });
});

// Expose for tab init
window.renderCompanyManager = renderCompanyManager;
