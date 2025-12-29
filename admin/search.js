function formatShortDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatRange(startDate, endDate) {
  const start = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

  const end = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return `${start} – ${end}`;
}

function normalizeLocalDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ===============================
// DATE HELPERS (LOCAL MIDNIGHT SAFE)
// ===============================
function normalizeLocalDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameLocalDay(dateA, dateB) {
  return normalizeLocalDate(dateA).getTime() === normalizeLocalDate(dateB).getTime();
}
function loadLogoBase64(callback) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = "logo.png";

  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const dataURL = canvas.toDataURL("image/png");
    callback(dataURL);
  };
}

// =============================
// COMPANY FILTER (CUSTOM INPUT)
// =============================
window.toggleCompanyText = function (value) {
  const input = document.getElementById("filterCompanyText");
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
   AMS ADMIN SEARCH LOG (CLEAN & FIXED)
========================================================= */

console.log("Admin Search Module Loaded");

// -------------------- STATE --------------------
let lastSearchResults = [];
let currentSearchResults = [];
let lastSearchStartDate = null;
let lastSearchEndDate = null;

// -------------------- HELPERS --------------------
function getLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

function parseEntryDate(entry) {
  if (entry?.timestamp) return new Date(entry.timestamp);
  if (!entry?.date) return null;

  const [y, m, d] = entry.date.split("-").map(Number);
  if (!y || !m || !d) return null;

  const dt = new Date(y, m - 1, d);
  dt.setHours(12, 0, 0, 0); // timezone-safe
  return dt;
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

// -------------------- DATE RANGE TOGGLE --------------------
window.toggleCustomDateRange = function (value) {
  const box = document.getElementById("customDateRange");
  if (!box) return;
  box.style.display = value === "custom" ? "flex" : "none";
};

// -------------------- RUN SEARCH --------------------
window.runSearch = function () {
  const logs = getLogs();

  const first = document.getElementById("filterFirstName")?.value.trim().toLowerCase();
  const last = document.getElementById("filterLastName")?.value.trim().toLowerCase();
  const companyVal = document.getElementById("filterCompany")?.value;
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

    if (companyVal && companyVal !== "All Companies") {
      if (!entry.company?.toLowerCase().includes(companyVal.toLowerCase())) return false;
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

// -------------------- RENDER --------------------
function renderSearchResults(results) {
  const container = document.getElementById("searchResultsTable");
  if (!container) return;

  if (!results.length) {
    container.innerHTML = "<p>No results found</p>";
    return;
  }

  container.innerHTML = `
    <table class="log-table">
      <thead>
        <tr>
          <th>Date</th><th>Time</th><th>First</th><th>Last</th>
          <th>Company</th><th>Reason</th><th>Services</th><th>Signature</th>
        </tr>
      </thead>
      <tbody>
        ${results.map(r => `
          <tr>
            <td>${r.date || ""}</td>
            <td>${r.time || ""}</td>
            <td>${r.first || ""}</td>
            <td>${r.last || ""}</td>
            <td>${r.company || ""}</td>
            <td>${r.reason || ""}</td>
            <td>${Array.isArray(r.services) ? r.services.join(", ") : r.services || ""}</td>
            <td>${r.signature ? `<img src="${r.signature}" style="height:40px" />` : "-"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}


/* =========================================================
   DATE RANGE TOGGLE (SAFE FOR DYNAMIC DOM)
========================================================= */

window.toggleCustomDateRange = function (value) {
    const custom = document.getElementById("customDateRange");
    if (!custom) return;
    custom.style.display = value === "custom" ? "block" : "none";
};
// ===============================
// GLOBAL SEARCH DATE RANGE (PDF)
// ===============================
let lastSearchStartDate = null;
let lastSearchEndDate = null;

/* ===============================
   PDF DATE RANGE LABEL (PART 2)
================================ */
function getSearchDateRangeLabel() {
  if (!lastSearchStartDate || !lastSearchEndDate) return "All Dates";

  const fmt = d =>
    d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

  return `${fmt(lastSearchStartDate)} – ${fmt(lastSearchEndDate)}`;
}

window.runSearch = function () {
  const logs = getLogs();

  const first = document.getElementById("filterFirstName").value.trim().toLowerCase();
  const last = document.getElementById("filterLastName").value.trim().toLowerCase();
  const company = document.getElementById("filterCompany").value;

  const companyText = document
    .getElementById("filterCompanyText")
    ?.value.trim().toLowerCase();

  const normalizedCompany =
    company === "__custom__" ? companyText : company.toLowerCase();

  const range = document.getElementById("filterDateRange").value;

  const startInput = document.getElementById("filterStartDate")?.value;
  const endInput = document.getElementById("filterEndDate")?.value;

// ===============================
// DATE RANGE HANDLING (FIXED)
// ===============================

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


  startDate = startOfWeek;
  endDate = endOfWeek;
}

  } else if (range === "thisMonth") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today);
  } else if (range === "custom" && startInput && endInput) {
    startDate = new Date(startInput);
    endDate = new Date(endInput);
  }

  if (startDate) startDate.setHours(0, 0, 0, 0);
  if (endDate) endDate.setHours(23, 59, 59, 999);

  const results = logs.filter(entry => {
    if (!entry) return false;

    if (first && !entry.first?.toLowerCase().includes(first)) return false;
    if (last && !entry.last?.toLowerCase().includes(last)) return false;

    if (normalizedCompany && normalizedCompany !== "all companies") {
      const recordCompany = (entry.company || "").toLowerCase();
      if (!recordCompany.includes(normalizedCompany)) return false;
    }

    if (startDate && endDate) {
      const entryDate = parseEntryDate(entry);
      if (!entryDate) return false;
      if (entryDate < startDate || entryDate > endDate) return false;
    }

    return true;
  });

  // ✅ ONLY PLACE THESE VARIABLES ARE SET
  lastSearchResults = results;
  currentSearchResults = results;

  renderSearchResults(results);
};

/* =========================================================
   RENDER RESULTS
========================================================= */

function renderSearchResults(results) {
  const container = document.getElementById("searchResultsTable");
  if (!container) return;

  container.innerHTML = "";

  if (!results.length) {
    container.innerHTML = "<p>No results found</p>";
    return;
  }

  let html = `
    <table class="log-table">
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
  results.forEach(entry => {
  html += `
    <tr>
      <td>${entry.date || ""}</td>
      <td>${entry.time || ""}</td>
      <td>${entry.first || ""}</td>
      <td>${entry.last || ""}</td>
      <td>${entry.company || ""}</td>
      <td>${entry.reason || ""}</td>
      <td>${entry.services || ""}</td>
      <td>
        ${
          entry.signature
            ? `<img src="${entry.signature}" style="height:40px;border:1px solid #ccc;background:#fff;" />`
            : "-"
        }
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
// EXPORT PDF (WITH SIGNATURES)
// ==============================
const exportPDFBtn = document.getElementById("exportPDF");

if (exportPDFBtn) {
  exportPDFBtn.addEventListener("click", () => {
    if (!currentSearchResults.length) {
      alert("No results to export.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");

    const logo = new Image();
    logo.src = "logo.png";

    logo.onload = () => {

      // HEADER BAR
      doc.setFillColor(32, 99, 155);
      doc.rect(0, 0, 297, 20, "F");

      doc.addImage(logo, "PNG", 14, 2, 24, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("AMS Search Log Report", 42, 14);

      // META INFO
      doc.setTextColor(0);
      doc.setFontSize(10);

      const now = new Date();
      doc.text(`Generated: ${now.toLocaleString()}`, 14, 28);
      doc.text(`Total Records: ${currentSearchResults.length}`, 14, 34);
     
      // ===============================
// COMPANY LABEL (PDF HEADER)
// ===============================
let company = "All Companies";

const companySelect = document.getElementById("filterCompany");
const companyText = document.getElementById("filterCompanyText");

if (companySelect && companySelect.value) {
  if (companySelect.value === "__custom__") {
    // Custom typed company
    company = companyText?.value?.trim() || "Individual";
  } else if (companySelect.value !== "All Companies") {
    // Selected company from dropdown
    company = companySelect.value;
  }
}

      doc.text(`Company: ${company}`, 120, 28);

      let dateRangeLabel = "All Dates";
      if (lastSearchStartDate && lastSearchEndDate) {
        dateRangeLabel = formatRange(lastSearchStartDate, lastSearchEndDate);
      }

      doc.text(`Date Range: ${dateRangeLabel}`, 120, 34);

      // TABLE DATA
      const tableData = currentSearchResults.map(e => [
        e.date ? formatShortDate(new Date(e.date + "T00:00:00")) : "",
        e.time || "",
        e.first || "",
        e.last || "",
        e.company || "",
        e.reason || "",
        Array.isArray(e.services) ? e.services.join(", ") : e.services || "",
        "" // Signature placeholder
      ]);

      doc.autoTable({
        startY: 42,

        head: [[
          "Date",
          "Time",
          "First",
          "Last",
          "Company",
          "Reason",
          "Services",
          "Signature"
        ]],

        body: tableData,

        styles: {
          fontSize: 9,
          cellPadding: 3,
          valign: "middle"
        },

        headStyles: {
          fillColor: [32, 99, 155],
          textColor: 255,
          halign: "center"
        },

        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },

        columnStyles: {
          7: { cellWidth: 35 }
        },

        margin: { left: 14, right: 14 },

        didDrawCell: function (data) {
          if (data.section === "body" && data.column.index === 7) {
            const entry = currentSearchResults[data.row.index];

            if (entry?.signature?.startsWith("data:image")) {
              const imgWidth = 28;
              const imgHeight = 10;

              const x = data.cell.x + (data.cell.width - imgWidth) / 2;
              const y = data.cell.y + (data.cell.height - imgHeight) / 2;

              doc.addImage(
                entry.signature,
                "PNG",
                x,
                y,
                imgWidth,
                imgHeight
              );
            }
          }
        },

        didDrawPage: () => {
          const pageHeight = doc.internal.pageSize.getHeight();
          const pageWidth = doc.internal.pageSize.getWidth();

          doc.setFontSize(9);
          doc.setTextColor(120);
          doc.text(
            "Generated by AMS Check-In System © 2025 Airport Medical Solutions",
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
        }
      });

      doc.save("AMS_Search_Log_Report.pdf");
    };
  });
}
// ==============================
// EXPORT SEARCH RESULTS (EXCEL – PRO STYLE)
// ==============================
document.addEventListener("click", (e) => {
  if (!e.target || e.target.id !== "exportExcel") return;

  if (!Array.isArray(lastSearchResults) || lastSearchResults.length === 0) {
    alert("Please run a search before exporting.");
    return;
  }

  const company =
    document.getElementById("filterCompany")?.value || "All Companies";

  const now = new Date().toLocaleString();

  // ---- Build sheet rows manually (PRO layout)
  const sheetData = [
    ["AMS Search Log Report"],
    [`Company: ${company}`],
    [`Generated: ${now}`],
    [],
    ["Date", "Time", "First", "Last", "Company", "Reason", "Services", "Signature"]
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
      r.signature ? "Yes" : ""
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // ---- Auto column sizing
  ws["!cols"] = sheetData[4].map((_, colIndex) => ({
    wch: Math.max(
      ...sheetData.map(row => (row[colIndex] || "").toString().length),
      12
    )
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Search Log");

  XLSX.writeFile(wb, "AMS_Search_Log_Report.xlsx");
});

// ==============================
// CLEAR FILTERS
// ==============================
const clearBtn = document.getElementById("clearSearch");

if (clearBtn) {
  clearBtn.addEventListener("click", () => {

    // Clear text inputs
    const first = document.getElementById("filterFirstName");
    const last = document.getElementById("filterLastName");
    if (first) first.value = "";
    if (last) last.value = "";

    // Reset company
    const company = document.getElementById("filterCompany");
    if (company) company.value = "All Companies";

    // Reset date range dropdown
    const range = document.getElementById("filterDateRange");
    if (range) range.value = "";

    // Clear custom dates
    const startDate = document.getElementById("filterStartDate");
    const endDate = document.getElementById("filterEndDate");
    if (startDate) startDate.value = "";
    if (endDate) endDate.value = "";

    // Hide custom date section
    const customBox = document.getElementById("customDateRange");
    if (customBox) customBox.style.display = "none";

    // Clear results table
    const results = document.getElementById("searchResultsTable");
    if (results) results.innerHTML = "";

    // ✅ RESET SEARCH STATE (THIS FIXES PDF ISSUE)
    lastSearchResults = [];
    currentSearchResults = [];
    lastSearchStartDate = null;
    lastSearchEndDate = null;

  });
}
