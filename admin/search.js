let currentSearchResults = [];

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
  startDate.setHours(0, 0, 0, 0);

  endDate = new Date(startDate);
  endDate.setHours(23, 59, 59, 999);
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
/* =========================================================
   EXPORT FUNCTIONS (SEARCH LOG)
========================================================= */

window.exportSearchExcel = function () {
    if (!currentSearchResults.length) {
        alert("No search results to export");
        return;
    }

    const data = currentSearchResults.map(entry => ({
        Date: entry.date || "",
        Time: entry.time || "",
        First: entry.first || "",
        Last: entry.last || "",
        Company: entry.company || "",
        Reason: entry.reason || "",
        Services: Array.isArray(entry.services)
            ? entry.services.join(", ")
            : entry.services || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Search Log");

    XLSX.writeFile(workbook, "AMS_Search_Log.xlsx");
};

document.getElementById("exportPDF").addEventListener("click", () => {
    if (!currentSearchResults.length) {
        alert("No results to export.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");

    doc.setFontSize(18);
    doc.text("AMS Search Log Report", 14, 18);

    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`Total Records: ${currentSearchResults.length}`, 14, 34);

    const company = document.getElementById("filterCompany").value || "All Companies";
    const range = document.getElementById("filterDateRange").value || "All Dates";

    doc.text(`Company: ${company}`, 14, 42);
    doc.text(`Date Range: ${range}`, 14, 50);

    const rows = currentSearchResults.map(r => ([
        r.date || "",
        r.time || "",
        r.first || "",
        r.last || "",
        r.company || "",
        r.reason || "",
        (r.services || []).join(", ")
    ]));

    doc.autoTable({
        startY: 60,
        head: [[
            "Date",
            "Time",
            "First",
            "Last",
            "Company",
            "Reason",
            "Services"
        ]],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: {
            fillColor: [30, 58, 89],
            textColor: 255
        }
    });

    doc.save(`AMS_Search_Log_${Date.now()}.pdf`);
});
