/* ============================================================
   ADMIN SEARCH MODULE – FIXED FOR AMS HTML
   (NO ADMIN / SIGNATURE / LOGIN CONFLICTS)
============================================================ */

console.log("Admin Search Module Loaded");

/* --------------------------------------
   LOAD LOGS
-------------------------------------- */
function getLogs() {
    return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

/* --------------------------------------
   FILTER + SEARCH
-------------------------------------- */
function runSearch() {
    const logs = getLogs();

    const first = document.getElementById("filterFirstName").value.trim().toLowerCase();
    const last = document.getElementById("filterLastName").value.trim().toLowerCase();
    const company = document.getElementById("filterCompany").value;
    const range = document.getElementById("filterDateRange").value;

    let results = logs.filter(log => {
        const f = (log.first || "").toLowerCase();
        const l = (log.last || "").toLowerCase();

        if (first && !f.includes(first)) return false;
        if (last && !l.includes(last)) return false;
        if (company && company !== "All Companies" && log.company !== company) return false;

        return true;
    });

    renderSearchResults(results);
}

/* --------------------------------------
   RENDER RESULTS
-------------------------------------- */
function renderSearchResults(results) {
    const container = document.getElementById("searchResultsTable");

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
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach(r => {
        html += `
            <tr>
                <td>${r.date}</td>
                <td>${r.time}</td>
                <td>${r.first}</td>
                <td>${r.last}</td>
                <td>${r.company}</td>
                <td>${r.reason}</td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}

/* --------------------------------------
   CLEAR FILTERS
-------------------------------------- */
function clearSearch() {
    document.getElementById("filterFirstName").value = "";
    document.getElementById("filterLastName").value = "";
    document.getElementById("filterCompany").value = "";
    document.getElementById("filterDateRange").value = "";
    document.getElementById("searchResultsTable").innerHTML = "";
}

/* --------------------------------------
   INIT
-------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    const btnSearch = document.getElementById("runSearch");
    const btnClear = document.getElementById("clearSearch");

    if (btnSearch) btnSearch.addEventListener("click", runSearch);
    if (btnClear) btnClear.addEventListener("click", clearSearch);
});
