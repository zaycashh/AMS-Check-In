/* =========================================================
   SEARCH LOG MODULE (ADMIN ONLY)
   This file is safe & does NOT modify your main system.
========================================================= */

console.log("Admin Search Module Loaded");

// This function will later handle filters and exporting
function initAdminSearch() {
    console.log("Search module ready");
}

// Load automatically when admin enters the Search tab
document.addEventListener("DOMContentLoaded", () => {
    initAdminSearch();
});
/* ============================================================
   ADMIN SEARCH MODULE — SAFE / ISOLATED / NON-BREAKING
   ============================================================ */

console.log("Admin Search Module Loaded");

/* Utility: Load all records */
function getLogs() {
    return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

/* Render filtered table results */
function renderFilteredResults(logs) {
    const tbody = document.querySelector("#resultsTable tbody");
    tbody.innerHTML = "";

    logs.forEach(log => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${log.date}</td>
            <td>${log.time}</td>
            <td>${log.first} ${log.last}</td>
            <td>${log.company}</td>
            <td>${log.reason}</td>
            <td>${log.services}</td>
            <td><img src="${log.signature}" class="sig-thumb"></td>
        `;

        tbody.appendChild(row);
    });
}

/* ============================================================
   FILTERING LOGIC
   ============================================================ */
function applyFilters() {
    let logs = getLogs();

    const nameFilter = document.getElementById("filterName").value.toLowerCase();
    const startDate = document.getElementById("filterDateStart").value;
    const endDate = document.getElementById("filterDateEnd").value;
    const companyFilter = document.getElementById("filterCompany").value;

    logs = logs.filter(log => {
        let match = true;

        if (nameFilter) {
            const fullName = `${log.first} ${log.last}`.toLowerCase();
            if (!fullName.includes(nameFilter)) match = false;
        }

        if (companyFilter !== "All Companies") {
            if (log.company !== companyFilter) match = false;
        }

        if (startDate) {
            const logDate = new Date(log.date);
            if (logDate < new Date(startDate)) match = false;
        }

        if (endDate) {
            const logDate = new Date(log.date);
            if (logDate > new Date(endDate)) match = false;
        }

        return match;
    });

    renderFilteredResults(logs);
}

/* ============================================================
   EXPORT TO XLS (NOT CSV)
   ============================================================ */
function exportToExcel() {
    const logs = getLogs();

    let excelHTML = `
        <table border="1">
            <tr>
                <th>Date</th><th>Time</th><th>Name</th>
                <th>Company</th><th>Reason</th><th>Services</th>
            </tr>
    `;

    logs.forEach(log => {
        excelHTML += `
            <tr>
                <td>${log.date}</td>
                <td>${log.time}</td>
                <td>${log.first} ${log.last}</td>
                <td>${log.company}</td>
                <td>${log.reason}</td>
                <td>${log.services}</td>
            </tr>
        `;
    });

    excelHTML += "</table>";

    const blob = new Blob([excelHTML], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "AMS_Search_Report.xls"; // TRUE XLS FILE
    a.click();

    URL.revokeObjectURL(url);
}

/* ============================================================
   EXPORT TO PDF
   (We use browser print-to-PDF for simplicity)
   ============================================================ */
function exportToPDF() {
    window.print(); 
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {

    console.log("Search module ready");

    /* Live Filters */
    document.getElementById("filterName").addEventListener("input", applyFilters);
    document.getElementById("filterDateStart").addEventListener("change", applyFilters);
    document.getElementById("filterDateEnd").addEventListener("change", applyFilters);
    document.getElementById("filterCompany").addEventListener("change", applyFilters);

    /* Export Buttons */
    document.getElementById("btnExportExcel").addEventListener("click", exportToExcel);
    document.getElementById("btnExportPDF").addEventListener("click", exportToPDF);

    /* Initial load */
    applyFilters();
});
