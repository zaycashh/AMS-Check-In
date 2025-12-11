/* ============================================================
   SECTION 1 — GLOBAL CONSTANTS & BASIC HELPERS
============================================================ */

const STORAGE_KEY = 'drug_test_checkins_v3';
const COMPANY_LIST_KEY = 'drug_test_company_list_v3';
const OTHER_COMPANY_VALUE = "__OTHER__";

// ADMIN PIN
const ADMIN_PIN = "2468";

/* ------------------ DATE HELPERS ------------------ */

function getLocalDateString(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
}

function formatDateTime(isoString) {
    const d = new Date(isoString);
    if (isNaN(d)) return { date: "", time: "" };

    return {
        date: d.toLocaleDateString(),
        time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
}

/* ------------------ SERVICE FORMATTER ------------------ */
function formatServices(s) {
    if (!s) return "";
    const list = [];
    if (s.drug) list.push("Drug");
    if (s.dna) list.push("DNA");
    if (s.vision) list.push("Vision");
    if (s.alcohol) list.push("Alcohol");
    if (s.dot) list.push("DOT Physical");
    if (s.other && s.otherText) list.push(`Other: ${s.otherText}`);
    return list.join(", ");
}

/* ============================================================
   SECTION 2 — LOCAL STORAGE ENGINE
============================================================ */

function loadRecords() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function saveRecords(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function addRecord(record) {
    const list = loadRecords();
    list.push(record);
    saveRecords(list);
}

/* ============================================================
   SECTION 3 — COMPANY LIST MANAGEMENT
============================================================ */

function loadCompanyList() {
    try {
        return JSON.parse(localStorage.getItem(COMPANY_LIST_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCompanyList(list) {
    localStorage.setItem(COMPANY_LIST_KEY, JSON.stringify(list));
}

/* Populate dropdown */
function renderCompanySelect() {
    const select = document.getElementById("companySelect");
    if (!select) return;

    const companies = loadCompanyList();

    select.innerHTML = `<option value="">-- Select company --</option>`;

    companies.forEach(name => {
        let opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });

    // "Other"
    const otherOpt = document.createElement("option");
    otherOpt.value = OTHER_COMPANY_VALUE;
    otherOpt.textContent = "Other (type manually)";
    select.appendChild(otherOpt);
}

/* RENDER COMPANY LIST IN ADMIN PANEL */
function renderCompanyListDisplay() {
    const container = document.getElementById("companyListDisplay");
    const searchValue = (document.getElementById("companySearch")?.value || "").toLowerCase();
    let companies = loadCompanyList();

    if (!companies.length) {
        container.innerHTML = "<p>No companies added yet.</p>";
        return;
    }

    const filtered = companies.filter(c => c.toLowerCase().includes(searchValue));

    container.innerHTML = filtered.map(c => `
        <div class="company-item" style="display:flex; justify-content:space-between; margin:5px 0;">
            <span>${c}</span>
            <div>
                <button class="editCompanyBtn" data-name="${c}">Edit</button>
                <button class="deleteCompanyBtn" data-name="${c}" style="background:#d9534f; color:white;">Delete</button>
            </div>
        </div>
    `).join("");

    /* Edit buttons */
    document.querySelectorAll(".editCompanyBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const old = btn.dataset.name;
            const updated = prompt("Edit company name:", old);
            if (!updated) return;

            const list = loadCompanyList();
            const i = list.indexOf(old);
            list[i] = updated.trim();
            list.sort();
            saveCompanyList(list);
            renderCompanySelect();
            renderCompanyListDisplay();
        });
    });

    /* Delete buttons */
    document.querySelectorAll(".deleteCompanyBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const name = btn.dataset.name;
            if (!confirm(`Remove ${name}?`)) return;

            let list = loadCompanyList().filter(c => c !== name);
            saveCompanyList(list);
            renderCompanySelect();
            renderCompanyListDisplay();
        });
    });
}

/* ============================================================
   SECTION 4 — TOGGLE "OTHER" FIELDS
============================================================ */

function toggleOtherReason() {
    const show = document.getElementById("reasonSelect").value === "other";
    document.getElementById("otherReasonWrapper").style.display = show ? "block" : "none";
}

function toggleOtherCompany() {
    const show = document.getElementById("companySelect").value === OTHER_COMPANY_VALUE;
    document.getElementById("otherCompanyWrapper").style.display = show ? "block" : "none";
}

function toggleOtherService() {
    const show = document.getElementById("srvOther").checked;
    document.getElementById("otherServiceWrapper").style.display = show ? "block" : "none";
}

/* ============================================================
   SECTION 5 — SIGNATURE PAD
============================================================ */

function setupSignaturePad() {
    const canvas = document.getElementById("signaturePad");
    const placeholder = document.getElementById("sigPlaceholder");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let drawing = false, lastX = 0, lastY = 0, signed = false;

    function resize() {
        const r = canvas.getBoundingClientRect();
        canvas.width = r.width;
        canvas.height = r.height;
    }

    resize();
    window.addEventListener("resize", resize);

    function pos(e) {
        const r = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
        return { x, y };
    }

    function start(e) {
        drawing = true;
        const p = pos(e);
        lastX = p.x; lastY = p.y;
        placeholder.style.display = "none";
    }

    function move(e) {
        if (!drawing) return;
        const p = pos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        lastX = p.x;
        lastY = p.y;
        signed = true;
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", () => drawing = false);

    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", () => drawing = false);

    document.getElementById("clearSigBtn")?.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        placeholder.style.display = "block";
        signed = false;
    });

    window._sigPad = {
        hasSignature: () => signed,
        getDataUrl: () => signed ? canvas.toDataURL("image/png") : "",
        clear: () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            placeholder.style.display = "block";
            signed = false;
        }
    };
}

/* ============================================================
   SECTION 6 — SUBMIT HANDLER
============================================================ */

document.getElementById("submitBtn")?.addEventListener("click", () => {

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();

    if (!firstName || !lastName) {
        alert("Please enter the donor’s first and last name.");
        return;
    }

    // REASON
    let reason = document.getElementById("reasonSelect").value;
    if (reason === "other") {
        reason = document.getElementById("otherReasonInput").value.trim();
    }

    if (!reason) {
        alert("Please enter a reason for testing.");
        return;
    }

    // COMPANY
    let employer = document.getElementById("companySelect").value;
    if (employer === OTHER_COMPANY_VALUE) {
        employer = document.getElementById("otherCompany").value.trim();
    }

    if (!employer) {
        alert("Please choose or enter a company.");
        return;
    }

    // SERVICES
    const services = {
        drug: document.getElementById("srvDrug").checked,
        dna: document.getElementById("srvDNA").checked,
        vision: document.getElementById("srvVision").checked,
        alcohol: document.getElementById("srvAlcohol").checked,
        dot: document.getElementById("srvDOT").checked,
        other: document.getElementById("srvOther").checked,
        otherText: document.getElementById("srvOtherText").value.trim()
    };

    if (!Object.values(services).includes(true)) {
        alert("Please select at least one service.");
        return;
    }

    if (services.other && !services.otherText) {
        alert("Please describe the 'Other' service.");
        return;
    }

    // SIGNATURE
    const sigPad = window._sigPad;
    if (!sigPad?.hasSignature()) {
        alert("Signature is required.");
        return;
    }

    const now = new Date().toISOString();

    const record = {
        firstName,
        lastName,
        employer,
        reason,
        services,
        signature: sigPad.getDataUrl(),
        date: now
    };

    addRecord(record);
   
// CLEAR FORM AFTER SUBMISSION
document.getElementById("firstName").value = "";
document.getElementById("lastName").value = "";

document.getElementById("companySelect").value = "";
document.getElementById("otherCompany").value = "";
document.getElementById("otherCompanyWrapper").style.display = "none";

document.getElementById("reasonSelect").value = "";
document.getElementById("otherReasonInput").value = "";
document.getElementById("otherReasonWrapper").style.display = "none";

// Clear all service checkboxes
document.getElementById("srvDrug").checked = false;
document.getElementById("srvDNA").checked = false;
document.getElementById("srvVision").checked = false;
document.getElementById("srvAlcohol").checked = false;
document.getElementById("srvDOT").checked = false;
document.getElementById("srvOther").checked = false;

document.getElementById("srvOtherText").value = "";
document.getElementById("otherServiceWrapper").style.display = "none";

// Clear signature
sigPad.clear();

    alert("Donor successfully checked in!");

    renderRecordsTable();
});

/* ============================================================
   SECTION 7 — RENDER TABLE
============================================================ */

function renderRecordsTable() {
    const tbody = document.getElementById("recordsTableBody");
    if (!tbody) return;

    const records = loadRecords();
    tbody.innerHTML = "";

    if (!records.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No records found.</td></tr>`;
        return;
    }

    records.forEach((rec, i) => {
        const dt = formatDateTime(rec.date);
        tbody.insertAdjacentHTML("beforeend", `
            <tr>
                <td>${dt.date}</td>
                <td>${dt.time}</td>
                <td>${rec.firstName} ${rec.lastName}</td>
                <td>${rec.employer}</td>
                <td>${rec.reason}</td>
                <td>${formatServices(rec.services)}</td>
                <td><button class="viewSigBtn" data-index="${i}">View</button></td>
            </tr>
        `);
    });

    attachSignatureViewButtons();
}

/* ============================================================
   SECTION 8 — SIGNATURE MODAL
============================================================ */

function attachSignatureViewButtons() {
    document.querySelectorAll(".viewSigBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const i = btn.dataset.index;
            const rec = loadRecords()[i];

            if (!rec.signature) {
                alert("No signature saved.");
                return;
            }

            document.getElementById("signatureModalImg").src = rec.signature;
            document.getElementById("signatureModal").style.display = "flex";
        });
    });
}

document.getElementById("closeSignatureModal")?.addEventListener("click", () => {
    document.getElementById("signatureModal").style.display = "none";
});

/* ============================================================
   SECTION 9 — INIT
============================================================ */

window.onload = () => {
    renderCompanySelect();
    renderCompanyListDisplay();
    setupSignaturePad();
    renderRecordsTable();
};
/* ============================================================
   ADMIN LOGIN SYSTEM
============================================================ */

document.getElementById("toggleAdminBtn")?.addEventListener("click", () => {
    const pin = prompt("Enter Admin PIN:");

    if (pin === ADMIN_PIN) {
        // SHOW ADMIN PANEL
        document.getElementById("adminPanel").style.display = "block";
        document.getElementById("checkInSection").style.display = "none";
        alert("Admin mode activated.");
    } else {
        alert("Incorrect PIN.");
    }
});

// EXIT ADMIN MODE BUTTON
document.getElementById("exitAdminBtn")?.addEventListener("click", () => {
    document.getElementById("adminPanel").style.display = "none";
    document.getElementById("checkInSection").style.display = "block";
});
/* ============================================================
   ADMIN LOGIN SYSTEM
============================================================ */

document.getElementById("toggleAdminBtn")?.addEventListener("click", () => {
    const pin = prompt("Enter Admin PIN:");

    if (pin === ADMIN_PIN) {
        // SHOW ADMIN PANEL
        document.getElementById("adminArea").style.display = "block";
        document.getElementById("checkInSection").style.display = "none";

        alert("Admin mode activated.");
    } else {
        alert("Incorrect PIN.");
    }
});

// EXIT ADMIN MODE BUTTON
document.getElementById("exitAdminBtn")?.addEventListener("click", () => {
    document.getElementById("adminArea").style.display = "none";
    document.getElementById("checkInSection").style.display = "block";
});
