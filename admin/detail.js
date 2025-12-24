console.log("✅ Detail Company Report Module Loaded");

function loadDetailCompanyReport() {
  const container = document.getElementById("tabCompany");
  if (!container) return;

  container.innerHTML = `
    <h2 class="section-title">Detail Company Report</h2>

    <div class="filter-bar">
      <label>Company:</label>
      <select id="detailCompanySelect"></select>
      <button id="runDetailCompany">Run Report</button>
    </div>

    <div id="detailCompanyResults"></div>
  `;

  populateDetailCompanyDropdown();
}

function populateDetailCompanyDropdown() {
  const logs = JSON.parse(localStorage.getItem("checkInLogs")) || [];
  const select = document.getElementById("detailCompanySelect");
  if (!select) return;

  const companies = [...new Set(logs.map(l => l.company).filter(Boolean))];

  select.innerHTML = `<option value="">-- Select Company --</option>`;

  companies.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "tabCompany") {
      loadDetailCompanyReport();
    }
  });
});
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
    </div>

    <div id="detailCompanyResults"></div>
  `;

  populateDetailCompanyDropdown();
}

// ===============================
// POPULATE COMPANY DROPDOWN
// ===============================
function populateDetailCompanyDropdown() {
  const logs = JSON.parse(localStorage.getItem("checkInLogs")) || [];
  const select = document.getElementById("detailCompanySelect");
  if (!select) return;

  const companies = [...new Set(logs.map(l => l.company).filter(Boolean))];

  select.innerHTML = `<option value="">-- Select Company --</option>`;

  companies.forEach(company => {
    const opt = document.createElement("option");
    opt.value = company;
    opt.textContent = company;
    select.appendChild(opt);
  });
}

// ===============================
// EXPORT EXCEL
// ===============================
document.addEventListener("click", e => {
  if (e.target && e.target.id === "companyDetailExcelBtn") {
    exportCompanyExcel();
  }
});

function exportCompanyExcel() {
  const companyName = document.getElementById("detailCompanySelect")?.value;
  if (!companyName) {
    alert("Please select a company first.");
    return;
  }

  const records = JSON.parse(localStorage.getItem("checkInLogs") || "[]")
    .filter(r => (r.company || "").toUpperCase() === companyName.toUpperCase());

  if (!records.length) {
    alert("No records found for this company.");
    return;
  }

  const excelData = records.map(r => ({
    Date: r.date,
    Time: r.time,
    First: r.first,
    Last: r.last,
    Company: r.company,
    Reason: r.reason,
    Services: Array.isArray(r.services) ? r.services.join(", ") : r.services
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Company Detail");

  XLSX.writeFile(wb, `AMS_Company_Report_${companyName}.xlsx`);
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
// ===============================
// DETAIL COMPANY → TABLE RENDER
// ===============================
function renderCompanyDetailTable() {
  const tbody = document.getElementById("companyDetailBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const companyName = getSelectedCompany();
  if (!companyName) return;

  const records = JSON.parse(localStorage.getItem("checkInLogs") || "[]")
    .filter(r => (r.company || "").toUpperCase() === companyName.toUpperCase());

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
// AUTO REFRESH WHEN COMPANY CHANGES
// ===============================
document.getElementById("filterCompany")
?.addEventListener("change", renderCompanyDetailTable);

document.getElementById("filterCompanyText")
?.addEventListener("input", renderCompanyDetailTable);
