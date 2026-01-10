/* =========================================================
   DEDUPE
========================================================= */
function dedupeLogsById(logs) {
  return Array.from(
    new Map(
      logs
        .filter(l => l && (l.id || l.timestamp))
        .map(l => [
          l.id || `${l.timestamp}-${l.first}-${l.last}`,
          l
        ])
    ).values()
  );
}

/* =========================================================
   LOCAL + CLOUD FETCH (FAST)
========================================================= */

function getCachedLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

function normalizeLogsOnce(logs) {
  return logs.map(l => {
    if (!l._ts) {
      let ts = l.timestamp;
      if (!ts && l.date) {
        const t = l.time || "00:00";
        ts = new Date(`${l.date} ${t}`).getTime();
      }
      return { ...l, _ts: ts };
    }
    return l;
  });
}

async function refreshLogsSilently() {
  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error();

    const logs = normalizeLogsOnce(await res.json());
    localStorage.setItem("ams_logs", JSON.stringify(logs));
    return logs;
  } catch {
    return getCachedLogs();
  }
}

async function fetchSearchLogs() {
  const cached = getCachedLogs();

  // 🔥 INSTANT SEARCH
  if (cached.length) {
    refreshLogsSilently(); // background update
    return cached;
  }

  return await refreshLogsSilently();
}

console.log("Admin Search Module Loaded");

/* =========================================================
   LOGO LOAD (PDF)
========================================================= */
let amsLogoBase64 = null;

(function loadLogo() {
  const img = new Image();
  img.src = "logo.png";
  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
    amsLogoBase64 = canvas.toDataURL("image/png");
  };
})();

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  populateSearchCompanies();
  clearSearchTable();
});

/* =========================================================
   RUN SEARCH
========================================================= */
window.runSearch = async function () {
  clearSearchTable();

  const first = document.getElementById("filterFirstName")?.value.trim().toLowerCase();
  const last = document.getElementById("filterLastName")?.value.trim().toLowerCase();

  const companySelect = document.getElementById("searchFilterCompany");
  const companyText = document.getElementById("searchFilterCompanyText")?.value.trim().toLowerCase();
  const company =
    companySelect?.value === "__custom__"
      ? companyText
      : companySelect?.value.toLowerCase();

  const range = document.getElementById("filterDateRange")?.value;
  const startInput = document.getElementById("filterStartDate")?.value;
  const endInput = document.getElementById("filterEndDate")?.value;

  const rawLogs = dedupeLogsById(await fetchSearchLogs());

  /* ===== DATE RANGE ===== */
  let startTs = null;
  let endTs = null;
  const now = Date.now();

  switch (range) {
    case "today": {
      const d = new Date(); d.setHours(0,0,0,0);
      startTs = d.getTime();
      endTs = startTs + 86400000 - 1;
      break;
    }
    case "yesterday": {
      const d = new Date(); d.setHours(0,0,0,0);
      endTs = d.getTime() - 1;
      startTs = endTs - 86400000 + 1;
      break;
    }
    case "thisWeek": {
      const d = new Date(); d.setHours(0,0,0,0);
      startTs = d.getTime() - d.getDay() * 86400000;
      endTs = now;
      break;
    }
    case "lastWeek": {
      const d = new Date(); d.setHours(0,0,0,0);
      endTs = d.getTime() - d.getDay() * 86400000 - 1;
      startTs = endTs - 7 * 86400000 + 1;
      break;
    }
    case "thisMonth": {
      const d = new Date();
      startTs = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      endTs = now;
      break;
    }
    case "lastMonth": {
      const d = new Date();
      startTs = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
      endTs = new Date(d.getFullYear(), d.getMonth(), 0, 23,59,59,999).getTime();
      break;
    }
    case "thisYear":
      startTs = new Date(new Date().getFullYear(), 0, 1).getTime();
      endTs = now;
      break;
    case "lastYear":
      startTs = new Date(new Date().getFullYear() - 1, 0, 1).getTime();
      endTs = new Date(new Date().getFullYear() - 1, 11, 31, 23,59,59,999).getTime();
      break;
    case "custom":
      if (startInput) startTs = new Date(startInput).getTime();
      if (endInput) endTs = new Date(endInput).getTime() + 86400000 - 1;
      break;
  }

  const filtered = rawLogs.filter(e => {
    if (!e._ts) return false;
    if (startTs !== null && e._ts < startTs) return false;
    if (endTs !== null && e._ts > endTs) return false;

    const f = e.firstName || e.first || "";
    const l = e.lastName || e.last || "";

    if (first && !f.toLowerCase().includes(first)) return false;
    if (last && !l.toLowerCase().includes(last)) return false;
    if (company && !e.company?.toLowerCase().includes(company)) return false;

    return true;
  });

  if (!filtered.length) {
    window.searchResults = [];
    renderSearchResults([]);
    return;
  }

  filtered.sort((a, b) => b._ts - a._ts);
  window.searchResults = filtered;
  renderSearchResults(filtered);
};

/* =========================================================
   RENDER TABLE
========================================================= */
function renderSearchResults(results) {
  const table = document.getElementById("searchResultsTable");
  const counter = document.getElementById("searchResultCount");
  if (!table) return;

  table.innerHTML = "";

  if (counter) {
    counter.textContent =
      results.length === 0
        ? "No results found"
        : `${results.length} result${results.length > 1 ? "s" : ""} found`;
  }

  if (!results.length) {
    table.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;opacity:.6;">
          No matching records
        </td>
      </tr>`;
    return;
  }

  results.forEach(r => {
    const services = Array.isArray(r.services)
      ? r.services.join(", ")
      : r.services || r.tests || "";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.date || ""}</td>
      <td>${r.time || ""}</td>
      <td>${r.firstName || r.first || ""}</td>
      <td>${r.lastName || r.last || ""}</td>
      <td>${r.company || ""}</td>
      <td>${r.reason || ""}</td>
      <td>${services}</td>
      <td style="text-align:center;">
        ${r.signature ? `<img src="${r.signature}" style="width:100px;height:35px;">` : ""}
      </td>`;
    table.appendChild(row);
  });
}

/* =========================================================
   COMPANY DROPDOWN
========================================================= */
function populateSearchCompanies() {
  const select = document.getElementById("searchFilterCompany");
  if (!select) return;

  select.innerHTML = `
    <option value="">All Companies</option>
    <option value="__custom__">Type Company (Custom)</option>
  `;

  const companies = JSON.parse(localStorage.getItem("ams_companies") || "[]");
  companies.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name.toLowerCase();
    opt.textContent = name;
    select.appendChild(opt);
  });
}

window.toggleSearchCompanyText = function (value) {
  const input = document.getElementById("searchFilterCompanyText");
  if (!input) return;
  input.style.display = value === "__custom__" ? "block" : "none";
  if (value === "__custom__") input.focus();
};

/* =========================================================
   CUSTOM DATE RANGE TOGGLE
========================================================= */
window.toggleCustomDateRange = function (value) {
  const wrapper = document.getElementById("customDateRange");
  const start = document.getElementById("filterStartDate");
  const end = document.getElementById("filterEndDate");
  if (!wrapper || !start || !end) return;

  wrapper.style.display = value === "custom" ? "block" : "none";
  if (value !== "custom") {
    start.value = "";
    end.value = "";
  }
};

/* =========================================================
   CLEAR SEARCH
========================================================= */
function clearSearchTable() {
  const table = document.getElementById("searchResultsTable");
  const counter = document.getElementById("searchResultCount");
  if (counter) counter.textContent = "";
  if (table) {
    table.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;opacity:.6;">
          Use filters and click Search to view records
        </td>
      </tr>`;
  }
}

window.clearSearch = function () {
  document.getElementById("filterFirstName").value = "";
  document.getElementById("filterLastName").value = "";
  document.getElementById("searchFilterCompany").value = "";
  document.getElementById("searchFilterCompanyText").value = "";
  document.getElementById("searchFilterCompanyText").style.display = "none";
  document.getElementById("filterDateRange").value = "";
  document.getElementById("filterStartDate").value = "";
  document.getElementById("filterEndDate").value = "";
  window.searchResults = [];
  clearSearchTable();
};

/* =========================================================
   SERVICES NORMALIZER
========================================================= */
function getServicesText(r) {
  if (Array.isArray(r.services)) return r.services.join(", ");
  if (typeof r.services === "string") return r.services;
  const list = [];
  if (r.dot) list.push("DOT Drug Test");
  if (r.nonDot) list.push("NON-DOT Drug Test");
  if (r.vision) list.push("Vision Test");
  return list.join(", ");
}

/* =========================================================
   EXPORT EXCEL
========================================================= */
function exportSearchLogExcel() {
  const results = window.searchResults;
  if (!Array.isArray(results) || results.length === 0) {
    alert("Please run a search first.");
    return;
  }

  const data = results.map(r => ({
    Date: r.date || "",
    Time: r.time || "",
    First: r.firstName || r.first || "",
    Last: r.lastName || r.last || "",
    Company: r.company || "",
    Reason: r.reason || "",
    Services: getServicesText(r),
    Signature: r.signature ? "Signed" : ""
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Search Log");
  XLSX.writeFile(wb, "AMS_Search_Log.xlsx");
}

/* =========================================================
   EXPORT PDF
========================================================= */
window.exportSearchPdf = function () {
  const records = window.searchResults || [];
  if (!records.length) {
    alert("Please run a search first.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");
  const pageWidth = doc.internal.pageSize.width;

  doc.setFillColor(30, 94, 150);
  doc.rect(0, 0, pageWidth, 30, "F");

  if (window.amsLogoBase64) {
    doc.addImage(amsLogoBase64, "PNG", 8, 6, 26, 18);
  }

  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("AMS Search Log Report", pageWidth / 2, 20, { align: "center" });
  doc.setTextColor(0);

  const rows = records.map(r => [
    r.date || "",
    r.time || "",
    r.firstName || r.first || "",
    r.lastName || r.last || "",
    r.company || "",
    r.reason || "",
    getServicesText(r),
    ""
  ]);

  doc.autoTable({
    startY: 36,
    margin: { left: 8, right: 8 },
    head: [[
      "Date","Time","First","Last","Company","Reason","Services","Signature"
    ]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 4 },
    didDrawCell(data) {
      if (data.column.index === 7 && data.cell.section === "body") {
        const img = records[data.row.index]?.signature;
        if (img && img.startsWith("data:image")) {
          const w = 18, h = 8;
          const x = data.cell.x + (data.cell.width - w) / 2;
          const y = data.cell.y + (data.cell.height - h) / 2;
          doc.addImage(img, "PNG", x, y, w, h);
        }
      }
    }
  });

  doc.save("AMS_Search_Log.pdf");
};
