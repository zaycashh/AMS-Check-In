// trigger-pages-runner
const TEST_REASONS = [
  "Pre-Employment",
  "Random",
  "Post-Accident",
  "Reasonable Suspicion",
  "Return-to-Duty",
  "Follow-Up",
  "Other"
];

const SERVICE_OPTIONS = [
  "DOT Drug Test",
  "NON-DOT Drug Test",
  "DOT Physical",
  "Vision Test",
  "DOT Alcohol Test",
  "NON-DOT Alcohol Test",
  "DNA (Paternity Test)",
  "Other",
];
/* =========================================================
   ADMIN SECURITY CONFIG
========================================================= */
let ADMIN_SESSION_UNLOCKED = false;

function lockAdminSession() {
  ADMIN_SESSION_UNLOCKED = false;
  console.warn("🔒 ADMIN SESSION RE-LOCKED");
}

const ADMIN_PIN_VALUE = "2468"; // CHANGE THIS
Object.defineProperty(window, "ADMIN_PIN", {
  value: ADMIN_PIN_VALUE,
  writable: false,
  configurable: false
});

console.log("Admin Search Module Loaded");

function requireAdminAccess(action = "ADMIN") {
  if (ADMIN_SESSION_UNLOCKED) return true;

  const pin = prompt(`🔐 ${action} access required.\n\nEnter Admin PIN:`);

  if (pin !== window.ADMIN_PIN) {
    alert("Invalid Admin PIN.");
    return false;
  }

  ADMIN_SESSION_UNLOCKED = true;

  console.warn("🔓 ADMIN SESSION UNLOCKED", {
    action,
    timestamp: new Date().toISOString()
  });

  return true;
}

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
  try {
    const data = JSON.parse(localStorage.getItem("ams_logs") || "[]");
    // ✅ GUARD: cached data must be an array
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchLogsFromCloud() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs?limit=2000",
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("Cloud fetch failed");

    const data = await res.json();

    // ✅ GUARD: API must return an array
    const logs = Array.isArray(data) ? data : getCachedLogs();

    console.log("☁️ Logs loaded from cloud:", logs.length);

    // ✅ Save to localStorage for other modules
    localStorage.setItem("ams_logs", JSON.stringify(logs));

    return logs;

  } catch (err) {
    console.warn("⚠️ Cloud unavailable, using local logs");
    showToast("⚠️ Cloud unavailable — using local data", "error");
    return getCachedLogs();
  }
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

  const logs = await fetchLogsFromCloud();

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
  if (!l || !l.id) return false;

  // TEXT FILTERS
  if (first && !l.first?.toLowerCase().includes(first)) return false;
  if (last && !l.last?.toLowerCase().includes(last)) return false;
  if (company && !l.company?.toLowerCase().includes(company)) return false;

  // ✅ ALL DATES = NO DATE FILTERING
  if (!range) return true;

  const logDate = normalizeDateOnly(l.date);
  if (!logDate) return false;

  if (startDate && logDate < startDate) return false;
  if (endDate && logDate > endDate) return false;

  return true;
});

   results.sort((a, b) => {
  return (b.timestamp || 0) - (a.timestamp || 0);
});

  window.searchResults = results;
  renderSearchResults(results);
};

function requestAdminEdit(record) {
  if (!requireAdminAccess("EDIT")) return;
  openEditModal(record);
}

function requestAdminEditById(id) {
  const record = window.searchResults.find(r => r.id === id);
  if (!record) {
    alert("Record not found");
    return;
  }

  const row = document.querySelector(
    `button[onclick="requestAdminEditById('${id}')"]`
  )?.closest("tr");

  if (row) {
    row.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  requestAdminEdit(record);
}

function requestAdminDelete(id) {
  if (!requireAdminAccess()) return;
  deleteDonor(id);
}

async function deleteDonor(id) {
  if (!requireAdminAccess()) return;

  const record = window.searchResults.find(r => r.id === id);

  if (!record || !record.timestamp) {
    alert("This record cannot be deleted (legacy or missing timestamp).");
    return;
  }

  if (!confirm(
    "Are you sure you want to delete this donor record?\n\nThis cannot be undone."
  )) {
    return;
  }

  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs-by-timestamp",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: record.timestamp
        })
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Cloud delete failed");
    }

    console.log("☁️ Cloud record deleted:", record.timestamp);

    const updatedCache = getCachedLogs().filter(
      r => r.timestamp !== record.timestamp
    );
    localStorage.setItem("ams_logs", JSON.stringify(updatedCache));

    window.searchResults = window.searchResults.filter(
      r => r.timestamp !== record.timestamp
    );

    renderSearchResults(window.searchResults);

    showToast("✅ Record deleted successfully");

  } catch (err) {
    console.error("DELETE ERROR:", err);
    showToast("❌ Delete failed", "error");
  }
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
            r.locked === true
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
              ? `<button onclick="requestAdminEditById('${r.id}')">Edit</button>`
              : `<button disabled>Edit</button>`
          }

          ${
            r.id
              ? `<button onclick="requestAdminDelete('${r.id}')">Delete</button>`
              : `<button disabled>Delete</button>`
          }
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   EDIT MODAL
========================================================= */
function openEditModal(record) {
  const existing = document.querySelector(".edit-modal");
  if (existing) existing.remove();

  const companies = JSON.parse(
    localStorage.getItem("ams_companies") || "[]"
  );

  const modal = document.createElement("div");
  modal.className = "edit-modal";

  modal.innerHTML = `
    <div class="edit-box">
      <h3>Edit Donor Record</h3>

      <div class="edit-row">

        <div class="field">
          <label>Company</label>
          <input list="companyList" id="editCompany" value="${record.company || ""}">
          <datalist id="companyList">
            ${companies.map(c => `<option value="${c}">`).join("")}
          </datalist>
        </div>

        <div class="field">
          <label>Reason for Test</label>
          <select id="editReason">
            ${TEST_REASONS.map(r =>
              `<option value="${r}" ${r === record.reason ? "selected" : ""}>${r}</option>`
            ).join("")}
          </select>
        </div>

        <div class="field">
          <label>Services</label>
          <div class="multi-select" id="serviceDropdown">
            <div class="multi-select-display" id="serviceDisplay"></div>
            <div class="multi-select-options" id="serviceOptions">
              ${SERVICE_OPTIONS.map(s => {
                const checked =
                  typeof record.services === "string"
                    ? record.services.split(", ").includes(s)
                    : false;
                return `
                  <label>
                    <input type="checkbox" value="${s}" ${checked ? "checked" : ""}>
                    ${s}
                  </label>
                `;
              }).join("")}
            </div>
          </div>
        </div>

      </div>

      <div class="edit-actions">
        <button id="saveEdit">Save</button>
        <button id="cancelEdit">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => {
    modal.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });

  /* ================================
     SERVICES MULTI-SELECT LOGIC
  ================================= */
  const dropdown = modal.querySelector("#serviceDropdown");
  const display = modal.querySelector("#serviceDisplay");
  const options = modal.querySelector("#serviceOptions");
  const checkboxes = options.querySelectorAll("input[type=checkbox]");

  const initialServices = Array.isArray(record.services)
    ? record.services
    : typeof record.services === "string"
      ? record.services.split(",").map(s => s.trim())
      : [];

  checkboxes.forEach(cb => {
    cb.checked = initialServices.includes(cb.value);
  });

  function updateServiceDisplay() {
    const selected = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    display.textContent = selected.length ? selected.join(", ") : "Select services";
  }

  updateServiceDisplay();

  display.onclick = e => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  };

  checkboxes.forEach(cb => {
    cb.addEventListener("change", updateServiceDisplay);
  });

  modal.addEventListener("click", e => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
  });

  /* ================================
     ACTION BUTTONS
  ================================= */
  const saveBtn = modal.querySelector("#saveEdit");
  const cancelBtn = modal.querySelector("#cancelEdit");

  cancelBtn.onclick = () => modal.remove();

  saveBtn.onclick = async () => {
    const company = modal.querySelector("#editCompany").value.trim();
    const reason = modal.querySelector("#editReason").value;

    const services = Array.from(
      modal.querySelectorAll("#serviceOptions input:checked")
    ).map(cb => cb.value);

    if (!company || !reason || !services.length) {
      alert("All fields are required.");
      return;
    }

    const updated = {
      company,
      reason,
      services,
      locked: true
    };

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    showToast("💾 Saving changes...", "info");

    try {
      await saveEdit(record, updated);

      lockAdminSession();
      showToast("✅ Record updated successfully");

      modal.remove();

    } catch (err) {
      console.error("SAVE FAILED:", err);

      showToast("❌ Save failed — try again", "error");

      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }
  };
}

/* =========================================================
   SAVE EDIT (OUTSIDE MODAL — COR
