console.log("✅ Search Log module loaded");

/* =========================================================
   BASIC STORAGE
========================================================= */
function getLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

let lastSearchResults = [];
let currentSearchResults = [];

/* =========================================================
   DATE HELPERS
========================================================= */
function normalizeDate(dateStr) {
  if (!dateStr) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00");
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [m, d, y] = dateStr.split("/");
    return new Date(y, m - 1, d);
  }

  return null;
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRange(startDate, endDate) {
  return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;
}

/* =========================================================
   UI HELPERS
========================================================= */
window.toggleSearchCompanyText = function (value) {
  const select = document.getElementById("searchFilterCompany");
  const input = document.getElementById("searchFilterCompanyText");

  if (!select || !input) return;

  if (value === "__custom__") {
    select.style.display = "none";
    input.style.display = "block";
    input.disabled = false;
    setTimeout(() => input.focus(), 0);
  } else {
    select.style.display = "block";
    input.style.display = "none";
    input.value = "";
    input.disabled = true;
  }
};

window.toggleCustomDateRange = function (value) {
  const custom = document.getElementById("customDateRange");
  if (custom) custom.style.display = value === "custom" ? "block" : "none";
};

/* =========================================================
   GLOBAL DATE RANGE (PDF)
========================================================= */
let lastSearchStartDate = null;
let lastSearchEndDate = null;

/* =========================================================
   MAIN SEARCH
========================================================= */
window.runSearch = function () {
  const logs = getLogs();

  const first = document.getElementById("filterFirstName").value.trim().toLowerCase();
  const last = document.getElementById("filterLastName").value.trim().toLowerCase();
  const typedCompany = document.getElementById("searchFilterCompanyText")?.value.trim().toLowerCase();

  const range = document.getElementById("filterDateRange").value;
  const startInput = document.getElementById("filterStartDate")?.value;
  const endInput = document.getElementById("filterEndDate")?.value;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate = null;
  let endDate = null;

  switch (range) {
    case "today":
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "yesterday":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "thisWeek": {
      const diff = today.getDay() === 0 ? -6 : 1 - today.getDay();
      startDate = new Date(today);
      startDate.setDate(today.getDate() + diff);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }

    case "lastWeek": {
      const diff = today.getDay() === 0 ? 6 : today.getDay() - 1;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - diff - 7);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }

    case "thisMonth":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "lastMonth":
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "thisYear":
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "lastYear":
      startDate = new Date(today.getFullYear() - 1, 0, 1);
      endDate = new Date(today.getFullYear() - 1, 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "custom":
      if (startInput && endInput) {
        startDate = new Date(startInput);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(endInput);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
  }

  lastSearchStartDate = startDate;
  lastSearchEndDate = endDate;

  const results = logs.filter(entry => {
    if (!entry) return false;
    if (first && !entry.first?.toLowerCase().includes(first)) return false;
    if (last && !entry.last?.toLowerCase().includes(last)) return false;

    if (typedCompany) {
      const recordCompany = (entry.company || "").toLowerCase().trim();
      if (recordCompany !== typedCompany) return false;
    }

    const logDate = normalizeDate(entry.date);
    if (!logDate) return false;
    if (startDate && logDate < startDate) return false;
    if (endDate && logDate > endDate) return false;

    return true;
  });

  lastSearchResults = results;
  currentSearchResults = results;

  renderSearchResults(results);
};

/* =========================================================
   RENDER RESULTS (FIXED)
========================================================= */
function renderSearchResults(results) {
  const tbody = document.getElementById("searchResultsTable");
  if (!tbody) {
    console.error("searchResultsTable not found");
    return;
  }

  tbody.innerHTML = "";

  if (!Array.isArray(results) || results.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;opacity:.6;">
          No results found
        </td>
      </tr>
    `;
    return;
  }

  results.forEach(entry => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${entry.date || ""}</td>
      <td>${entry.time || ""}</td>
      <td>${entry.first || ""}</td>
      <td>${entry.last || ""}</td>
      <td>${entry.company || ""}</td>
      <td>${entry.reason || ""}</td>
      <td>${Array.isArray(entry.services) ? entry.services.join(", ") : entry.services || ""}</td>
      <td>${entry.signature ? `<img src="${entry.signature}" style="height:40px;" />` : ""}</td>
    `;

    tbody.appendChild(row);
  });
}

/* =========================================================
   EXPORT PDF
========================================================= */
const exportPDFBtn = document.getElementById("exportPDF");
if (exportPDFBtn) {
  exportPDFBtn.addEventListener("click", () => {
    if (!currentSearchResults.length) return alert("No results to export.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");

    const logo = new Image();
    logo.src = "logo.png";

    logo.onload = () => {
      doc.setFillColor(32, 99, 155);
      doc.rect(0, 0, 297, 20, "F");
      doc.addImage(logo, "PNG", 14, 2, 24, 16);
      doc.setTextColor(255);
      doc.setFontSize(16);
      doc.text("AMS Search Log Report", 42, 14);

      const tableData = currentSearchResults.map(e => [
        e.date || "",
        e.time || "",
        e.first || "",
        e.last || "",
        e.company || "",
        e.reason || "",
        Array.isArray(e.services) ? e.services.join(", ") : e.services || "",
        ""
      ]);

      doc.autoTable({
        startY: 30,
        head: [["Date","Time","First","Last","Company","Reason","Services","Signature"]],
        body: tableData
      });

      doc.save("AMS_Search_Log_Report.pdf");
    };
  });
}

/* =========================================================
   EXPORT EXCEL
========================================================= */
document.addEventListener("click", e => {
  if (e.target?.id !== "exportExcel") return;
  if (!lastSearchResults.length) return alert("Run a search first.");

  const sheetData = [
    ["AMS Search Log Report"],
    [],
    ["Date","Time","First","Last","Company","Reason","Services","Signature"]
  ];

  lastSearchResults.forEach(r => {
    sheetData.push([
      r.date || "",
      r.time || "",
      r.first || "",
      r.last || "",
      r.company || "",
      r.reason || "",
      Array.isArray(r.services) ? r.services.join(", ") : r.services || "",
      r.signature ? "Signed" : ""
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Search Log");
  XLSX.writeFile(wb, "AMS_Search_Log_Report.xlsx");
});
// ================================
// CLEAR SEARCH FILTERS
// ================================
const clearBtn = document.getElementById("clearSearch");

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    // Text inputs
    const inputs = [
      "filterFirstName",
      "filterLastName",
      "searchFilterCompanyText",
      "filterStartDate",
      "filterEndDate"
    ];

    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    // Selects
    const companySelect = document.getElementById("searchFilterCompany");
    if (companySelect) companySelect.value = "";

    const rangeSelect = document.getElementById("filterDateRange");
    if (rangeSelect) rangeSelect.value = "";

    // Hide custom date range
    const customRange = document.getElementById("customDateRange");
    if (customRange) customRange.style.display = "none";

    // Re-run search (shows all logs again)
    runSearch();
  });
}
