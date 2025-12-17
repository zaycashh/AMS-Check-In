/* =========================================================
   ADMIN SEARCH MODULE — SAFE VERSION
   (NO LOGIN / TAB / SIGNATURE CONFLICTS)
========================================================= */

console.log("Admin Search Module Loaded");

/* =========================
   LOAD LOGS
========================= */
function getLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}
/* =====================
   DATE PARSER (SAFE)
===================== */
function parseMMDDYYYY(dateStr) {
    if (!dateStr) return null;
    const [month, day, year] = dateStr.split("/");
    return new Date(year, month - 1, day);
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

  let filtered = logs.filter(entry => {
    if (!entry) return false;

    const matchFirst = !first || (entry.first || "").toLowerCase().includes(first);
    const matchLast = !last || (entry.last || "").toLowerCase().includes(last);
    const matchCompany = !company || company === "All Companies" || entry.company === company;

    return matchFirst && matchLast && matchCompany;
});

/* =====================
   DATE RANGE FILTER
===================== */

const startDate = document.getElementById("filterStartDate")?.value;
const endDate = document.getElementById("filterEndDate")?.value;

if (range === "custom" && startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    filtered = filtered.filter(entry => {
        const entryDate = parseMMDDYYYY(entry.date);
        if (!entryDate) return false;
        return entryDate >= start && entryDate <= end;
    });
}

/* =====================
   RENDER RESULTS
===================== */

renderSearchResults(filtered);


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
document.getElementById("exportPDF").addEventListener("click", async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const logs = getLogs();
    if (!logs.length) {
        alert("No records to export.");
        return;
    }

    /* ============================
       LOAD LOGO
    ============================ */
    const logo = new Image();
    logo.src = "logo.png";

    logo.onload = () => {

        /* ============================
           HEADER
        ============================ */
        doc.addImage(logo, "PNG", 14, 10, 28, 28);

        doc.setFontSize(16);
        doc.text("AMS Check-In System", 48, 18);

        doc.setFontSize(11);
        doc.text("Search Log Report", 48, 26);

        doc.setFontSize(9);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 48, 32);

        /* ============================
           FILTER SUMMARY
        ============================ */
        const first = document.getElementById("filterFirstName").value || "Any";
        const last = document.getElementById("filterLastName").value || "Any";
        const company = document.getElementById("filterCompany").value || "All Companies";
        const range = document.getElementById("filterDateRange").value || "All Dates";

        doc.setFontSize(10);
        doc.text(`Filters Applied:`, 14, 46);

        doc.setFontSize(9);
        doc.text(`First Name: ${first}`, 14, 52);
        doc.text(`Last Name: ${last}`, 80, 52);
        doc.text(`Company: ${company}`, 14, 58);
        doc.text(`Date Range: ${range}`, 80, 58);

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
            startY: 66,
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
                fillColor: [33, 150, 243],
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
    };
});
   // ================================
// TOGGLE CUSTOM DATE RANGE INPUTS
// ================================
document.addEventListener("DOMContentLoaded", () => {
    const dateRangeSelect = document.getElementById("filterDateRange");
    const customDateRange = document.getElementById("customDateRange");

    if (!dateRangeSelect || !customDateRange) return;

    // Initial state (in case page loads with Custom selected)
    customDateRange.style.display =
        dateRangeSelect.value === "custom" ? "block" : "none";

    // Toggle on change
    dateRangeSelect.addEventListener("change", () => {
        if (dateRangeSelect.value === "custom") {
            customDateRange.style.display = "block";
        } else {
            customDateRange.style.display = "none";
        }
    });
});
