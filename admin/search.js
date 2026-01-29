const TEST_REASONS = [
  "Pre-Employment",
  "Random",
  "Post-Accident",
  "Reasonable Suspicion",
  "Return-to-Duty",
  "Follow-Up"
];

const SERVICE_OPTIONS = [
  "DOT Drug Test",
  "NON-DOT Drug Test",
  "DOT Physical",
  "Vision Test",
  "Breath Alcohol Test"
];

/* =========================================================
   ADMIN SECURITY CONFIG
========================================================= */
const ADMIN_PIN_VALUE = "2468"; // CHANGE THIS
Object.defineProperty(window, "ADMIN_PIN", {
  value: ADMIN_PIN_VALUE,
  writable: false,
  configurable: false
});

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

      <div class="form-row" style="position:relative;">
  <label>Company</label>
  <input
    type="text"
    id="searchCompanyInput"
    placeholder="Start typing company name..."
    autocomplete="off"
  />
  <div
    id="searchCompanySuggestions"
    class="company-suggestions"
    style="display:none;"
  ></div>
</div>

      <div class="form-row">
  <label>Date Range</label>
  <select id="filterDateRange" onchange="toggleCustomDateRange(this.value)">
    <option value="">All Dates</option>

    <!-- CURRENT -->
    <option value="today">Today</option>
    <option value="thisWeek">This Week</option>
    <option value="thisMonth">This Month</option>
    <option value="thisYear">This Year</option>

    <!-- PAST -->
    <option value="yesterday">Yesterday</option>
    <option value="lastWeek">Last Week</option>
    <option value="lastMonth">Last Month</option>
    <option value="lastYear">Last Year</option>

    <!-- CUSTOM -->
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

  // 🔒 FORCE EMPTY STATE — NOTHING RENDERS UNTIL SEARCH
window.searchResults = [];
clearSearchTable();

const counter = document.getElementById("searchResultCount");
if (counter) counter.textContent = "";

setupSearchCompanyAutocomplete();
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

    console.log("☁️ Logs loaded from cloud:", logs.length);

    // ❌ DO NOT STORE IN LOCALSTORAGE (too large)
    return logs;

  } catch (err) {
    console.warn("⚠️ Cloud unavailable, using local logs");
    return getCachedLogs(); // fallback only
  }
}

function dedupeLogsById(logs) {
  return Array.from(
    new Map(
      logs
        .filter(l => l.id) // 🔒 ONLY REAL CLOUD RECORDS
        .map(l => [l.id, l])
    ).values()
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

  const counter = document.getElementById("searchResultCount");
  if (counter) counter.textContent = "Searching...";
   
  const logs = dedupeLogsById(await fetchLogsFromCloud());

  const first = document.getElementById("filterFirstName").value.toLowerCase();
  const last = document.getElementById("filterLastName").value.toLowerCase();

  const company =
  document.getElementById("searchCompanyInput")?.value
    .trim()
    .toLowerCase();

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
    if (!start || !end) {
      alert("Please select both a Start Date and End Date.");
      return;
    }
    startDate = normalizeDateOnly(start);
    endDate = normalizeDateOnly(end);
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

  // 🔒 LOCKED RECORD → REQUIRE PIN
  if (log.locked !== false) {
    const pin = prompt(
      "🔒 This record is LOCKED.\n\nEnter Admin PIN to delete:"
    );

    if (pin !== window.ADMIN_PIN) {
      alert("Invalid PIN. Delete cancelled.");
      return;
    }

    console.warn("🔐 ADMIN DELETE OVERRIDE", {
      recordId: id,
      action: "DELETE",
      timestamp: new Date().toISOString()
    });
  }

  if (!confirm(
    "Are you sure you want to delete this donor record?\n\nThis cannot be undone."
  )) {
    return;
  }

  // 1️⃣ Remove locally
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
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;opacity:.6;">
          No records
        </td>
      </tr>`;
    return;
  }

  results.forEach(r => {
    tbody.innerHTML += `
      <tr class="export-row">
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

          ${
            r.id
              ? `<button onclick='openEditModal(${JSON.stringify(r)})'>Edit</button>`
              : `<button disabled title="Legacy record – cannot edit">Edit</button>`
          }
          <button onclick="deleteDonor('${r.id}')">Delete</button>
        </td>
      </tr>
    `;
  });
}
/* =========================================================
   EDIT MODAL
========================================================= */
function openEditModal(record) {
  const companies = JSON.parse(
    localStorage.getItem("ams_companies") || "[]"
  );

  const modal = document.createElement("div");
  modal.className = "edit-modal";

  modal.innerHTML = `
    <div class="edit-box">
      <h3>Edit Donor Record</h3>

      <!-- COMPANY -->
      <label>Company</label>
      <input
        list="companyList"
        id="editCompany"
        value="${record.company || ""}"
      />
      <datalist id="companyList">
        ${companies.map(c => `<option value="${c}">`).join("")}
      </datalist>

      <!-- REASON -->
      <label>Reason for Test</label>
      <select id="editReason">
        ${TEST_REASONS.map(r =>
          `<option value="${r}" ${r === record.reason ? "selected" : ""}>
            ${r}
          </option>`
        ).join("")}
      </select>

      <!-- SERVICES -->
      <label>Services</label>
      <div class="service-grid">
        ${SERVICE_OPTIONS.map(s => {
          const checked = record.services?.includes(s);
          return `
            <label>
              <input type="checkbox" value="${s}" ${checked ? "checked" : ""}>
              ${s}
            </label>
          `;
        }).join("")}
      </div>

      <div class="edit-actions">
        <button id="saveEdit">Save</button>
        <button id="cancelEdit">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("cancelEdit").onclick = () => modal.remove();

  document.getElementById("saveEdit").onclick = async () => {
    const company = document.getElementById("editCompany").value.trim();
    const reason = document.getElementById("editReason").value;

    const services = Array.from(
      modal.querySelectorAll("input[type=checkbox]:checked")
    ).map(cb => cb.value);

    if (!company || !reason || !services.length) {
      alert("All fields are required.");
      return;
    }

    await saveEdit(record.id, {
      company,
      reason,
      services: services.join(", ")
    });

    modal.remove();
  };
}

/* =========================================================
   SAVE EDIT
========================================================= */
async function saveEdit(id, updated) {
  const res = await fetch(
    `https://ams-checkin-api.josealfonsodejesus.workers.dev/logs/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    }
  );

  if (!res.ok) {
    alert("Update failed");
    return;
  }

  alert("Record updated successfully");
  runSearch();
}

/* =========================================================
   HELPERS
========================================================= */
function setupSearchCompanyAutocomplete() {
  const input = document.getElementById("searchCompanyInput");
  const box = document.getElementById("searchCompanySuggestions");
  if (!input || !box) return;

  const companies = JSON.parse(
    localStorage.getItem("ams_companies") || "[]"
  );

  input.addEventListener("input", () => {
    const val = input.value.trim().toLowerCase();
    box.innerHTML = "";

    if (!val) {
      box.style.display = "none";
      return;
    }

    const matches = companies.filter(c =>
      c.toLowerCase().includes(val)
    );

    if (!matches.length) {
      box.style.display = "none";
      return;
    }

    matches.slice(0, 8).forEach(c => {
      const div = document.createElement("div");
      div.textContent = c;
      div.className = "company-suggestion";
      div.onclick = () => {
        input.value = c;
        box.style.display = "none";
      };
      box.appendChild(div);
    });

    box.style.display = "block";
  });

  document.addEventListener("click", e => {
    if (!box.contains(e.target) && e.target !== input) {
      box.style.display = "none";
    }
  });
}


window.clearSearch = function () {
  renderSearchUI();
  toggleCustomDateRange(""); // hide custom date inputs
};

function toggleCustomDateRange(value) {
  const box = document.getElementById("customDateRange");
  if (!box) return;

  box.style.display = value === "custom" ? "block" : "none";
}

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
  doc.rect(0, 0, 297, 44, "F");

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
  doc.setFontSize(10);
  doc.text(
  `Total Records: ${window.searchResults.length}`,
  148,
  32,
  { align: "center" }
);


  doc.setTextColor(...DARK_TEXT);

  /* ===============================
   TABLE DATA (EXPORT ONLY REAL ROWS)
=============================== */
const rows = Array.from(
  document.querySelectorAll("#searchResultsTable tr.export-row")
);

const tableBody = rows.map(row =>
  Array.from(row.children)
    .slice(0, 8)
    .map((td, index) => {
      // 🔧 FIX TIME COLUMN (index 1)
      if (index === 1) {
        return td.innerText.replace(/\s+/g, " ").trim();
      }
      return td.innerText.trim();
    })
);

  /* ===============================
     TABLE
  =============================== */
  doc.autoTable({
  startY: 48,
  tableWidth: "auto",
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
    font: "helvetica",
    fontSize: 10,
    cellPadding: 5,
    valign: "middle",
    overflow: "linebreak",
    lineWidth: 0.1
  },
  rowPageBreak: "avoid",
  headStyles: {
    fillColor: HEADER_BLUE,
    textColor: 255,
    fontStyle: "bold"
  },
  columnStyles: {
  1: {
    cellWidth: 32,
    overflow: "visible",
    whiteSpace: "nowrap"
  }
},

  didDrawCell(data) {
    if (data.column.index === 7 && data.cell.section === "body") {
      const row = rows[data.row.index];
      const img = row?.querySelector("img");
      const sig = img?.src;

      if (sig) {
        doc.addImage(
          sig,
          "PNG",
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

window.exportSearchLogExcel = function () {
  if (!window.searchResults || !window.searchResults.length) {
    alert("No search results to export.");
    return;
  }

  /* ===============================
     DATE RANGE LABEL (MATCH PDF)
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
     BUILD SHEET (TITLE + META)
  =============================== */
  const sheetData = [
  ["AMS Search Log Report"],
  [`Date Range: ${rangeLabel}`],
  [`Total Records: ${window.searchResults.length}`],
  [`Generated: ${new Date().toLocaleString()}`],
  [],
  [
    "Date",
    "Time",
    "First",
    "Last",
    "Company",
    "Reason",
    "Services",
    "Signature"
  ]
];


  /* ===============================
     DATA ROWS
  =============================== */
  window.searchResults.forEach(r => {
    sheetData.push([
      r.date || "",
      r.time || "",
      r.first || "",
      r.last || "",
      r.company || "",
      r.reason || "",
      r.services || "",
      r.signature ? "SIGNED" : ""
    ]);
  });

  /* ===============================
     CREATE WORKBOOK
  =============================== */
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Merge title & meta rows
  ws["!merges"] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title
  { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Date Range
  { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // Total Records
  { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } }, // Generated
  { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }  // Spacer
];


  // Column widths
  ws["!cols"] = [
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 14 }, // First
    { wch: 14 }, // Last
    { wch: 22 }, // Company
    { wch: 18 }, // Reason
    { wch: 30 }, // Services
    { wch: 12 }  // Signature
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Search Log");

  XLSX.writeFile(
    wb,
    `AMS_Search_Log_${Date.now()}.xlsx`
  );
};

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  renderSearchUI();
});
