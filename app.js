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

    // Fix canvas resolution
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

    // Mouse Controls
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

    // Touch Controls
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

    // Clear Button
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

    // Signature
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
});

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
        // Show admin, hide check-in
        document.getElementById("adminArea").style.display = "block";
        document.getElementById("checkInSection").style.display = "none";

       initRunSearch();

       // ALWAYS hide Search Log panel on admin entry
const searchPanel = document.getElementById("searchPanel");
const searchOverlay = document.getElementById("searchPanelOverlay");

if (searchPanel) searchPanel.classList.add("hidden");
if (searchOverlay) searchOverlay.classList.add("hidden");

       
        // Load Recent Check-Ins ONCE
        if (!window.__recentLoaded && typeof renderRecentCheckIns === "function") {
            renderRecentCheckIns();
            window.__recentLoaded = true;
        }

        // Default to Recent Check-Ins tab
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        document.querySelector('.tab[data-tab="tabRecent"]').classList.add("active");

        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
        document.getElementById("tabRecent").style.display = "block";


    } else {
        alert("Incorrect PIN");
    }
});
/* =========================================================
   ADMIN TAB NAVIGATION (CLICKABLE SIDEBAR)
========================================================= */

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const targetId = tab.dataset.tab;
         // 🔒 ALWAYS close Search panel when switching tabs
    const searchPanel = document.getElementById("searchPanel");
    const searchOverlay = document.getElementById("searchPanelOverlay");

    if (searchPanel) searchPanel.classList.add("hidden");
    if (searchOverlay) searchOverlay.style.display = "none";


    // Remove active state from all tabs
    document.querySelectorAll(".tab").forEach(t =>
      t.classList.remove("active")
    );

    // Hide all tab content areas
    document.querySelectorAll(".tab-content").forEach(c =>
      c.style.display = "none"
    );

    // Activate clicked tab
    tab.classList.add("active");

    // Show selected content
    const targetContent = document.getElementById(targetId);
    if (targetContent) {
      targetContent.style.display = "block";
    }

    // Lazy-load Recent Check-Ins only once
    if (targetId === "tabRecent" && typeof renderRecentCheckIns === "function") {
      if (!window.__recentLoaded) {
        renderRecentCheckIns();
        window.__recentLoaded = true;
      }
    }
  });
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
   ADMIN TAB CLICK LOGIC — FINAL WORKING VERSION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");

    console.log("Tabs found:", tabs.length);
    console.log("Content areas found:", contents.length);

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {

            // Remove highlight from all tabs
            tabs.forEach(t => t.classList.remove("active"));

            // Highlight clicked tab
            tab.classList.add("active");

            // Hide all content areas
            contents.forEach(c => c.style.display = "none");

            // Show clicked panel
            const target = tab.getAttribute("data-tab");
            const section = document.getElementById(target);

            if (section) {
                section.style.display = "block";
            }
        });
    });
});
/* =========================================================
   STEP 1 — CLEAR SEARCH FILTERS
========================================================= */
document.getElementById("clearSearch")?.addEventListener("click", () => {
  // Text inputs
  const textFields = [
    "filterFirstName",
    "filterLastName",
    "filterCompanyManual"
  ];

  textFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // Dropdowns
  const companySelect = document.getElementById("filterCompany");
  const dateRangeSelect = document.getElementById("filterDateRange");

  if (companySelect) companySelect.value = "";
  if (dateRangeSelect) dateRangeSelect.value = "";
});
/* =========================================================
   STEP 2 — INIT SEARCH (SAFE, ADMIN-ONLY)
========================================================= */
function initRunSearch() {
  const runBtn = document.getElementById("runSearch");
  if (!runBtn) return;

  runBtn.addEventListener("click", () => {
    const first = document.getElementById("filterFirstName")?.value.toLowerCase() || "";
    const last = document.getElementById("filterLastName")?.value.toLowerCase() || "";
    const company = document.getElementById("filterCompany")?.value.toLowerCase() || "";

    const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");

    const filtered = logs.filter(entry => {
      return (
        (!first || entry.first.toLowerCase().includes(first)) &&
        (!last || entry.last.toLowerCase().includes(last)) &&
        (!company || entry.company.toLowerCase().includes(company))
      );
    });

    console.clear();
    console.table(filtered);
  });
}
// ===============================
// SEARCH LOG
// ===============================
const runSearchBtn = document.getElementById("runSearch");
const clearSearchBtn = document.getElementById("clearSearch");

if (runSearchBtn) {
    runSearchBtn.addEventListener("click", () => {
        const first = document.getElementById("filterFirstName").value.toLowerCase();
        const last = document.getElementById("filterLastName").value.toLowerCase();
        const company = document.getElementById("filterCompany").value;
        const dateRange = document.getElementById("filterDateRange").value;

        const data = JSON.parse(localStorage.getItem("checkIns")) || [];

       let results = data.filter(entry => {
    const firstInput = first.trim();
    const lastInput = last.trim();

    const entryFirst = (entry.first || "").toLowerCase();
    const entryLast = (entry.last || "").toLowerCase();

    const matchFirst =
        !firstInput || entryFirst.includes(firstInput);

    const matchLast =
        !lastInput || entryLast.includes(lastInput);

    const matchCompany =
        company === "" || entry.company === company;

    return matchFirst && matchLast && matchCompany;
});

        renderSearchResults(results);
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
        document.getElementById("filterFirstName").value = "";
        document.getElementById("filterLastName").value = "";
        document.getElementById("filterCompany").value = "";
        document.getElementById("filterDateRange").value = "";

        document.getElementById("searchResultsTable").innerHTML = "";
    });
}

function renderSearchResults(results) {
    const container = document.getElementById("searchResultsTable");

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
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach(r => {
        html += `
            <tr>
                <td>${r.date}</td>
                <td>${r.time}</td>
                <td>${r.first}</td>
                <td>${r.last}</td>
                <td>${r.company}</td>
                <td>${r.reason}</td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}
document.addEventListener("DOMContentLoaded", () => {
    initRunSearch();
});
