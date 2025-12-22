// ==============================
// TOGGLE CUSTOM DATE RANGE
// ==============================
window.toggleCustomDateRange = function (value) {
  const box = document.getElementById("customDateRange");
  if (!box) return;

  if (value === "custom") {
    box.style.display = "block";
  } else {
    box.style.display = "none";

    // Clear custom dates when switching away
    const start = document.getElementById("filterStartDate");
    const end = document.getElementById("filterEndDate");
    if (start) start.value = "";
    if (end) end.value = "";
  }
};

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
  const customBox = document.getElementById("customDateRange");

  if (!customBox) return;

  if (value === "custom") {
    customBox.style.display = "block";
  } else {
    customBox.style.display = "none";
  }
};

window.runSearch = function () {
    const logs = getLogs();

    const first = document.getElementById("filterFirstName").value.trim().toLowerCase();
    const last = document.getElementById("filterLastName").value.trim().toLowerCase();
    const company = document.getElementById("filterCompany").value;
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

    if (range === "thisWeek") {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        endDate = new Date(today);
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
        if (company && company !== "All Companies" && entry.company !== company) return false;

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
      doc.text(`Date Range: ${range}`, 120, 34);

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
          doc.text(
            `Page ${page}`,
            doc.internal.pageSize.getWidth() - 20,
            doc.internal.pageSize.getHeight() - 10
          );
        }
      });

      // FOOTER
      doc.setFontSize(8);
      doc.text(
        "Confidential – Internal Use Only – AMS Check-In System",
        14,
        doc.internal.pageSize.getHeight() - 10
      );

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
  document.getElementById("filterFirstName").value = "";
  document.getElementById("filterLastName").value = "";

  // Reset company
  document.getElementById("filterCompany").value = "All Companies";

  // Reset date range dropdown
  const range = document.getElementById("filterDateRange");
  range.value = "";
  toggleCustomDateRange("");

  // Clear custom date inputs
  const startInput = document.getElementById("filterStartDate");
  const endInput = document.getElementById("filterEndDate");

  if (startInput) startInput.value = "";
  if (endInput) endInput.value = "";

  // Hide custom date section
  const custom = document.getElementById("customDateRange");
  if (custom) custom.style.display = "none";

  // Clear results
  document.getElementById("searchResultsTable").innerHTML = "";
});
  clearBtn.addEventListener("click", (e) => {
  // 🚨 stop form submission completely
  e.preventDefault();
  e.stopPropagation();

  // Clear text inputs
  document.getElementById("filterFirstName").value = "";
  document.getElementById("filterLastName").value = "";

  // Reset company
  document.getElementById("filterCompany").value = "All Companies";

  // Reset date range dropdown
  const range = document.getElementById("filterDateRange");
  range.value = "";
  toggleCustomDateRange("");

  // 🔥 FORCE clear custom date inputs
  const startInput = document.getElementById("filterStartDate");
  const endInput = document.getElementById("filterEndDate");

  if (startInput) {
    startInput.value = "";
    startInput.setAttribute("value", "");
  }

  if (endInput) {
    endInput.value = "";
    endInput.setAttribute("value", "");
  }

  // Hide custom date section
  const custom = document.getElementById("customDateRange");
  if (custom) custom.style.display = "none";

  // Clear results
  document.getElementById("searchResultsTable").innerHTML = "";
});
