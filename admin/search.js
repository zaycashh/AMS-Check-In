console.log("Admin Search Module Loaded");

/* ================================
   STORAGE
================================ */
function getLogs() {
  try {
    return JSON.parse(localStorage.getItem("checkIns")) || [];
  } catch {
    return [];
  }
}

/* ================================
   DATE PARSER (CRITICAL FIX)
================================ */
function parseEntryDate(entry) {
  if (!entry || !entry.date) return null;

  // entry.date expected MM/DD/YYYY
  const [month, day, year] = entry.date.split("/").map(Number);
  if (!month || !day || !year) return null;

  const d = new Date(year, month - 1, day);

  // Apply time if exists
  if (entry.time) {
    const t = entry.time.match(/(\d+):(\d+)\s?(AM|PM)?/i);
    if (t) {
      let h = Number(t[1]);
      const m = Number(t[2]);
      const ap = t[3];
      if (ap === "PM" && h < 12) h += 12;
      if (ap === "AM" && h === 12) h = 0;
      d.setHours(h, m, 0, 0);
    }
  }

  return d;
}

/* ================================
   SEARCH
================================ */
window.runSearch = function () {
  const logs = getLogs();

  const first = document.getElementById("filterFirstName").value.trim().toLowerCase();
  const last = document.getElementById("filterLastName").value.trim().toLowerCase();
  const company = document.getElementById("filterCompany").value;
  const range = document.getElementById("filterDateRange").value;

  const startInput = document.getElementById("filterStartDate").value;
  const endInput = document.getElementById("filterEndDate").value;

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
      const d = parseEntryDate(entry);
      if (!d || d < startDate || d > endDate) return false;
    }

    return true;
  });

  window.currentSearchResults = results;
  renderSearchResults(results);
};

/* ================================
   CLEAR FILTERS (FIXED)
================================ */
window.clearFilters = function () {
  document.getElementById("filterFirstName").value = "";
  document.getElementById("filterLastName").value = "";
  document.getElementById("filterCompany").value = "All Companies";
  document.getElementById("filterDateRange").value = "";

  const start = document.getElementById("filterStartDate");
  const end = document.getElementById("filterEndDate");

  if (start) {
    start.value = "";
    start.valueAsDate = null;
  }

  if (end) {
    end.value = "";
    end.valueAsDate = null;
  }

  toggleCustomDateRange("");
  renderSearchResults([]);
};

/* ================================
   UI HELPERS
================================ */
window.toggleCustomDateRange = function (value) {
  const box = document.getElementById("customDateRange");
  if (!box) return;
  box.style.display = value === "custom" ? "block" : "none";
};

/* ================================
   RENDER RESULTS
================================ */
function renderSearchResults(results) {
  const container = document.getElementById("searchResults");
  if (!container) return;

  if (!results.length) {
    container.innerHTML = "<p>No results found.</p>";
    return;
  }

  container.innerHTML = results.map(r => `
    <div class="log-row">
      <strong>${r.first} ${r.last}</strong><br>
      ${r.company}<br>
      ${r.date} ${r.time || ""}
    </div>
  `).join("");
}
