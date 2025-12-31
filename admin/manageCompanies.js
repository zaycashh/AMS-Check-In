// admin/manageCompanies.js

const STORAGE_KEY = "ams_companies";

function getCompanies() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveCompanies(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderCompanyManager() {
  const listEl = document.getElementById("companyList");
  if (!listEl) return;

  const companies = getCompanies();
  listEl.innerHTML = "";

  if (companies.length === 0) {
    listEl.innerHTML = "<p style='opacity:.6'>No companies added yet.</p>";
    return;
  }

  companies.forEach((name, index) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.marginBottom = "8px";
    row.style.padding = "10px";
    row.style.border = "1px solid #ddd";
    row.style.borderRadius = "8px";

    const label = document.createElement("strong");
    label.textContent = name;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.background = "#d9534f";
    delBtn.style.color = "#fff";
    delBtn.style.border = "none";
    delBtn.style.padding = "6px 12px";
    delBtn.style.borderRadius = "6px";
    delBtn.style.cursor = "pointer";

    delBtn.onclick = () => {
      companies.splice(index, 1);
      saveCompanies(companies);
      renderCompanyManager();
    };

    row.appendChild(label);
    row.appendChild(delBtn);
    listEl.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("companyInput");
  const btn = document.getElementById("addCompanyBtn");

  if (!input || !btn) return;

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
});
