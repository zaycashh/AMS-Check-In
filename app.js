/* =========================================================
   GLOBAL VARIABLES
========================================================= */
const ADMIN_PIN = "2468";

/* =========================================================
   SIGNATURE PAD INITIALIZATION
========================================================= */
function setupSignaturePad() {
    const canvas = document.getElementById("signaturePad");
    const placeholder = document.getElementById("sigPlaceholder");

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    let drawing = false;

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function getTouchPos(e) {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }

    function draw(e) {
        if (!drawing) return;
        const pos = e.touches ? getTouchPos(e) : getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        if (e.touches) e.preventDefault();
    }

    canvas.addEventListener("mousedown", (e) => {
        drawing = true;
        placeholder.style.display = "none";
        const pos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener("mouseup", () => {
        drawing = false;
        ctx.beginPath();
    });

    canvas.addEventListener("mousemove", draw);

    canvas.addEventListener("touchstart", (e) => {
        drawing = true;
        placeholder.style.display = "none";
        const pos = getTouchPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
    });

    canvas.addEventListener("touchend", () => {
        drawing = false;
        ctx.beginPath();
    });

    canvas.addEventListener("touchmove", draw);

    document.getElementById("clearSigBtn").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        placeholder.style.display = "block";
    });
}

/* =========================================================
   COMPANY "OTHER" LOGIC
========================================================= */
document.getElementById("companySelect").addEventListener("change", () => {
    const value = document.getElementById("companySelect").value;
    document.getElementById("otherCompanyWrapper").style.display =
        value === "__OTHER__" ? "block" : "none";
});

/* =========================================================
   REASON "OTHER" LOGIC
========================================================= */
document.getElementById("reasonSelect").addEventListener("change", () => {
    const value = document.getElementById("reasonSelect").value;
    document.getElementById("otherReasonWrapper").style.display =
        value === "other" ? "block" : "none";
});

/* =========================================================
   SERVICES "OTHER" LOGIC
========================================================= */
document.querySelector('input[value="Other"]').addEventListener("change", (e) => {
    document.getElementById("otherServiceWrapper").style.display =
        e.target.checked ? "block" : "none";
});

/* =========================================================
   SUBMIT FORM
========================================================= */
document.getElementById("submitBtn").addEventListener("click", () => {
    const first = document.getElementById("firstName").value.trim();
    const last = document.getElementById("lastName").value.trim();
    const company = document.getElementById("companySelect").value;
    const reason = document.getElementById("reasonSelect").value;

    if (!first || !last) {
        alert("Please enter first and last name.");
        return;
    }

    let finalCompany = company === "__OTHER__"
        ? document.getElementById("otherCompany").value.trim()
        : company;

    let finalReason = reason === "other"
        ? document.getElementById("otherReasonInput").value.trim()
        : reason;

    const services = Array.from(
        document.querySelectorAll('input[name="services"]:checked')
    ).map(cb => cb.value);

    if (services.includes("Other")) {
        const custom = document.getElementById("srvOtherText").value.trim();
        if (custom) services.push(custom);
    }

    const canvas = document.getElementById("signaturePad");
    const signature = canvas.toDataURL();

   const now = new Date();

const record = {
  date: now.toLocaleDateString(),
  time: now.toLocaleTimeString(),
  first,
  last,
  company: finalCompany,
  reason: finalReason,
  services: services.join(", "),
  signature
};

let logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");
logs.push(record);
localStorage.setItem("ams_logs", JSON.stringify(logs));

alert("Check-in submitted!");
location.reload();

/* =========================================================
   RESET FORM
========================================================= */
document.getElementById("resetFormBtn").addEventListener("click", () => {
    location.reload();
});

/* =========================================================
   ADMIN LOGIN
========================================================= */
document.getElementById("toggleAdminBtn").addEventListener("click", () => {
    const pin = prompt("Enter Admin PIN:");

    if (pin === ADMIN_PIN) {
        document.getElementById("adminArea").style.display = "block";
        document.getElementById("checkInSection").style.display = "none";

        initRunSearch();

        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelector('.tab[data-tab="tabRecent"]').classList.add("active");

        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
        document.getElementById("tabRecent").style.display = "block";
    } else {
        alert("Incorrect PIN");
    }
});

/* =========================================================
   EXIT ADMIN MODE
========================================================= */
document.getElementById("exitAdminBtn").addEventListener("click", () => {
    document.getElementById("adminArea").style.display = "none";
    document.getElementById("checkInSection").style.display = "block";
});

/* =========================================================
   PAGE LOAD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    setupSignaturePad();
});

/* =========================================================
   CLEAR SEARCH FILTERS
========================================================= */
document.getElementById("clearSearch")?.addEventListener("click", () => {
    ["filterFirstName", "filterLastName"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    const companySelect = document.getElementById("filterCompany");
    const dateRangeSelect = document.getElementById("filterDateRange");

    if (companySelect) companySelect.value = "";
    if (dateRangeSelect) dateRangeSelect.value = "";

    const resultsBox = document.getElementById("searchResultsTable");
    if (resultsBox) resultsBox.innerHTML = "";
});

/* =========================================================
   INIT SEARCH (FIXED — VISUAL RENDER)
========================================================= */
function initRunSearch() {
    const runBtn = document.getElementById("runSearch");
    const resultsBox = document.getElementById("searchResultsTable");
    if (!runBtn || !resultsBox) return;

    runBtn.addEventListener("click", () => {
        const first = document.getElementById("filterFirstName")?.value.toLowerCase() || "";
        const last = document.getElementById("filterLastName")?.value.toLowerCase() || "";
        const company = document.getElementById("filterCompany")?.value.toLowerCase() || "";

        const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

        const filtered = logs.filter(entry => (
            (!first || entry.first.toLowerCase().includes(first)) &&
            (!last || entry.last.toLowerCase().includes(last)) &&
            (!company || entry.company.toLowerCase().includes(company))
        ));

        resultsBox.innerHTML = "";

        if (!filtered.length) {
            resultsBox.innerHTML = "<p>No results found</p>";
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
                        <th>Services</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
        `;

        filtered.forEach(r => {
            html += `
                <tr>
                    <td>${r.date}</td>
                    <td>${r.time}</td>
                    <td>${r.first}</td>
                    <td>${r.last}</td>
                    <td>${r.company}</td>
                    <td>${r.services}</td>
                    <td>${r.reason}</td>
                </tr>
            `;
        });

        html += "</tbody></table>";
        resultsBox.innerHTML = html;
    });
}
