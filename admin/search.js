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
let currentSearchResults = [];
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
   AMS ADMIN SEARCH LOG (CLEAN REBUILD)
========================================================= */

console.log("Admin Search Module Loaded");

/* =========================================================
   HELPERS
========================================================= */

function getLogs() {
    return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

function parseEntryDate(entry) {
  // BEST SOURCE: timestamp (most accurate)
  if (entry && entry.timestamp) {
    return new Date(entry.timestamp);
  }

  // Fallback: MM/DD/YYYY string
  if (!entry || !entry.date) return null;

  const [month, day, year] = entry.date.split("/").map(Number);
  if (!month || !day || !year) return null;

  const d = new Date(year, month - 1, day);
  d.setHours(0, 0, 0, 0);
  return d;
}


/* =========================================================
   DATE RANGE TOGGLE (SAFE FOR DYNAMIC DOM)
========================================================= */

window.toggleCustomDateRange = function (value) {
    const custom = document.getElementById("customDateRange");
    if (!custom) return;
    custom.style.display = value === "custom" ? "block" : "none";
};

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

    let startDate = null;
    let endDate = null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
  // TODAY (local-safe)
if (range === "today") {
  startDate = new Date(today);
  endDate = new Date(today);
}

// YESTERDAY (local-safe)
if (range === "yesterday") {
  startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 1);

  endDate = new Date(startDate);
}
  else if (range === "lastWeek") {
  const todayLocal = new Date(today);

  startDate = new Date(todayLocal);
  startDate.setDate(todayLocal.getDate() - todayLocal.getDay() - 7);

  endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
}

    if (range === "thisMonth") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
    }
   
    if (range === "custom" && startInput && endInput) {
     const [sy, sm, sd] = startInput.split("-").map(Number);
     const [ey, em, ed] = endInput.split("-").map(Number);

     startDate = new Date(sy, sm - 1, sd);
     endDate = new Date(ey, em - 1, ed);
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
// EXPORT EXCEL
// ==============================
const exportExcelBtn = document.getElementById("exportExcel");

if (exportExcelBtn) {
  exportExcelBtn.addEventListener("click", () => {
    if (!currentSearchResults.length) {
      alert("No search results to export.");
      return;
    }

    const data = currentSearchResults.map(e => ({
      Date: e.date || "",
      Time: e.time || "",
      First: e.first || "",
      Last: e.last || "",
      Company: e.company || "",
      Reason: e.reason || "",
      Services: Array.isArray(e.services)
        ? e.services.join(", ")
        : e.services || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Search Log");

    XLSX.writeFile(workbook, "AMS_Search_Log.xlsx");
  });
}

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
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);

      const now = new Date();
      doc.text(`Generated: ${now.toLocaleString()}`, 14, 28);
      doc.text(`Total Records: ${currentSearchResults.length}`, 14, 34);

      const company =
        document.getElementById("filterCompany")?.value || "All Companies";
      const range =
        document.getElementById("filterDateRange")?.value || "All Dates";

      doc.text(`Company: ${company}`, 120, 28);
      // ===============================
// FORMAT DATE RANGE LABEL (PDF)
// ===============================
let dateRangeLabel = "All Dates";
const today = normalizeLocalDate(new Date());

if (range === "today") {
  dateRangeLabel = `Today (${formatShortDate(today)})`;
}

else if (range === "thisWeek") {
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday start

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  dateRangeLabel = `This Week (${formatRange(startOfWeek, endOfWeek)})`;
}

else if (range === "thisMonth") {
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  dateRangeLabel = `This Month (${formatRange(startOfMonth, endOfMonth)})`;
}

else if (range === "custom") {
  const start = normalizeLocalDate(new Date(document.getElementById("customStart").value));
  const end = normalizeLocalDate(new Date(document.getElementById("customEnd").value));

  dateRangeLabel = `Custom (${formatRange(start, end)})`;
}
      doc.text(`Date Range: ${dateRangeLabel}`, 120, 34);


      // TABLE
      const tableData = currentSearchResults.map(e => [
        e.date || "",
        e.time || "",
        e.first || "",
        e.last || "",
        e.company || "",
        e.reason || "",
        Array.isArray(e.services) ? e.services.join(", ") : e.services || ""
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
          "Services"
        ]],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [32, 99, 155] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
        didDrawPage: () => {
  const page = doc.internal.getNumberOfPages();

  doc.setFontSize(9);
  doc.setTextColor(120);

  // Footer brand
  doc.text(
    "Generated by AMS Check-In System • © 2025 Airport Medical Solutions",
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  // Page number
  doc.text(
    `Page ${page}`,
    doc.internal.pageSize.getWidth() - 20,
    doc.internal.pageSize.getHeight() - 10
  );
}
          });
      // SIGNATURE BLOCK
const finalY = doc.lastAutoTable.finalY + 20;

doc.setFontSize(11);
doc.setTextColor(0);

doc.text("Authorized By:", 14, finalY);
doc.line(40, finalY + 1, 120, finalY + 1);

doc.text("Date:", 14, finalY + 15);
doc.line(40, finalY + 16, 120, finalY + 16);
;
      doc.save("AMS_Search_Log_Report.pdf");
    };
  });
}
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

  });
}
