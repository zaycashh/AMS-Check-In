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
  const first = document
    .getElementById("filterFirstName")
    ?.value.trim()
    .toLowerCase();

  const last = document
    .getElementById("filterLastName")
    ?.value.trim()
    .toLowerCase();

  const companySelect = document.getElementById("searchFilterCompany");
  const companyText = document
    .getElementById("searchFilterCompanyText")
    ?.value.trim()
    .toLowerCase();

  const company =
    companySelect?.value === "__custom__"
      ? companyText
      : companySelect?.value.toLowerCase();

  const range = document.getElementById("filterDateRange")?.value;
  const startInput = document.getElementById("filterStartDate")?.value;
  const endInput = document.getElementById("filterEndDate")?.value;

  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

  /* ===============================
     DATE RANGE PREP
  =============================== */
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
  // ✅ Ensure endDate includes the full day
if (endDate) {
  endDate.setHours(23, 59, 59, 999);
}

  /* ===============================
     FILTER LOGS
  =============================== */
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

  /* ===============================
     SORT — NEWEST → OLDEST
  =============================== */
  filtered.sort((a, b) => {
    const ta = a.timestamp || new Date(a.date).getTime();
    const tb = b.timestamp || new Date(b.date).getTime();
    return tb - ta;
  });

  window.searchResults = filtered;
  renderSearchResults(filtered);
}; // ✅ CLOSE runSearch

/* =========================================================
   RENDER RESULTS
========================================================= */
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
      <td>
        ${
          r.signature
            ? `<img src="${r.signature}" style="width:120px;height:40px;object-fit:contain;border:1px solid #ccc;background:#fff;">`
            : ""
        }
      </td>`;
    table.appendChild(row);
  });
}

/* =========================================================
   COMPANY DROPDOWN
========================================================= */
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

/* =========================================================
   CLEAR SEARCH
========================================================= */
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

/* =========================================================
   KEYBOARD SEARCH
========================================================= */
document.addEventListener("keydown", e => {
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
    window.runSearch();
  }
});

/* =========================================================
   CUSTOM DATE TOGGLE
========================================================= */
window.toggleCustomDateRange = function (value) {
  const wrapper = document.getElementById("customDateRange");
  const start = document.getElementById("filterStartDate");
  const end = document.getElementById("filterEndDate");

  if (!wrapper) return;

  if (value === "custom") {
    wrapper.style.display = "block";
    start?.focus();
  } else {
    wrapper.style.display = "none";
    if (start) start.value = "";
    if (end) end.value = "";
  }
};

/* =========================================================
   CLEAR BUTTON
========================================================= */
window.clearSearch = function () {
  document.getElementById("filterFirstName").value = "";
  document.getElementById("filterLastName").value = "";

  const companySelect = document.getElementById("searchFilterCompany");
  const companyText = document.getElementById("searchFilterCompanyText");

  if (companySelect) companySelect.value = "";
  if (companyText) {
    companyText.value = "";
    companyText.style.display = "none";
  }

  const dateRange = document.getElementById("filterDateRange");
  if (dateRange) dateRange.value = "";

  document.getElementById("filterStartDate").value = "";
  document.getElementById("filterEndDate").value = "";

  window.searchResults = [];
  clearSearchTable();
};

/* =========================================================
   EXPORT PDF
========================================================= */
function exportSearchPdf() {
  const records = window.searchResults || [];
  if (!records.length) {
    alert("Please run a search before exporting the PDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  doc.setFillColor(30, 94, 150);
  doc.rect(0, 0, doc.internal.pageSize.width, 32, "F");

  const logoImg = document.getElementById("amsLogoBase64");
  if (logoImg && logoImg.complete) {
    const c = document.createElement("canvas");
    c.width = logoImg.naturalWidth;
    c.height = logoImg.naturalHeight;
    c.getContext("2d").drawImage(logoImg, 0, 0);
    doc.addImage(c.toDataURL("image/png"), "PNG", 14, 8, 32, 22);
  }

  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("AMS Search Log Report", 55, 21);
  doc.setTextColor(0);

  const tableData = records.map(r => [
    r.date || "",
    r.time || "",
    r.first || r.firstName || "",
    r.last || r.lastName || "",
    r.company || "",
    r.reason || "",
    ""
  ]);

  doc.autoTable({
    head: [["Date", "Time", "First", "Last", "Company", "Reason", "Signature"]],
    body: tableData,
    didDrawCell: data => {
      if (data.column.index === 6) {
        const rec = records[data.row.index];
        if (rec.signature) {
          doc.addImage(rec.signature, "PNG", data.cell.x + 5, data.cell.y + 2, 35, 12);
        }
      }
    }
  });

  doc.save(`AMS_Search_Log_${new Date().toISOString().split("T")[0]}.pdf`);
}

/* =========================================================
   EXPORT EXCEL
========================================================= */
function exportSearchLogExcel() {
  const results = window.searchResults || [];
  if (!results.length) {
    alert("No records to export.");
    return;
  }

  const data = results.map(r => ({
    Date: r.date || "",
    Time: r.time || "",
    "First Name": (r.firstName || r.first || "").toUpperCase(),
    "Last Name": (r.lastName || r.last || "").toUpperCase(),
    Company: r.company || "",
    Reason: r.reason || "",
    Signature: r.signature ? "Signed" : "—"
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Search Log");
  XLSX.writeFile(wb, `AMS_Search_Log_${new Date().toISOString().split("T")[0]}.xlsx`);
}
