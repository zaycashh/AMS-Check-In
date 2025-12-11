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
/* ===========================================================
   ADMIN SEARCH MODULE – FILTERING + DATE RANGE LOGIC
   This code safely handles filters without touching main app.js
=========================================================== */

console.log("Admin Search Module Loaded");

/* Utility: Load stored logs */
function getLogs() {
    return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

/* DATE HELPERS */
function toDate(d) {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
}

function getRange(range) {
    const today = toDate(new Date());

    switch (range) {
        case "today":
            return { start: today, end: today };

        case "yesterday":
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            return { start: y, end: y };

        case "thisWeek":
            const wStart = new Date(today);
            wStart.setDate(today.getDate() - today.getDay()); // Sunday
            return { start: wStart, end: today };

        case "lastWeek":
            const lwEnd = new Date(today);
            lwEnd.setDate(today.getDate() - today.getDay() - 1);

            const lwStart = new Date(lwEnd);
            lwStart.setDate(lwEnd.getDate() - 6);
            return { start: lwStart, end: lwEnd };

        case "thisMonth":
            const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return { start: mStart, end: today };

        case "lastMonth":
            const lmStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            return { start: lmStart, end: lmEnd };

        case "thisYear":
            const yStart = new Date(today.getFullYear(), 0, 1);
            return { start: yStart, end: today };

        case "lastYear":
            const lyStart = new Date(today.getFullYear() - 1, 0, 1);
            const lyEnd = new Date(today.getFullYear() - 1, 11, 31);
            return { start: lyStart, end: lyEnd };

        default:
            return null;
    }
}

/* ===========================================================
   APPLY FILTERS
=========================================================== */

function applyFilters() {
    const logs = getLogs();

    const nameFilter = document.getElementById("filterName").value.toLowerCase();
    const companyFilter = document.getElementById("filterCompany").value;
    const startDate = document.getElementById("filterDateStart").value;
    const endDate = document.getElementById("filterDateEnd").value;
    const range = document.getElementById("filterDateRange").value;

    let { start, end } = { start: null, end: null };

    // If preset range selected → override custom fields
    if (range) {
        const r = getRange(range);
        start = r.start;
        end = r.end;
    } else {
        // Use Start/End fields
        if (startDate) start = toDate(startDate);
        if (endDate) end = toDate(endDate);
    }

    const results = logs.filter(log => {
        const fullName = `${log.first} ${log.last}`.toLowerCase();
        const logDate = toDate(log.date);

        if (nameFilter && !fullName.includes(nameFilter)) return false;
        if (companyFilter && log.company !== companyFilter) return false;

        if (start && logDate < start) return false;
        if (end && logDate > end) return false;

        return true;
    });

    renderFilteredResults(results);
}

/* ===========================================================
   RENDER RESULTS
=========================================================== */

function renderFilteredResults(list) {
    const tbody = document.querySelector("#resultsTable tbody");
    tbody.innerHTML = "";

    list.forEach(log => {
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

/* ===========================================================
   BIND FILTER EVENTS
=========================================================== */

document.getElementById("filterName").addEventListener("input", applyFilters);
document.getElementById("filterCompany").addEventListener("change", applyFilters);
document.getElementById("filterDateStart").addEventListener("change", applyFilters);
document.getElementById("filterDateEnd").addEventListener("change", applyFilters);
document.getElementById("filterDateRange").addEventListener("change", applyFilters);

/* Run once on load */
document.addEventListener("DOMContentLoaded", applyFilters);

/* ============================================================
   EXPORT TO XLS (NOT CSV)
   ============================================================ */
/* ========== EXPORT XLS (Styled Excel Report) ========== */

document.getElementById("btnExportExcel").addEventListener("click", () => {
    const logs = filteredResults || getLogs();
    if (!logs.length) {
        alert("No records to export.");
        return;
    }

    let table = `
        <table border="1">
            <thead>
                <tr style="font-weight:bold; background:#e6e6e6;">
                    <th>Date</th>
                    <th>Time</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Reason</th>
                    <th>Services</th>
                </tr>
            </thead>
            <tbody>
    `;

    logs.forEach(log => {
        table += `
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

    table += `</tbody></table>`;

    let blob = new Blob([table], {
        type: "application/vnd.ms-excel"
    });

    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "AMS_Search_Report.xls";
    a.click();
});

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
