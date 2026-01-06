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

  const range = document.getElementById("filterDateRange")?.value;
  const startInput = document.getElementById("filterStartDate")?.value;
  const endInput = document.getElementById("filterEndDate")?.value;

  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

  // DATE RANGE PREP
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
    // Normalize log datetime safely
    const logTime = entry.timestamp
      ? new Date(entry.timestamp)
      : new Date(`${entry.date} ${entry.time || "00:00"}`);

    logTime.setSeconds(0, 0);

    if (startDate && logTime < startDate) return false;
    if (endDate && logTime > endDate) return false;

    const entryFirst = entry.firstName || entry.first || entry.fname || "";
    const entryLast = entry.lastName || entry.last || entry.lname || "";

    if (first && !entryFirst.toLowerCase().includes(first)) return false;
    if (last && !entryLast.toLowerCase().includes(last)) return false;

    if (
      company &&
      company !== "" &&
      !entry.company?.toLowerCase().includes(company)
    ) return false;

    return true;
  });

  // SORT — NEWEST → OLDEST
  filtered.sort((a, b) => {
    const ta = a.timestamp || new Date(a.date).getTime();
    const tb = b.timestamp || new Date(b.date).getTime();
    return tb - ta;
  });

  window.searchResults = filtered;
  renderSearchResults(filtered);
}; // ✅ CLOSE runSearch

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
      </tr>`;
    return;
  }

  results.forEach(r => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.date || ""}</td>
      <td>${r.time || ""}</td>
      <td>${r.firstName || r.first || r.fname || ""}</td>
      <td>${r.lastName || r.last || r.lname || ""}</td>
      <td>${r.company || ""}</td>
      <td>${r.reason || ""}</td>
      <td>${
        r.signature
          ? `<img src="${r.signature}" style="width:120px;height:40px;object-fit:contain;border:1px solid #ccc;background:#fff;">`
          : ""
      }</td>`;
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
  const counter = document.getElementById("searchResultCount");
  if (!table) return;

  if (counter) counter.textContent = "";

  table.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center;opacity:.6;">
        Use filters and click Search to view records
      </td>
    </tr>`;
}
