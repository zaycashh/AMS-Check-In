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

/* =========================
   RUN SEARCH
========================= */
function runSearch() {
  const logs = getLogs();

  const first = document.getElementById("filterFirstName").value.trim().toLowerCase();
  const last = document.getElementById("filterLastName").value.trim().toLowerCase();
  const company = document.getElementById("filterCompany").value;
  const range = document.getElementById("filterDateRange").value;

  const results = logs.filter(entry => {
    if (!entry) return false;

    const matchFirst = !first || (entry.first || "").toLowerCase().includes(first);
    const matchLast = !last || (entry.last || "").toLowerCase().includes(last);
    const matchCompany = !company || company === "All Companies" || entry.company === company;

    return matchFirst && matchLast && matchCompany;
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
document.getElementById("exportPDF")?.addEventListener("click", () => {
  const data = getVisibleTableData();
  if (!data.length) return alert("No data to export");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("AMS Search Log", 14, 15);

  const tableData = data.map(row => [
    row.Date,
    row.Time,
    row.First,
    row.Last,
    row.Company,
    row.Services,
    row.Reason
  ]);

  doc.autoTable({
    head: [["Date", "Time", "First", "Last", "Company", "Services", "Reason"]],
    body: tableData,
    startY: 20
  });

  doc.save("AMS_Search_Log.pdf");
});
