console.log("✅ Detail Company Report Module Loaded");

// ===============================
// LOAD DETAIL COMPANY TAB
// ===============================
function loadDetailCompanyReport() {
  const container = document.getElementById("tabCompany");
  if (!container) return;

  container.innerHTML = `
    <h2 class="section-title">Detail Company Report</h2>

    <div class="filter-bar">
      <label>Company:</label>
      <select id="detailCompanySelect"></select>

      <button id="companyDetailExcelBtn">Export Excel</button>
      <button id="companyDetailPdfBtn" style="margin-left:8px;">
        Export PDF
      </button>
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
  `;

  populateDetailCompanyDropdown();
  bindDetailCompanyButtons();
}
// ===============================
// RE-RENDER TABLE ON DATE FILTER CHANGE
// ===============================
["detailDateRange", "detailStartDate", "detailEndDate"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", () => {
    loadDetailCompanyReport();
  });
});

// ===============================
// POPULATE COMPANY DROPDOWN
// ===============================
function populateDetailCompanyDropdown() {
  const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");
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

  // ✅ MOVE THIS INSIDE
  select.addEventListener("change", renderCompanyDetailTable);
}
function filterByDateRange(records) {
  const range = document.getElementById("detailDateRange")?.value;
  const startInput = document.getElementById("detailStartDate")?.value;
  const endInput = document.getElementById("detailEndDate")?.value;

  if (!range && !startInput && !endInput) return records;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate = null;
  let endDate = null;

  if (range === "today") {
    startDate = new Date(today);
    endDate = new Date(today);
  }

  if (range === "yesterday") {
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 1);
    endDate = new Date(startDate);
  }

  if (range === "thisMonth") {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today);
  }

  if (startInput) startDate = new Date(startInput);
  if (endInput) endDate = new Date(endInput);

  return records.filter(r => {
    if (!r.date) return false;
    const recordDate = new Date(r.date);
    recordDate.setHours(0, 0, 0, 0);

    if (startDate && recordDate < startDate) return false;
    if (endDate && recordDate > endDate) return false;

    return true;
  });
}

// ===============================
// RENDER TABLE
// ===============================
function renderCompanyDetailTable() {
  const tbody = document.getElementById("companyDetailBody");
  const companyName = document.getElementById("detailCompanySelect")?.value;

  if (!tbody || !companyName) {
    tbody.innerHTML = "";
    return;
  }

  let records = JSON.parse(localStorage.getItem("ams_logs") || "[]")
  .filter(r => (r.company || "").toUpperCase() === companyName.toUpperCase());

records = filterByDateRange(records);

  tbody.innerHTML = "";

  if (!records.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">No records found</td>
      </tr>
    `;
    return;
  }

  records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date || ""}</td>
      <td>${r.time || ""}</td>
      <td>${r.first || ""}</td>
      <td>${r.last || ""}</td>
      <td>${r.reason || ""}</td>
      <td>${Array.isArray(r.services) ? r.services.join(", ") : (r.services || "")}</td>
    `;
    tbody.appendChild(tr);
  });
}
// ===============================
// BIND EXPORT BUTTONS
// ===============================
function bindDetailCompanyButtons() {

  // Excel export
  document
    .getElementById("companyDetailExcelBtn")
    ?.addEventListener("click", exportCompanyExcel);

  // PDF export
  document
    .getElementById("companyDetailPdfBtn")
    ?.addEventListener("click", exportCompanyPdf);
}

// ===============================
// DETAIL COMPANY → PDF EXPORT (PRO HEADER + LOGO)
// ===============================
function exportCompanyPdf() {
  const companyName = document.getElementById("detailCompanySelect")?.value;
  if (!companyName) {
    alert("Please select a company first.");
    return;
  }

  const records = JSON.parse(localStorage.getItem("ams_logs") || "[]")
    .filter(r => (r.company || "").toUpperCase() === companyName.toUpperCase());

  if (!records.length) {
    alert("No records found for this company.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");

  // ===== HEADER =====
  const logo = new Image();
  logo.src = "logo.png";

  logo.onload = () => {
    doc.addImage(logo, "PNG", 14, 10, 30, 15);

    doc.setFontSize(18);
    doc.text("AMS Check-In System", 50, 18);

    doc.setFontSize(14);
    doc.text("Detail Company Report", 50, 26);

    doc.setFontSize(11);
    doc.text(`Company: ${companyName}`, 14, 40);

    const now = new Date();
    doc.text(
      `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      14,
      47
    );
    // ===== SUMMARY TOTALS =====
const totalRecords = records.length;

// Normalize services into an array
const allServices = records.flatMap(r => {
  if (Array.isArray(r.services)) return r.services;
  if (typeof r.services === "string" && r.services.trim())
    return r.services.split(",").map(s => s.trim());
  return [];
});

// Count services
const serviceCounts = {};
allServices.forEach(svc => {
  serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
});

// Render summary
let summaryY = 54;

doc.setFontSize(12);
doc.text(`Total Records: ${totalRecords}`, 14, summaryY);

summaryY += 8;

Object.entries(serviceCounts).forEach(([service, count]) => {
  doc.text(`${service}: ${count}`, 14, summaryY);
  summaryY += 7;
});
D

    // ===== TABLE DATA =====
    const tableData = records.map(r => [
      r.date || "",
      r.time || "",
      r.firstName || "",
      r.lastName || "",
      r.reason || "",
      Array.isArray(r.services) ? r.services.join(", ") : (r.services || "")
    ]);

    doc.autoTable({
      startY: summaryY + 5,
      head: [["Date", "Time", "First", "Last", "Reason", "Services"]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 89] }
    });

    doc.save(`AMS_Detail_Company_${companyName}.pdf`);
  };
}

 
// ===============================
// EXPORT EXCEL
// ===============================
function exportCompanyExcel() {
  const companyName = document.getElementById("detailCompanySelect")?.value;
  if (!companyName) {
    alert("Please select a company first.");
    return;
  }

  const records = JSON.parse(localStorage.getItem("ams_logs") || "[]")
    .filter(r => (r.company || "").toUpperCase() === companyName.toUpperCase());

  if (!records.length) {
    alert("No records found.");
    return;
  }

  const excelData = records.map(r => ({
    Date: r.date,
    Time: r.time,
    First: r.first,
    Last: r.last,
    Reason: r.reason,
    Services: Array.isArray(r.services) ? r.services.join(", ") : r.services
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Company Detail");
  XLSX.writeFile(wb, `AMS_Company_Report_${companyName}.xlsx`);
}

// ===============================
// EXPORT PDF
// ===============================
function exportCompanyPdf() {
  const companyName = document.getElementById("detailCompanySelect")?.value;
  if (!companyName) {
    alert("Please select a company first.");
    return;
  }

  const records = JSON.parse(localStorage.getItem("ams_logs") || "[]")
    .filter(r => (r.company || "").toUpperCase() === companyName.toUpperCase());

  if (!records.length) {
    alert("No records found.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("l", "pt", "a4");

  doc.setFontSize(18);
  doc.text("AMS Detail Company Report", 40, 40);
  doc.setFontSize(12);
  doc.text(`Company: ${companyName}`, 40, 65);
  doc.text(`Total Records: ${records.length}`, 40, 85);

  const tableData = records.map(r => [
    r.date,
    r.time,
    r.first,
    r.last,
    r.reason,
    Array.isArray(r.services) ? r.services.join(", ") : r.services
  ]);

  doc.autoTable({
    startY: 110,
    head: [["Date", "Time", "First", "Last", "Reason", "Services"]],
    body: tableData,
    styles: { fontSize: 9 }
  });

  doc.save(`AMS_Company_Report_${companyName}.pdf`);
}

// ===============================
// TAB CLICK HANDLER
// ===============================
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "tabCompany") {
      loadDetailCompanyReport();
    }
  });
});
