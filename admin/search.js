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

  renderResults(results);
}

/* =========================
   RENDER RESULTS
========================= */
function renderResults(results) {
  const container = document.getElementById("searchResultsTable");

  if (!container) {
    console.error("searchResultsTable not found");
    return;
  }

  if (results.length === 0) {
    container.innerHTML = "<p>No matching records found.</p>";
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
          <th>Service</th>
          <th>Reason</th>
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
        <td>${log.service || "-"}</td>
        <td>${entry.reason || ""}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";

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
