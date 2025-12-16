/* =========================================================
   GLOBAL HELPERS
========================================================= */

function getLogs() {
    return JSON.parse(localStorage.getItem("ams_logs")) || [];
}

function saveLogs(logs) {
    localStorage.setItem("ams_logs", JSON.stringify(logs));
}

/* =========================================================
   SEARCH LOG (FIXED + SINGLE SOURCE OF TRUTH)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const runBtn = document.getElementById("runSearch");
    const clearBtn = document.getElementById("clearSearch");
    const resultsBox = document.getElementById("searchResultsTable");

    if (!runBtn || !resultsBox) return;

    runBtn.addEventListener("click", () => {
        const first = document.getElementById("filterFirstName").value.trim().toLowerCase();
        const last = document.getElementById("filterLastName").value.trim().toLowerCase();
        const company = document.getElementById("filterCompany").value;

        const logs = getLogs();

        const results = logs.filter(entry => {
            const ef = (entry.first || "").toLowerCase();
            const el = (entry.last || "").toLowerCase();
            const ec = entry.company || "";

            return (
                (!first || ef.includes(first)) &&
                (!last || el.includes(last)) &&
                (!company || company === "All Companies" || ec === company)
            );
        });

        resultsBox.style.display = "block";
        resultsBox.innerHTML = "";

        if (!results.length) {
            resultsBox.innerHTML = "<p>No results found</p>";
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
                    <td>${r.date || ""}</td>
                    <td>${r.time || ""}</td>
                    <td>${r.first || ""}</td>
                    <td>${r.last || ""}</td>
                    <td>${r.company || ""}</td>
                    <td>${r.reason || ""}</td>
                </tr>
            `;
        });

        html += "</tbody></table>";
        resultsBox.innerHTML = html;
    });

    clearBtn?.addEventListener("click", () => {
        document.getElementById("filterFirstName").value = "";
        document.getElementById("filterLastName").value = "";
        document.getElementById("filterCompany").value = "";
        document.getElementById("filterDateRange").value = "";
        resultsBox.innerHTML = "";
    });
});

/* =========================================================
   (OTHER EXISTING APP LOGIC CONTINUES BELOW)
   ✔ Admin
   ✔ Check-in
   ✔ Signature
   ✔ Recent logs
   ✔ Company management
========================================================= */
