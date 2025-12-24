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
