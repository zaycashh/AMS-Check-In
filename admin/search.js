console.log("Admin Search Module Loaded");

/* =========================================================
   RENDER SEARCH LOG UI (INJECT HTML)
========================================================= */
function renderSearchUI() {
  const container = document.getElementById("tabSearch");
  if (!container) return;

  container.innerHTML = `
    <h2 class="section-title">Search Log</h2>

    <div class="export-bar">
      <button onclick="exportSearchLogExcel()">Export Excel</button>
      <button onclick="exportSearchPdf()">Export PDF</button>
      <span id="searchResultCount" style="margin-left:12px;opacity:.7;"></span>
    </div>

    <div class="search-form">

      <div class="form-row">
        <label>First Name</label>
        <input type="text" id="filterFirstName">
      </div>

      <div class="form-row">
        <label>Last Name</label>
        <input type="text" id="filterLastName">
      </div>

      <div class="form-row">
        <label>Company</label>
        <select id="searchFilterCompany" onchange="toggleSearchCompanyText(this.value)">
          <option value="">All Companies</option>
          <option value="__custom__">Type Company (Custom)</option>
        </select>

        <input
          id="searchFilterCompanyText"
          type="text"
          placeholder="Enter company name"
          style="display:none;margin-top:6px;"
        />
      </div>

      <div class="form-row">
        <label>Date Range</label>
        <select id="filterDateRange" onchange="toggleCustomDateRange(this.value)">
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="thisWeek">This Week</option>
          <option value="lastWeek">Last Week</option>
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="thisYear">This Year</option>
          <option value="lastYear">Last Year</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div class="form-row" id="customDateRange" style="display:none;">
        <label>Start Date</label>
        <input type="date" id="filterStartDate">
        <label style="margin-top:6px;">End Date</label>
        <input type="date" id="filterEndDate">
      </div>

      <div class="search-actions">
        <button onclick="runSearch()">Search</button>
        <button onclick="clearSearch()">Clear</button>
      </div>

    </div>

    <table class="results-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>First</th>
          <th>Last</th>
          <th>Company</th>
          <th>Reason</th>
          <th>Services</th>
          <th>Signature</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="searchResultsTable"></tbody>
    </table>
  `;

  populateSearchCompanies();
  clearSearchTable();
}

/* =========================================================
   DATA HELPERS
========================================================= */
function getCachedLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}
async function fetchLogsFromCloud() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs",
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("Cloud fetch failed");

    const logs = await res.json();
    localStorage.setItem("ams_logs", JSON.stringify(logs));

    console.log("☁️ Logs loaded from cloud:", logs.length);
    return logs;

  } catch (err) {
    console.warn("⚠️ Cloud unavailable, using local logs");
    return getCachedLogs();
  }
}

function dedupeLogsById(logs) {
  return Array.from(
    new Map(logs.map(l => [l.id || l.timestamp, l])).values()
  );
}

function normalizeDateOnly(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(0, 0, 0, 0);
  return d;
}

/* =========================================================
   SEARCH
========================================================= */
window.runSearch = async function () {
  const logs = dedupeLogsById(await fetchLogsFromCloud());

  const first = document.getElementById("filterFirstName").value.toLowerCase();
  const last = document.getElementById("filterLastName").value.toLowerCase();

  const companySel = document.getElementById("searchFilterCompany").value;
  const companyTxt = document.getElementById("searchFilterCompanyText").value.toLowerCase();
  const company = companySel === "__custom__" ? companyTxt : companySel;

  const range = document.getElementById("filterDateRange").value;
  const start = document.getElementById("filterStartDate").value;
  const end = document.getElementById("filterEndDate").value;

  const today = new Date();
today.setHours(0, 0, 0, 0);

let startDate = null;
let endDate = null;

switch (range) {
  case "today":
    startDate = new Date(today);
    endDate = new Date(today);
    break;

  case "yesterday":
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 1);
    endDate = new Date(startDate);
    break;

  case "thisWeek":
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate = new Date(today);
    break;

  case "lastWeek":
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    break;

  case "thisMonth":
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today);
    break;

  case "lastMonth":
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    break;

  case "thisYear":
    startDate = new Date(today.getFullYear(), 0, 1);
    endDate = new Date(today);
    break;

  case "lastYear":
    startDate = new Date(today.getFullYear() - 1, 0, 1);
    endDate = new Date(today.getFullYear() - 1, 11, 31);
    break;

  case "custom":
    if (start && end) {
      startDate = normalizeDateOnly(start);
      endDate = normalizeDateOnly(end);
    }
    break;
}

const results = logs.filter(l => {
  const logDate = normalizeDateOnly(l.date);
  if (!logDate) return false;

  if (startDate && logDate < startDate) return false;
  if (endDate && logDate > endDate) return false;

  if (first && !l.first.toLowerCase().includes(first)) return false;
  if (last && !l.last.toLowerCase().includes(last)) return false;
  if (company && !l.company.toLowerCase().includes(company)) return false;

  return true;
});
   
   results.sort((a, b) => {
  return (b.timestamp || 0) - (a.timestamp || 0);
});

  window.searchResults = results;
  renderSearchResults(results);
};

async function deleteDonor(id) {
  let logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");
  const log = logs.find(l => l.id === id);

  if (!log) {
    alert("Record not found.");
    return;
  }

  // 🔒 STEP 1B — LOCK ENFORCEMENT
  if (log.locked !== false) {
    const pin = prompt(
      "This record is LOCKED.\n\nEnter Admin PIN to delete:"
    );

    if (pin !== window.ADMIN_PIN) {
      alert("Invalid PIN. Delete cancelled.");
      return;
    }

    console.warn("🔐 ADMIN OVERRIDE DELETE", {
      recordId: id,
      timestamp: new Date().toISOString()
    });
  }

  if (!confirm("Are you sure you want to delete this donor record?\n\nThis cannot be undone.")) {
    return;
  }

  // 1️⃣ Remove from local cache
  logs = logs.filter(l => l.id !== id);
  localStorage.setItem("ams_logs", JSON.stringify(logs));

  // 2️⃣ Attempt cloud delete
  try {
    await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs/" + id,
      { method: "DELETE" }
    );
  } catch (err) {
    console.warn("Cloud delete failed, local only", err);
  }

  // 3️⃣ Refresh UI
  window.searchResults = window.searchResults.filter(r => r.id !== id);
  renderSearchResults(window.searchResults);
}

/* =========================================================
   RENDER RESULTS
========================================================= */
function renderSearchResults(results) {
  const tbody = document.getElementById("searchResultsTable");
  const counter = document.getElementById("searchResultCount");
  tbody.innerHTML = "";

  counter.textContent = results.length
    ? `${results.length} record(s)`
    : "No results";

  if (!results.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.6;">No records</td></tr>`;
    return;
  }

  results.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>${r.date}</td>
        <td>${r.time}</td>
        <td>${r.first}</td>
        <td>${r.last}</td>
        <td>${r.company}</td>
        <td>${r.reason}</td>
        <td>${r.services}</td>
        <td>
          ${
            r.signature
              ? `<img src="${r.signature}" style="width:90px;height:30px;">`
              : ""
          }
        </td>
        <td style="white-space:nowrap;">
          ${
            r.locked !== false
              ? `<span style="
                  display:inline-block;
                  padding:2px 6px;
                  margin-right:6px;
                  font-size:11px;
                  background:#eee;
                  border-radius:4px;
                  font-weight:600;
                ">🔒 LOCKED</span>`
              : ""
          }
          <button onclick="deleteDonor('${r.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   HELPERS
========================================================= */
function populateSearchCompanies() {
  const sel = document.getElementById("searchFilterCompany");
  const companies = JSON.parse(localStorage.getItem("ams_companies") || "[]");
  companies.forEach(c => {
    const o = document.createElement("option");
    o.value = c.toLowerCase();
    o.textContent = c;
    sel.appendChild(o);
  });
}

window.toggleSearchCompanyText = val => {
  const i = document.getElementById("searchFilterCompanyText");
  i.style.display = val === "__custom__" ? "block" : "none";
};

window.toggleCustomDateRange = val => {
  document.getElementById("customDateRange").style.display =
    val === "custom" ? "block" : "none";
};

window.clearSearch = function () {
  renderSearchUI();
};

function clearSearchTable() {
  const t = document.getElementById("searchResultsTable");
  if (t) t.innerHTML = `<tr><td colspan="9" style="text-align:center;opacity:.6;">Run a search</td></tr>`;
}

function exportSearchPdf() {
  if (!window.searchResults || !window.searchResults.length) {
    alert("No search results to export.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  const HEADER_BLUE = [25, 90, 140];
  const DARK_TEXT = [40, 40, 40];

  /* ===============================
     DATE RANGE LABEL
  =============================== */
  const range = document.getElementById("filterDateRange")?.value || "";
  const start = document.getElementById("filterStartDate")?.value;
  const end = document.getElementById("filterEndDate")?.value;

  let rangeLabel = "ALL DATES";

  if (range === "today") rangeLabel = "TODAY";
  if (range === "yesterday") rangeLabel = "YESTERDAY";
  if (range === "thisWeek") rangeLabel = "THIS WEEK";
  if (range === "lastWeek") rangeLabel = "LAST WEEK";
  if (range === "thisMonth") rangeLabel = "THIS MONTH";
  if (range === "lastMonth") rangeLabel = "LAST MONTH";
  if (range === "thisYear") rangeLabel = "THIS YEAR";
  if (range === "lastYear") rangeLabel = "LAST YEAR";

  if (range === "custom" && start && end) {
    rangeLabel = `CUSTOM: ${start} – ${end}`;
  }

  /* ===============================
     HEADER BAR
  =============================== */
  doc.setFillColor(...HEADER_BLUE);
  doc.rect(0, 0, 297, 34, "F");

  /* ===============================
     LOGO (DRAW AFTER HEADER)
  =============================== */
  const logoImg = document.getElementById("amsLogoBase64");
  if (logoImg?.src) {
    doc.addImage(logoImg.src, "PNG", 14, 9, 34, 16);
  }

  /* ===============================
     TITLE
  =============================== */
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("AMS Search Log Report", 148, 18, { align: "center" });

  doc.setFontSize(11);
  doc.text(rangeLabel, 148, 26, { align: "center" });

  doc.setTextColor(...DARK_TEXT);

  /* ===============================
     TABLE DATA
  =============================== */
  const tableBody = window.searchResults.map(r => [
    r.date || "",
    r.time || "",
    r.first || "",
    r.last || "",
    r.company || "",
    r.reason || "",
    r.services || "",
    ""
  ]);

  /* ===============================
     TABLE
  =============================== */
  doc.autoTable({
    startY: 42,
    head: [[
      "Date",
      "Time",
      "First",
      "Last",
      "Company",
      "Reason",
      "Services",
      "Signature"
    ]],
    body: tableBody,
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: "middle"
    },
    headStyles: {
      fillColor: HEADER_BLUE,
      textColor: 255,
      fontStyle: "bold"
    },
    columnStyles: {
      7: { cellWidth: 28 }
    },
    didDrawCell(data) {
      if (data.column.index === 7 && data.cell.section === "body") {
        const sig = window.searchResults[data.row.index]?.signature;
        if (sig) {
          doc.addImage(sig, "PNG",
            data.cell.x + 3,
            data.cell.y + 2,
            22,
            8
          );
        }
      }
    }
  });

  /* ===============================
     FOOTER (BOTTOM-RIGHT)
  =============================== */
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    290,
    200,
    { align: "right" }
  );

  doc.save(`AMS_Search_Log_${Date.now()}.pdf`);
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  renderSearchUI();
  await fetchLogsFromCloud();
});
