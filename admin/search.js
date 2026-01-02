console.log("✅ Search Log module loaded");

/* =========================================================
   STORAGE
========================================================= */
function getLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

let lastSearchResults = [];
let currentSearchResults = [];

/* =========================================================
   UI HELPERS (COMPANY TOGGLE)
========================================================= */
window.toggleSearchCompanyInput = function (value) {
  const select = document.getElementById("searchFilterCompany");
  const text = document.getElementById("searchFilterCompanyText");

  if (!select || !text) return;

  if (value === "__custom__") {
    select.style.display = "none";
    text.style.display = "block";
    text.value = "";
    text.focus();
  } else {
    text.value = "";
    text.style.display = "none";
    select.style.display = "block";
  }
};

function syncCompanySearchUI() {
  const select = document.getElementById("searchFilterCompany");
  const text = document.getElementById("searchFilterCompanyText");

  if (!select || !text) return;

  if (text.value.trim() === "") {
    text.style.display = "none";
    select.style.display = "block";
    select.value = "";
  }
}

/* =========================================================
   COMPANY DROPDOWN (FROM MANAGE COMPANIES)
========================================================= */
function populateSearchCompanyDropdown() {
  const select = document.getElementById("searchFilterCompany");
  if (!select) return;

  select.innerHTML = `
    <option value="">All Companies</option>
    <option value="__custom__">Type Company (Custom)</option>
  `;

  const companies = JSON.parse(localStorage.getItem("ams_companies") || "[]");

  companies.forEach(company => {
    const opt = document.createElement("option");
    opt.value = company;
    opt.textContent = company;
    select.appendChild(opt);
  });
}

/* =========================================================
   SEARCH LOGIC
========================================================= */
window.runSearch = function () {
  populateSearchCompanyDropdown();

  const first = document.getElementById("filterFirstName")?.value.trim().toLowerCase();
  const last = document.getElementById("filterLastName")?.value.trim().toLowerCase();
  const typedCompany = document.getElementById("searchFilterCompanyText")?.value.trim().toLowerCase();
  const selectedCompany = document.getElementById("searchFilterCompany")?.value;
  const range = document.getElementById("filterDateRange")?.value;

  const hasSearch =
    first || last || typedCompany || (selectedCompany && selectedCompany !== "");

  const tbody = document.getElementById("searchResultsTable");
  if (!tbody) return;

  if (!hasSearch) {
    tbody.innerHTML = "";
    return;
  }

  const logs = getLogs();

  const results = logs.filter(entry => {
    if (!entry) return false;

    if (first && !entry.first?.toLowerCase().includes(first)) return false;
    if (last && !entry.last?.toLowerCase().includes(last)) return false;

    if (typedCompany) {
      if ((entry.company || "").toLowerCase() !== typedCompany) return false;
    }

    if (selectedCompany && selectedCompany !== "__custom__" && selectedCompany !== "") {
      if ((entry.company || "").toLowerCase() !== selectedCompany.toLowerCase()) return false;
    }

    return true;
  });

  lastSearchResults = results;
  currentSearchResults = results;
  renderSearchResults(results);
};

/* =========================================================
   RENDER TABLE
========================================================= */
function renderSearchResults(results) {
  const tbody = document.getElementById("searchResultsTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!results.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;opacity:.6;">No results found</td>
      </tr>
    `;
    return;
  }

  results.forEach(entry => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.date || ""}</td>
      <td>${entry.time || ""}</td>
      <td>${entry.first || ""}</td>
      <td>${entry.last || ""}</td>
      <td>${entry.company || ""}</td>
      <td>${entry.reason || ""}</td>
      <td>${Array.isArray(entry.services) ? entry.services.join(", ") : entry.services || ""}</td>
      <td>${entry.signature ? `<img src="${entry.signature}" style="height:40px;">` : ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================================================
   CLEAR SEARCH
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  populateSearchCompanyDropdown();

  const text = document.getElementById("searchFilterCompanyText");
  if (text) {
    text.addEventListener("input", syncCompanySearchUI);
  }

  const clearBtn = document.getElementById("clearSearch");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      [
        "filterFirstName",
        "filterLastName",
        "searchFilterCompanyText"
      ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

      const select = document.getElementById("searchFilterCompany");
      if (select) {
        select.value = "";
        select.style.display = "block";
      }

      if (text) text.style.display = "none";

      const tbody = document.getElementById("searchResultsTable");
      if (tbody) tbody.innerHTML = "";
    });
  }
});
