/* =========================================================
   BASIC STORAGE
========================================================= */
function getLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

let lastSearchResults = [];
let currentSearchResults = [];

/* =========================================================
   DATE HELPERS (SAFE / LOCAL)
========================================================= */
function normalizeDate(dateStr) {
  if (!dateStr) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr + "T00:00:00");
    return isNaN(d) ? null : d;
  }

  // MM/DD/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [m, d, y] = dateStr.split("/");
    return new Date(Number(y), Number(m) - 1, Number(d));
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
   COMPANY CUSTOM INPUT
========================================================= */
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
   DATE RANGE TOGGLE
========================================================= */
window.toggleCustomDateRange = function (value) {
  const custom = document.getElementById("customDateRange");
  if (!custom) return;
  custom.style.display = value === "custom" ? "block" : "none";
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
  const company = document.getElementById("filterCompany").value;

  const companyText = document
    .getElementById("filterCompanyText")
    ?.value.trim().toLowerCase();

  const normalizedCompany =
    company === "__custom__" ? companyText : company.toLowerCase();

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
      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startDate = new Date(today);
      startDate.setDate(today.getDate() + diff);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }

    case "lastWeek": {
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
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
    const [sy, sm, sd] = startInput.split("-").map(Number);
    startDate = new Date(sy, sm - 1, sd);
    startDate.setHours(0, 0, 0, 0);

    const [ey, em, ed] = endInput.split("-").map(Number);
    endDate = new Date(ey, em - 1, ed);
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

    if (normalizedCompany && normalizedCompany !== "all companies") {
      const recordCompany = (entry.company || "").toLowerCase();
      if (!recordCompany.includes(normalizedCompany)) return false;
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
   RENDER RESULTS
========================================================= */
function renderSearchResults(results) {
  const container = document.getElementById("searchResultsTable");
  if (!container) return;

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
        <td>${Array.isArray(entry.services) ? entry.services.join(", ") : entry.services || ""}</td>
        <td>${entry.signature ? `<img src="${entry.signature}" style="height:40px" />` : "-"}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
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
