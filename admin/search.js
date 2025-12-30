/* =========================================================
   BASIC STORAGE
========================================================= */
function getLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

let lastSearchResults = [];
let currentSearchResults = [];

/* =========================================================
   DATE HELPERS (SAFE / LOCAL)
========================================================= */
function normalizeDate(dateStr) {
  if (!dateStr) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const d = new Date(dateStr + "T00:00:00");
    return isNaN(d) ? null : d;
  }

  // MM/DD/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [m, d, y] = dateStr.split("/");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  return null;
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRange(startDate, endDate) {
  return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;
}

/* =========================================================
   COMPANY CUSTOM INPUT
========================================================= */
window.toggleCompanyText = function (value) {
  const input = document.getElementById("filterCompanyText");
  if (!input) return;

  if (value === "__custom__") {
    input.style.display = "block";
    input.focus();
  } else {
    input.style.display = "none";
    input.value = "";
  }
};

/* =========================================================
   DATE RANGE TOGGLE
========================================================= */
window.toggleCustomDateRange = function (value) {
  const custom = document.getElementById("customDateRange");
  if (!custom) return;
  custom.style.display = value === "custom" ? "block" : "none";
};

/* =========================================================
   GLOBAL DATE RANGE (PDF)
========================================================= */
let lastSearchStartDate = null;
let lastSearchEndDate = null;

/* =========================================================
   MAIN SEARCH
========================================================= */
window.runSearch = function () {
  const logs = getLogs();

  const first = document.getElementById("filterFirstName").value.trim().toLowerCase();
  const last = document.getElementById("filterLastName").value.trim().toLowerCase();
  const company = document.getElementById("filterCompany").value;

  const companyText = document
    .getElementById("filterCompanyText")
    ?.value.trim().toLowerCase();

  const normalizedCompany =
    company === "__custom__" ? companyText : company.toLowerCase();

  const range = document.getElementById("filterDateRange").value;
  const startInput = document.getElementById("filterStartDate")?.value;
  const endInput = document.getElementById("filterEndDate")?.value;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate = null;
  let endDate = null;

  switch (range) {
    case "today":
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "yesterday":
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "thisWeek": {
      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      startDate = new Date(today);
      startDate.setDate(today.getDate() + diff);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }

    case "lastWeek": {
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - diff - 7);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }

    case "thisMonth":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "lastMonth":
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "thisYear":
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "lastYear":
      startDate = new Date(today.getFullYear() - 1, 0, 1);
      endDate = new Date(today.getFullYear() - 1, 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
        
        case "custom":
  if (startInput && endInput) {
    const [sy, sm, sd] = startInput.split("-").map(Number);
    startDate = new Date(sy, sm - 1, sd);
    startDate.setHours(0, 0, 0, 0);

    const [ey, em, ed] = endInput.split("-").map(Number);
    endDate = new Date(ey, em - 1, ed);
    endDate.setHours(23, 59, 59, 999);
  }
  break;


  lastSearchStartDate = startDate;
  lastSearchEndDate = endDate;

  const results = logs.filter(entry => {
    if (!entry) return false;

    if (first && !entry.first?.toLowerCase().includes(first)) return false;
    if (last && !entry.last?.toLowerCase().includes(last)) return false;

    if (normalizedCompany && normalizedCompany !== "all companies") {
      const recordCompany = (entry.company || "").toLowerCase();
      if (!recordCompany.includes(normalizedCompany)) return false;
    }

    const logDate = normalizeDate(entry.date);
    if (!logDate) return false;

    if (startDate && logDate < startDate) return false;
    if (endDate && logDate > endDate) return false;
     
     return true;
});


  lastSearchResults = results;
  currentSearchResults = results;

  renderSearchResults(results);

};

/* =========================================================
   RENDER RESULTS
========================================================= */
function renderSearchResults(results) {
  const container = document.getElementById("searchResultsTable");
  if (!container) return;

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
          <th>Signature</th>
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
        <td>${Array.isArray(entry.services) ? entry.services.join(", ") : entry.services || ""}</td>
        <td>${entry.signature ? `<img src="${entry.signature}" style="height:40px" />` : "-"}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}
