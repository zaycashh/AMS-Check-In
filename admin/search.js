document.addEventListener("DOMContentLoaded", () => {
    loadFilters();
    applyFilters();
});

function loadFilters() {
    const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

    const companySet = new Set();
    const reasonSet = new Set();
    const serviceSet = new Set();

    logs.forEach(log => {
        if (log.company) companySet.add(log.company);
        if (log.reason) reasonSet.add(log.reason);

        if (log.services) {
            log.services.split(",").forEach(s => serviceSet.add(s.trim()));
        }
    });

    fillDropdown("filterCompany", companySet);
    fillDropdown("filterReason", reasonSet);
    fillDropdown("filterService", serviceSet);
}

function fillDropdown(id, set) {
    const select = document.getElementById(id);
    set.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        select.appendChild(opt);
    });
}

document.querySelectorAll("#searchFilters input, #searchFilters select")
    .forEach(el => el.addEventListener("input", applyFilters));

document.getElementById("clearFilters").addEventListener("click", () => {
    document.querySelectorAll("#searchFilters input, #searchFilters select")
        .forEach(el => el.value = "");
    applyFilters();
});

function applyFilters() {
    const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

    const nameFilter = document.getElementById("filterName").value.toLowerCase();
    const dateFrom = document.getElementById("filterDateFrom").value;
    const dateTo = document.getElementById("filterDateTo").value;
    const companyFilter = document.getElementById("filterCompany").value;
    const reasonFilter = document.getElementById("filterReason").value;
    const serviceFilter = document.getElementById("filterService").value;

    const tbody = document.querySelector("#resultsTable tbody");
    tbody.innerHTML = "";

    logs.forEach(log => {
        if (nameFilter && !(`${log.first} ${log.last}`.toLowerCase().includes(nameFilter))) return;

        if (dateFrom && new Date(log.date) < new Date(dateFrom)) return;
        if (dateTo && new Date(log.date) > new Date(dateTo)) return;

        if (companyFilter && log.company !== companyFilter) return;

        if (reasonFilter && log.reason !== reasonFilter) return;

        if (serviceFilter && !log.services.includes(serviceFilter)) return;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${log.date}</td>
            <td>${log.time}</td>
            <td>${log.first} ${log.last}</td>
            <td>${log.company}</td>
            <td>${log.reason}</td>
            <td>${log.services}</td>
            <td><img src="${log.signature}" class="sig-thumb"></td>
        `;

        tbody.appendChild(row);
    });
}
