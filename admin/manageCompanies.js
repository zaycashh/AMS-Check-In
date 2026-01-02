console.log("Manage Companies Module Loaded");

function getCompanies() {
  return JSON.parse(localStorage.getItem("ams_companies")) || [];
}

function saveCompanies(companies) {
  localStorage.setItem("ams_companies", JSON.stringify(companies));
}

function renderCompanyManager() {
  const container = document.getElementById("tabManage");
  if (!container) return;

  const companies = getCompanies();

  container.innerHTML = `
    <h2 class="section-title">Manage Companies</h2>

    <div style="max-width:500px; margin-bottom:20px;">
      <input
        id="companyInput"
        type="text"
        placeholder="Enter company name"
        style="width:100%; padding:12px; margin-bottom:12px;"
      />
      <button
        id="addCompanyBtn"
        type="button"
        class="primary-btn"
      >
        Add Company
      </button>
    </div>

    <div id="companyList"></div>
  `;

  const list = container.querySelector("#companyList");

  if (companies.length === 0) {
    list.innerHTML = "<p>No companies added yet.</p>";
  } else {
    list.innerHTML = companies
      .map(
        (c, i) => `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span>${c}</span>
            <button data-index="${i}" class="secondary-btn delete-company">
              Delete
            </button>
          </div>
        `
      )
      .join("");
  }

  // ✅ ADD COMPANY
  container.querySelector("#addCompanyBtn").onclick = () => {
    const input = container.querySelector("#companyInput");
    const name = input.value.trim();

    if (!name) return;

    companies.push(name);
    saveCompanies(companies);
    input.value = "";
    renderCompanyManager();
  };

  // ✅ DELETE COMPANY
  container.querySelectorAll(".delete-company").forEach(btn => {
    btn.onclick = () => {
      const index = Number(btn.dataset.index);
      companies.splice(index, 1);
      saveCompanies(companies);
      renderCompanyManager();
    };
  });
}

// 🌍 Expose globally so nav.js can call it
window.renderCompanyManager = renderCompanyManager;
