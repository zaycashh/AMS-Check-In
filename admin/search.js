/* =========================================================
   AMS ADMIN SEARCH LOG (CLEAN + STABLE)
========================================================= */

console.log("Admin Search Module Loaded");

/* =======================
   STATE (DECLARE ONCE)
======================= */
let lastSearchResults = [];
let currentSearchResults = [];
let lastSearchStartDate = null;
let lastSearchEndDate = null;

/* =======================
   HELPERS
======================= */
function getLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

// SAFEST date parser (prevents timezone bugs)
function parseEntryDate(entry) {
  if (!entry || !entry.date) return null;

  // Preferred: YYYY-MM-DD
  if (entry.date.includes("-")) {
    const [y, m, d] = entry.date.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  // Fallback: MM/DD/YYYY
  if (entry.date.includes("/")) {
    const [m, d, y] = entry.date.split("/").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  return null;
}

/* =======================
   CUSTOM DATE RANGE TOGGLE
======================= */
window.toggleCustomDateRange = function (value) {
  const box = document.getElementById("customDateRange");
  if (!box) return;
  box.style.display = value === "custom" ? "flex" : "none";
};

/* =======================
   MAIN SEARCH FUNCTION
======================= */
window.runSearch = function () {
  const logs = getLogs();

  const first = document.getElementById("filterFirstName")?.value.trim().toLowerCase();
  const last = document.getElementById("filterLastName")?.value.trim().toLowerCase();
  const company = document.getElementById("filterCompany")?.value;
  const range = document.getElementById("filterDateRange")?.value;

  const startInput = document.getElementById("filterStartDate")?.value;
  const endInput = document.getElementById("filterEndDate")?.value;

  let startDate = null;
  let endDate = null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (range === "today") {
    startDate = new Date(today);
    endDate = new Date(today);

  } else if (range === "yesterday") {
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 1);
    endDate = new Date(startDate);

  } else if (range === "thisWeek") {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    startDate = startOfWeek;
    endDate = endOfWeek;

  } else if (range === "thisMonth") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today);

  } else if (range === "custom" && startInput && endInput) {
    startDate = new Date(startInput);
    endDate = new Date(endInput);
  }

  if (startDate) startDate.setHours(0, 0, 0, 0);
  if (endDate) endDate.setHours(23, 59, 59, 999);

  lastSearchStartDate = startDate;
  lastSearchEndDate = endDate;

  const results = logs.filter(entry => {
    if (!entry) return false;

    if (first && !entry.first?.toLowerCase().includes(first)) return false;
    if (last && !entry.last?.toLowerCase().includes(last)) return false;

    if (company && company !== "All Companies") {
      if (!entry.company?.toLowerCase().includes(company.toLowerCase())) return false;
    }

    if (startDate && endDate) {
      const d = parseEntryDate(entry);
      if (!d || d < startDate || d > endDate) return false;
    }

    return true;
  });

  lastSearchResults = results;
  currentSearchResults = results;

  renderSearchResults(results);
};

/* =======================
   CLEAR FILTERS
======================= */
const clearBtn = document.getElementById("clearSearch");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    document.getElementById("filterFirstName").value = "";
    document.getElementById("filterLastName").value = "";
    document.getElementById("filterCompany").value = "All Companies";
    document.getElementById("filterDateRange").value = "";
    toggleCustomDateRange("");

    const customStart = document.getElementById("filterStartDate");
    const customEnd = document.getElementById("filterEndDate");
    if (customStart) customStart.value = "";
    if (customEnd) customEnd.value = "";

    lastSearchResults = [];
    currentSearchResults = [];

    renderSearchResults([]);
  });
};

/* =======================
   EXCEL EXPORT
======================= */
const exportExcelBtn = document.getElementById("exportExcel");
if (exportExcelBtn) {
  exportExcelBtn.onclick = () => {
    if (!Array.isArray(lastSearchResults) || lastSearchResults.length === 0) {
      alert("Run a search before exporting.");
      return;
    }

    const rows = lastSearchResults.map(r => ({
      Date: r.date || "",
      Time: r.time || "",
      First: r.first || "",
      Last: r.last || "",
      Company: r.company || "",
      Reason: r.reason || "",
      Services: Array.isArray(r.services) ? r.services.join(", ") : "",
      Signature: r.signature ? "Yes" : ""
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Search Log");

    XLSX.writeFile(wb, "AMS_Search_Log.xlsx");
  };
};
function renderSearchResults(results) {
  const container = document.getElementById("searchResults");
  if (!container) return;

  if (!Array.isArray(results) || results.length === 0) {
    container.innerHTML = "<p>No results found.</p>";
    return;
  }

  let html = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>First</th>
          <th>Last</th>
          <th>Company</th>
          <th>Reason</th>
          <th>Services</th>
          <th>Signature</th>
        </tr>
      </thead>
      <tbody>
  `;

  results.forEach(r => {
    html += `
      <tr>
        <td>${r.date || ""}</td>
        <td>${r.time || ""}</td>
        <td>${r.first || ""}</td>
        <td>${r.last || ""}</td>
        <td>${r.company || ""}</td>
        <td>${r.reason || ""}</td>
        <td>${Array.isArray(r.services) ? r.services.join(", ") : (r.services || "")}</td>
        <td>
  ${
    r.signature
      ? `<img src="${r.signature}"
        style="width:90px; height:40px; object-fit:contain; border:1px solid #ccc;" />`
      : ""
  }
</td>

      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}
// =====================================================
// Company Custom Input Toggle (Search Log)
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  const companySelect = document.getElementById("filterCompany");
  const companyInput = document.getElementById("filterCompanyText");

  if (!companySelect || !companyInput) return;

  function toggleCompanyInput() {
    if (companySelect.value === "__custom__") {
      companyInput.style.display = "block";
      companyInput.disabled = false;
      companyInput.readOnly = false;
      companyInput.focus();
    } else {
      companyInput.style.display = "none";
      companyInput.value = "";
      companyInput.readOnly = true;
    }
  }

  // Run when dropdown changes
  companySelect.addEventListener("change", toggleCompanyInput);

  // Run once on page load (handles pre-selected value)
  toggleCompanyInput();
});
