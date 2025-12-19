/* =========================================================
   ADMIN SEARCH MODULE — SAFE VERSION
   (NO LOGIN / TAB / SIGNATURE CONFLICTS)
========================================================= */

console.log("Admin Search Module Loaded");
// ===============================
// CLEAR FILTERS (SAFE & GLOBAL)
// ===============================
window.clearFilters = function () {
  // Clear name fields
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

  // Clear custom date inputs
  const start = document.getElementById("filterStartDate");
  const end = document.getElementById("filterEndDate");
  if (start) start.value = "";
  if (end) end.value = "";

  // Hide custom date UI
  if (typeof toggleCustomDateRange === "function") {
    toggleCustomDateRange("");
  }

  // Clear results safely
  if (typeof renderSearchResults === "function") {
    renderSearchResults([]);
  }

  if (typeof currentSearchResults !== "undefined") {
    currentSearchResults = [];
  }
};

window.toggleCustomDateRange = function (value) {
  const box = document.getElementById("customDateRange");
  if (!box) return;

  if (value === "custom") {
    box.style.display = "flex";
  } else {
    box.style.display = "none";
  }
};

/* =========================
   LOAD LOGS
========================= */
function getLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

/* =========================
   RUN SEARCH
========================= */
function runSearch() {
    const logs = getLogs();

    const first = document.getElementById("filterFirstName").value.trim().toLowerCase();
    const last = document.getElementById("filterLastName").value.trim().toLowerCase();
    const company = document.getElementById("filterCompany").value;
    const range = document.getElementById("filterDateRange").value;

    const today = new Date();
    let startDate = null;
    let endDate = null;

    // DATE RANGE LOGIC
   if (range === "today") {
  startDate = new Date();
  startDate.setHours(0, 0, 0, 0); // start of TODAY

  endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // end of TODAY
}

    if (range === "thisWeek") {
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
    }

    const results = logs.filter(entry => {
        if (!entry) return false;

        const matchFirst = !first || (entry.first || "").toLowerCase().includes(first);
        const matchLast = !last || (entry.last || "").toLowerCase().includes(last);
        const matchCompany =
  !company ||
  company === "All Companies" ||
  company === "" ||
  entry.company === company;


        if (!matchFirst || !matchLast || !matchCompany) return false;
       
       // DATE FILTER (must be inside filter)
if (startDate && endDate && entry.date) {
  const entryDate = new Date(entry.date + "T00:00:00");

  if (entryDate < startDate || entryDate > endDate) return false;
}

        return true;
    });

    renderSearchResults(results);
}

/* =========================
   RENDER RESULTS
========================= */
function renderSearchResults(logs) {
    const container = document.getElementById("searchResultsTable");
    if (!container) return;

    let html = `
        <table class="log-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>First</th>
                    <th>Last</th>
                    <th>Company</th>
                    <th>Services</th>
                    <th>Reason</th>
                </tr>
            </thead>
            <tbody>
    `;

    logs.forEach(log => {
        html += `
            <tr>
                <td>${log.date || "-"}</td>
                <td>${log.time || "-"}</td>
                <td>${log.first || "-"}</td>
                <td>${log.last || "-"}</td>
                <td>${log.company || "-"}</td>
                <td>${log.services || "-"}</td>
                <td>${log.reason || "-"}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

/* =========================
   BUTTON HOOKS
========================= */
document.addEventListener("DOMContentLoaded", () => {
const dateRangeSelect = document.getElementById("filterDateRange");
const customRange = document.getElementById("customDateRange");

if (dateRangeSelect && customRange) {
  dateRangeSelect.addEventListener("change", () => {
    customRange.style.display =
      dateRangeSelect.value === "custom" ? "block" : "none";
  });
}

  const searchBtn = document.getElementById("runSearch");
  const clearBtn = document.getElementById("clearSearch");

  if (searchBtn) searchBtn.addEventListener("click", runSearch);

    if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.getElementById("filterFirstName").value = "";
      document.getElementById("filterLastName").value = "";
      document.getElementById("filterCompany").value = "";
      document.getElementById("filterDateRange").value = "";

      document.getElementById("filterStartDate").value = "";
      document.getElementById("filterEndDate").value = "";

      if (customRange) customRange.style.display = "none";

      document.getElementById("searchResultsTable").innerHTML = "";
    });
  }
});
/* =========================
   EXPORT SEARCH LOG
========================= */

function getVisibleTableData() {
  const rows = document.querySelectorAll(".log-table tbody tr");
  const data = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    data.push({
      Date: cells[0]?.innerText || "",
      Time: cells[1]?.innerText || "",
      First: cells[2]?.innerText || "",
      Last: cells[3]?.innerText || "",
      Company: cells[4]?.innerText || "",
      Services: cells[5]?.innerText || "",
      Reason: cells[6]?.innerText || ""
    });
  });

  return data;
}
document.getElementById("exportExcel")?.addEventListener("click", () => {
  const data = getVisibleTableData();
  if (!data.length) return alert("No data to export");

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Search Log");

  XLSX.writeFile(workbook, "AMS_Search_Log.xlsx");
});
document.getElementById("exportPDF").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logs = getLogs();
    if (!logs.length) {
        alert("No records to export.");
        return;
    }

    /* ============================
       HEADER BRANDING
    ============================ */
    doc.setFontSize(16);
    doc.text("AMS Check-In System", 14, 18);

    doc.setFontSize(11);
    doc.text("Search Log Report", 14, 26);

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    /* ============================
       TABLE DATA
    ============================ */
    const tableData = logs.map(log => [
        log.date || "",
        log.time || "",
        log.first || "",
        log.last || "",
        log.company || "",
        log.services || "",
        log.reason || ""
    ]);

    doc.autoTable({
        startY: 38,
        head: [[
            "Date",
            "Time",
            "First",
            "Last",
            "Company",
            "Services",
            "Reason"
        ]],
        body: tableData,
        styles: {
            fontSize: 8,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [33, 150, 243], // blue header
            textColor: 255
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        didDrawPage: function (data) {
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.text(
                `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
                data.settings.margin.left,
                doc.internal.pageSize.height - 8
            );
        }
    });

    doc.save("AMS_Search_Log_Report.pdf");
});
