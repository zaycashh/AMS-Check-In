/* =========================================================
   CLOUD DETAIL FETCH (SAFE + NON-BLOCKING)
========================================================= */
let detailCloudCache = null;
let detailCloudAttempted = false;

/* =========================================================
   LOGO (PDF) — SAME AS SEARCH LOG
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
      <label>Company:</label>
      <select id="detailCompanySelect"></select>

      <button id="companyDetailExcelBtn">Export Excel</button>
      <button id="companyDetailPdfBtn" style="margin-left:8px;">Export PDF</button>
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
          <th>Signature</th>
        </tr>
      </thead>
      <tbody id="companyDetailBody"></tbody>
    </table>
  `;

  populateDetailCompanyDropdown(getLocalDetailLogs());
  fetchDetailLogs().then(logs => populateDetailCompanyDropdown(logs));
  bindDetailCompanyButtons();
}

/* =========================================================
   POPULATE COMPANY DROPDOWN
========================================================= */
function populateDetailCompanyDropdown(logs) {
  const select = document.getElementById("detailCompanySelect");
  if (!select) return;

  const companies = [...new Set(logs.map(l => l.company).filter(Boolean))];

  select.innerHTML = '<option value="">-- Select Company --</option>';

  companies.forEach(company => {
    const opt = document.createElement("option");
    opt.value = company;
    opt.textContent = company;
    select.appendChild(opt);
  });

  select.onchange = renderCompanyDetailTable;
}

/* =========================================================
   RENDER TABLE
========================================================= */
function renderCompanyDetailTable() {
  const tbody = document.getElementById("companyDetailBody");
  const companyName = document.getElementById("detailCompanySelect")?.value;

  if (!tbody || !companyName) {
    tbody.innerHTML = "";
    return;
  }

  const logs = detailCloudCache || getLocalDetailLogs();

  let records = logs.filter(
    r => (r.company || "").toUpperCase() === companyName.toUpperCase()
  );

  tbody.innerHTML = "";

  if (!records.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;">No records found</td>
      </tr>`;
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
      <td>${getServicesText(r)}</td>
      <td style="text-align:center;">
        ${r.signature ? `<img src="${r.signature}" style="width:90px;height:30px;">` : ""}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================================================
   SERVICES NORMALIZER
========================================================= */
function getServicesText(r) {
  if (Array.isArray(r.services)) return r.services.join(", ");
  if (Array.isArray(r.tests)) return r.tests.join(", ");
  if (typeof r.services === "string") return r.services;
  if (typeof r.tests === "string") return r.tests;

  const list = [];
  if (r.dot) list.push("DOT Drug Test");
  if (r.nonDot) list.push("NON-DOT Drug Test");
  if (r.vision) list.push("Vision Test");
  if (r.alcohol) list.push("Alcohol Test");
  return list.join(", ");
}

/* =========================================================
   EXPORT BUTTONS
========================================================= */
function bindDetailCompanyButtons() {
  document.getElementById("companyDetailExcelBtn")
    ?.addEventListener("click", exportCompanyExcel);

  document.getElementById("companyDetailPdfBtn")
    ?.addEventListener("click", exportCompanyPdf);
}

/* =========================================================
   EXPORT PDF (LOGO FIXED)
========================================================= */
function exportCompanyPdf() {
  const companyName =
    document.getElementById("detailCompanySelect")?.value;

  if (!companyName) {
    alert("Please select a company first.");
    return;
  }

  const records = (detailCloudCache || getLocalDetailLogs()).filter(
    r => (r.company || "").toUpperCase() === companyName.toUpperCase()
  );

  if (!records.length) {
    alert("No records found for this company.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(30, 94, 150);
  doc.rect(0, 0, pageWidth, 30, "F");

  if (amsLogoBase64) {
    doc.addImage(amsLogoBase64, "PNG", 8, 6, 26, 18);
  }

  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("AMS Detail Company Report", pageWidth / 2, 20, { align: "center" });
  doc.setTextColor(0);

  const rows = records.map(r => [
    r.date || "",
    r.time || "",
    r.first || r.firstName || "",
    r.last || r.lastName || "",
    r.reason || "",
    getServicesText(r),
    ""
  ]);

  doc.autoTable({
    startY: 36,
    margin: { left: 8, right: 8 },
    head: [["Date","Time","First","Last","Reason","Services","Signature"]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 4 },
    didDrawCell(data) {
      if (data.column.index === 6 && data.cell.section === "body") {
        const img = records[data.row.index]?.signature;
        if (img?.startsWith("data:image")) {
          doc.addImage(img, "PNG",
            data.cell.x + 4,
            data.cell.y + 2,
            18, 8
          );
        }
      }
    }
  });

  doc.save(`AMS_Detail_Company_${companyName}.pdf`);
}

/* =========================================================
   TAB HANDLER
========================================================= */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "tabCompany") {
      loadDetailCompanyReport();
    }
  });
});
