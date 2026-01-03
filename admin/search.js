console.log("Admin Search Module Loaded");
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(0, 0, 0, 0);
  return d;
}

document.addEventListener("DOMContentLoaded", () => {
  
  populateSearchCompanies();
  clearSearchTable();
});

// Make search globally accessible
window.runSearch = function () {
  const first = document.getElementById("filterFirstName")?.value.trim().toLowerCase();
  const last = document.getElementById("filterLastName")?.value.trim().toLowerCase();

  const companySelect = document.getElementById("searchFilterCompany");
  const companyText = document.getElementById("searchFilterCompanyText")?.value.trim().toLowerCase();
  const company =
    companySelect?.value === "__custom__"
      ? companyText
      : companySelect?.value.toLowerCase();

  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");
  // UX GUARD — prevent empty searches
if (!first && !last && !company && !range) {
  clearSearchTable();
  return;
}
  
  // DATE FILTER INPUTS
const range = document.getElementById("filterDateRange")?.value;
const startInput = document.getElementById("filterStartDate")?.value;
const endInput = document.getElementById("filterEndDate")?.value;
// DATE RANGE LOGIC (PREP ONLY)
const today = new Date();
today.setHours(0, 0, 0, 0);

let startDate = null;
let endDate = null;

switch (range) {
  case "today":
    startDate = new Date(today);
    endDate = new Date(today);
    break;

  case "yesterday":
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 1);
    endDate = new Date(startDate);
    break;

  case "thisWeek":
    startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay());
    endDate = new Date(today);
    break;

  case "lastWeek":
    startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - 7);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    break;

  case "thisMonth":
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today);
    break;

  case "lastMonth":
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    break;

  case "thisYear":
    startDate = new Date(today.getFullYear(), 0, 1);
    endDate = new Date(today);
    break;

  case "lastYear":
    startDate = new Date(today.getFullYear() - 1, 0, 1);
    endDate = new Date(today.getFullYear() - 1, 11, 31);
    break;

  case "custom":
    if (startInput) startDate = normalizeDate(startInput);
    if (endInput) endDate = normalizeDate(endInput);
    break;
}
  const filtered = logs.filter(entry => {
  // Normalize log date
  const logDate = normalizeDate(entry.date);
  if (!logDate) return false;

  // Apply date range
  if (startDate && logDate < startDate) return false;
  if (endDate && logDate > endDate) return false;

  // Name filters
  if (first && !entry.firstName?.toLowerCase().includes(first)) return false;
  if (last && !entry.lastName?.toLowerCase().includes(last)) return false;

  // Company filter
  if (company && entry.company?.toLowerCase() !== company) return false;

  return true;
});


  renderSearchResults(filtered);
};

function renderSearchResults(results) {
  const table = document.getElementById("searchResultsTable");
  const counter = document.getElementById("searchResultCount");
  if (!table) return;

  table.innerHTML = "";

  if (counter) {
    counter.textContent =
      results.length === 0
        ? "No results found"
        : `${results.length} result${results.length > 1 ? "s" : ""} found`;
  }

  if (results.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;opacity:.6;">
          No matching records
        </td>
      </tr>
    `;
    return;
  }

  results.forEach(r => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.date || ""}</td>
      <td>${r.time || ""}</td>
      <td>${r.firstName || ""}</td>
      <td>${r.lastName || ""}</td>
      <td>${r.company || ""}</td>
      <td>${r.reason || ""}</td>
      <td>${r.signature ? "✔" : ""}</td>
    `;
    table.appendChild(row);
  });
}

function populateSearchCompanies() {
  const select = document.getElementById("searchFilterCompany");
  if (!select) return;

  select.innerHTML = `
    <option value="">All Companies</option>
    <option value="__custom__">Type Company (Custom)</option>
  `;

  const companies = JSON.parse(localStorage.getItem("ams_companies") || "[]");

  companies.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name.toLowerCase();
    opt.textContent = name;
    select.appendChild(opt);
  });
}

function clearSearchTable() {
  const table = document.getElementById("searchResultsTable");
  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center; opacity:.6;">
        Use filters and click Search to view records
      </td>
    </tr>
  `;
}
window.toggleSearchCompanyText = function (value) {
  const input = document.getElementById("searchFilterCompanyText");
  if (!input) return;

  if (value === "__custom__") {
    input.style.display = "block";
    input.focus();
  } else {
    input.style.display = "none";
    input.value = "";
  }
};
// UX: Press Enter to trigger Search
document.addEventListener("keydown", function (e) {
  if (e.key !== "Enter") return;

  const el = document.activeElement;
  if (!el) return;

  const allowedIds = [
    "filterFirstName",
    "filterLastName",
    "searchFilterCompanyText",
    "filterStartDate",
    "filterEndDate"
  ];

  if (allowedIds.includes(el.id)) {
    e.preventDefault();
    if (typeof window.runSearch === "function") {
      window.runSearch();
    }
  }
});

