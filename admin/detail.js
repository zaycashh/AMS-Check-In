/* =========================================================
   CLOUD DETAIL FETCH (SAFE + NON-BLOCKING)
========================================================= */
let detailCloudCache = null;
let detailCloudAttempted = false;

function getLocalDetailLogs() {
  return JSON.parse(localStorage.getItem("ams_logs") || "[]");
}

async function fetchDetailLogs() {
  if (detailCloudAttempted) return detailCloudCache || getLocalDetailLogs();
  detailCloudAttempted = true;

  try {
    const res = await fetch(
      "https://ams-checkin-api.josealfonsodejesus.workers.dev/logs",
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("Cloud fetch failed");

    const logs = await res.json();
    detailCloudCache = logs;
    localStorage.setItem("ams_logs", JSON.stringify(logs));

    console.log("☁️ Detail logs loaded from cloud:", logs.length);
    return logs;
  } catch {
    console.warn("⚠️ Using local detail logs");
    return getLocalDetailLogs();
  }
}

/* =========================================================
   LOGO (PDF)
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

console.log("✅ Detail Company Report Module Loaded");

/* =========================================================
   LOAD DETAIL COMPANY TAB
========================================================= */
function loadDetailCompanyReport() {
  const container = document.getElementById("tabCompany");
  if (!container) return;

  container.innerHTML = `
    <h2 class="section-title">Detail Company Report</h2>

    <div class="filter-bar">
      <div class="form-row" style="position:relative;">
        <label>Company:</label>
        <input
          type="text"
          id="detailCompanyInput"
          placeholder="Start typing company name..."
          autocomplete="off"
        />
        <div id="detailCompanySuggestions"
             class="company-suggestions"
             style="display:none;"></div>
      </div>

      <label style="margin-left:12px;">Date Range:</label>
      <select id="detailDateRange">
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

      <span id="detailCustomDates" style="display:none;margin-left:8px;">
        <input type="date" id="detailStartDate">
        <input type="date" id="detailEndDate">
      </span>

      <span id="detailDonorCount"
            style="margin-left:12px;font-weight:600;">
        Total Records: 0
      </span>

      <div class="export-right">
        <button id="companyDetailExcelBtn">Export Excel</button>
        <button id="companyDetailPdfBtn">Export PDF</button>
      </div>
    </div>

    <table class="report-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>First</th>
          <th>Last</th>
          <th>Reason</th>
          <th>Services</th>
        </tr>
      </thead>
      <tbody id="companyDetailBody"></tbody>
    </table>

    <div class="detail-actions">
      <button id="detailSearchBtn">Search</button>
      <button id="detailClearBtn">Clear</button>
    </div>
  `;

  bindDetailActionButtons();
bindDetailCompanyButtons();
fetchDetailLogs().then(() => {
  setupDetailCompanyAutocomplete();
});

/* =========================================================
   ACTION BUTTONS
========================================================= */
function bindDetailActionButtons() {
  document.getElementById("detailSearchBtn").onclick = renderCompanyDetailTable;

  document.getElementById("detailClearBtn").onclick = () => {
    document.getElementById("detailCompanyInput").value = "";
    document.getElementById("detailCompanySuggestions").style.display = "none";
    document.getElementById("detailDateRange").value = "";
    document.getElementById("detailStartDate").value = "";
    document.getElementById("detailEndDate").value = "";
    document.getElementById("detailCustomDates").style.display = "none";
    document.getElementById("companyDetailBody").innerHTML = "";
    document.getElementById("detailDonorCount").textContent = "Total Records: 0";
  };
}

/* =========================================================
   DATE FILTER
========================================================= */
function filterByDateRange(records) {
  const range = document.getElementById("detailDateRange").value;
  const startInput = document.getElementById("detailStartDate").value;
  const endInput = document.getElementById("detailEndDate").value;

  let startTs = null;
  let endTs = null;
  const now = Date.now();

  switch (range) {
    case "today": {
      const d = new Date(); d.setHours(0,0,0,0);
      startTs = d.getTime(); endTs = startTs + 86400000 - 1;
      break;
    }
    case "yesterday": {
      const d = new Date(); d.setHours(0,0,0,0);
      endTs = d.getTime() - 1; startTs = endTs - 86400000 + 1;
      break;
    }
    case "thisWeek": {
      const d = new Date(); d.setHours(0,0,0,0);
      startTs = d.getTime() - d.getDay()*86400000; endTs = now;
      break;
    }
    case "lastWeek": {
      const d = new Date(); d.setHours(0,0,0,0);
      endTs = d.getTime() - d.getDay()*86400000 - 1;
      startTs = endTs - 7*86400000 + 1;
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
      startTs = new Date(d.getFullYear(), d.getMonth()-1, 1).getTime();
      endTs = new Date(d.getFullYear(), d.getMonth(), 0, 23,59,59).getTime();
      break;
    }
    case "thisYear": {
      const d = new Date();
      startTs = new Date(d.getFullYear(),0,1).getTime();
      endTs = now;
      break;
    }
    case "lastYear": {
      const y = new Date().getFullYear() - 1;
      startTs = new Date(y,0,1).getTime();
      endTs = new Date(y,11,31,23,59,59).getTime();
      break;
    }
  }

  if (startInput) startTs = new Date(startInput).getTime();
  if (endInput) endTs = new Date(endInput).getTime() + 86400000 - 1;

  return records.filter(r => {
    const ts = r.timestamp || new Date(`${r.date} ${r.time || "00:00"}`).getTime();
    if (startTs && ts < startTs) return false;
    if (endTs && ts > endTs) return false;
    return true;
  });
}

/* =========================================================
   RENDER TABLE
========================================================= */
function renderCompanyDetailTable() {
  const company = document.getElementById("detailCompanyInput").value.trim();
  const tbody = document.getElementById("companyDetailBody");
  tbody.innerHTML = "";

  if (!company) return;

  let records = (detailCloudCache || getLocalDetailLogs())
    .filter(r => (r.company || "").toUpperCase() === company.toUpperCase());

  records = filterByDateRange(records);

  document.getElementById("detailDonorCount").textContent =
    `Total Records: ${records.length}`;

  if (!records.length) {
    tbody.innerHTML =
      `<tr><td colspan="6" style="text-align:center;">No records found</td></tr>`;
    return;
  }

  records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date || ""}</td>
      <td>${r.time || ""}</td>
      <td>${r.first || r.firstName || ""}</td>
      <td>${r.last || r.lastName || ""}</td>
      <td>${r.reason || ""}</td>
      <td>${getServicesText(r)}</td>`;
    tbody.appendChild(tr);
  });
}

/* =========================================================
   SERVICES NORMALIZER
========================================================= */
function getServicesText(r) {
  if (Array.isArray(r.services)) return r.services.join(", ");
  if (Array.isArray(r.tests)) return r.tests.join(", ");
  if (r.services) return r.services;
  if (r.tests) return r.tests;

  const list = [];
  if (r.dot) list.push("DOT Drug Test");
  if (r.nonDot) list.push("NON-DOT Drug Test");
  if (r.vision) list.push("Vision Test");
  if (r.alcohol) list.push("Alcohol Test");
  return list.join(", ");
}

/* =========================================================
   AUTOCOMPLETE (FIXED)
========================================================= */
function setupDetailCompanyAutocomplete() {
  const input = document.getElementById("detailCompanyInput");
  const box = document.getElementById("detailCompanySuggestions");

  const companies = [...new Set(
    (detailCloudCache || []).map(l => l.company).filter(Boolean)
  )];

  input.oninput = () => {
    const val = input.value.toLowerCase();
    box.innerHTML = "";
    if (!val) return box.style.display = "none";

    companies.filter(c => c.toLowerCase().includes(val))
      .slice(0, 8)
      .forEach(c => {
        const div = document.createElement("div");
        div.textContent = c;
        div.className = "company-suggestion";
        div.onclick = () => {
          input.value = c;
          box.style.display = "none";
        };
        box.appendChild(div);
      });

    box.style.display = box.children.length ? "block" : "none";
  };
}

/* =========================================================
   DATE RANGE TOGGLE
========================================================= */
document.addEventListener("change", e => {
  if (e.target.id === "detailDateRange") {
    document.getElementById("detailCustomDates").style.display =
      e.target.value === "custom" ? "inline-block" : "none";
  }
});
/* =========================================================
   TAB CLICK HANDLER (REQUIRED)
========================================================= */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "tabCompany") {
      loadDetailCompanyReport();
    }
  });
});
function exportCompanyExcel() {
  const company = document.getElementById("detailCompanyInput").value.trim();
  if (!company) return alert("Select a company first");

  const records = filterByDateRange(
    (detailCloudCache || getLocalDetailLogs())
      .filter(r => (r.company || "").toUpperCase() === company.toUpperCase())
  );

  if (!records.length) return alert("No records found");

  const rows = records.map(r => [
    r.date || "",
    r.time || "",
    r.first || r.firstName || "",
    r.last || r.lastName || "",
    r.reason || "",
    getServicesText(r)
  ]);

  const header = [
    ["AMS Detail Company Report"],
    [`Company: ${company}`],
    [`Total Records: ${records.length}`],
    [],
    ["Date","Time","First","Last","Reason","Services"]
  ];

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Detail Company");

  XLSX.writeFile(wb, `AMS_Detail_Company_${company}.xlsx`);
}
function exportCompanyPdf() {
  const company = document.getElementById("detailCompanyInput").value.trim();
  if (!company) return alert("Select a company first");

  const records = filterByDateRange(
    (detailCloudCache || getLocalDetailLogs())
      .filter(r => (r.company || "").toUpperCase() === company.toUpperCase())
  );

  if (!records.length) return alert("No records found");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  doc.text(`AMS Detail Company Report`, 14, 14);
  doc.text(`Company: ${company}`, 14, 22);
  doc.text(`Total Records: ${records.length}`, 14, 30);

  doc.autoTable({
    startY: 36,
    head: [["Date","Time","First","Last","Reason","Services"]],
    body: records.map(r => [
      r.date || "",
      r.time || "",
      r.first || r.firstName || "",
      r.last || r.lastName || "",
      r.reason || "",
      getServicesText(r)
    ])
  });

  doc.save(`AMS_Detail_Company_${company}.pdf`);
}
