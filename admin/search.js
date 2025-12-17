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
    if (!entry || !entry.date) return null;
    // supports MM/DD/YYYY
    const [month, day, year] = entry.date.split("/");
    return new Date(year, month - 1, day);
}

/* =========================================================
   DATE RANGE TOGGLE (SAFE FOR DYNAMIC DOM)
========================================================= */

window.toggleCustomDateRange = function (value) {
    const custom = document.getElementById("customDateRange");
    if (!custom) return;
    custom.style.display = value === "custom" ? "block" : "none";
};

/* =========================================================
   RUN SEARCH
========================================================= */

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

    if (range === "today") {
        startDate = new Date(today);
        endDate = new Date(today);
    }

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
        startDate = new Date(startInput);
        endDate = new Date(endInput);
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

    renderSearchResults(results);
};

/* =========================================================
   RENDER RESULTS
========================================================= */

function renderSearchResults(results) {
    const container = document.getElementById("searchResults");
    if (!container) return;

    container.innerHTML = "";

    if (!results.length) {
        container.innerHTML = "<p>No results found</p>";
        return;
    }

    results.forEach(entry => {
        const div = document.createElement("div");
        div.className = "result-row";
        div.innerHTML = `
            <strong>${entry.first} ${entry.last}</strong><br>
            Company: ${entry.company}<br>
            Date: ${entry.date}
            <hr>
        `;
        container.appendChild(div);
    });
}
