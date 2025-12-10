/* ============================================================
   SECTION 1 — GLOBAL CONSTANTS & BASIC HELPERS
============================================================ */

const STORAGE_KEY = 'drug_test_checkins_v2';
const COMPANY_LIST_KEY = 'drug_test_company_list_v1';
const OTHER_COMPANY_VALUE = '__OTHER__';

// ADMIN PIN — change if needed
const ADMIN_PIN = '2468';

// Stores recently viewed signatures
let signatureStore = {};

// Last results for report exports
let lastReportRecords = [];
let lastReportSummaryText = "";

// Company Report memory
let lastCompanyReport = [];
let lastCompanySummary = "";

/* ------------------ BASIC DATE HELPERS ------------------ */

function getLocalDateString(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
}

function formatDateTime(isoString) {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "", time: "" };

    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return { date, time };
}

/* -------------- SERVICE FORMATTER FOR TABLES -------------- */

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
   SECTION 2 — LOCAL STORAGE ENGINE (LOAD / SAVE / ADD RECORD)
============================================================ */

function loadRecords() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function addRecord(record) {
    const records = loadRecords();
    records.push(record);
    saveRecords(records);
}
/* ============================================================
   SECTION 3 — COMPANY LIST ENGINE
============================================================ */

function loadCompanyList() {
    const raw = localStorage.getItem(COMPANY_LIST_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCompanyList(list) {
    localStorage.setItem(COMPANY_LIST_KEY, JSON.stringify(list));
}

/* Render company dropdown in Check-In form */
function renderCompanySelect() {
    const select = document.getElementById("companySelect");
    if (!select) return;

    const companies = loadCompanyList();

    select.innerHTML = `
        <option value="">-- Select company --</option>
    `;

    companies.forEach(name => {
        const opt = document.createElement("option");
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

/* ===================================================================
   RENDER MANAGE COMPANIES LIST  (with Live Search + Edit + Delete)
=================================================================== */
function renderCompanyListDisplay() {
    const container = document.getElementById("companyListDisplay");
    const searchValue = document.getElementById("companySearch")?.value.toLowerCase() || "";
    let companies = loadCompanyList();

    if (!companies.length) {
        container.innerHTML = "<p>No companies added yet.</p>";
        return;
    }

    // FILTER
    const filtered = companies.filter(c => c.toLowerCase().includes(searchValue));

    // LIST
    container.innerHTML = filtered
        .map(c => `
            <div class="company-item" 
                style="margin:4px 0; display:flex; justify-content:space-between; align-items:center;">
                
                <span>${c}</span>

                <div>
                    <button class="editCompanyBtn" data-name="${c}" style="margin-right:6px;">
                        Edit
                    </button>
                    <button class="deleteCompanyBtn" data-name="${c}" 
                        style="background:#d9534f; color:white;">
                        Delete
                    </button>
                </div>
            </div>
        `)
        .join("");

    /* EDIT BUTTONS */
    document.querySelectorAll(".editCompanyBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const oldName = btn.dataset.name;
            const newName = prompt("Edit company name:", oldName);

            if (!newName || newName.trim() === "") return;

            const clean = newName.trim();
            const list = loadCompanyList();

            // Prevent duplicates
            if (list.includes(clean) && clean !== oldName) {
                alert("This company already exists.");
                return;
            }

            const idx = list.indexOf(oldName);
            if (idx !== -1) {
                list[idx] = clean;
                list.sort((a, b) => a.localeCompare(b));
                saveCompanyList(list);
                renderCompanySelect();
                renderCompanyListDisplay();
            }
        });
    });

    /* DELETE BUTTONS */
    document.querySelectorAll(".deleteCompanyBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const name = btn.dataset.name;
            if (!confirm(`Remove "${name}"?`)) return;

            let list = loadCompanyList();
            list = list.filter(c => c !== name);

            saveCompanyList(list);
            renderCompanySelect();
            renderCompanyListDisplay();
        });
    });
}
/* ============================================================
   SECTION 3 — SIGNATURE PAD ENGINE
============================================================ */

function setupSignaturePad() {
    const canvas = document.getElementById("signaturePad");
    const placeholder = document.getElementById("sigPlaceholder");
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    let signed = false;

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function getPos(event) {
        const rect = canvas.getBoundingClientRect();
        let x, y;
        if (event.touches && event.touches.length > 0) {
            x = event.touches[0].clientX - rect.left;
            y = event.touches[0].clientY - rect.top;
        } else {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        }
        return { x, y };
    }

    function start(event) {
        event.preventDefault();
        drawing = true;
        const pos = getPos(event);
        lastX = pos.x;
        lastY = pos.y;
        placeholder.style.display = "none";
    }

    function draw(event) {
        if (!drawing) return;
        event.preventDefault();
        const pos = getPos(event);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;
        signed = true;
    }

    function end() {
        drawing = false;
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", end);

    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", end);

    document.getElementById("clearSigBtn")?.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        signed = false;
        placeholder.style.display = "block";
    });

    return {
        hasSignature: () => signed,
        getDataUrl: () => signed ? canvas.toDataURL("image/png") : "",
        clear: () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            signed = false;
            placeholder.style.display = "block";
        }
    };
}
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function getPos(event) {
        const rect = canvas.getBoundingClientRect();
        let x, y;
        if (event.touches && event.touches.length > 0) {
            x = event.touches[0].clientX - rect.left;
            y = event.touches[0].clientY - rect.top;
        } else {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        }
        return { x, y };
    }

    function start(event) {
        event.preventDefault();
        drawing = true;
        const pos = getPos(event);
        lastX = pos.x;
        lastY = pos.y;
        placeholder.style.display = "none";
    }

    function draw(event) {
        if (!drawing) return;
        event.preventDefault();
        const pos = getPos(event);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        lastX = pos.x;
        lastY = pos.y;
        signed = true;
    }

    function end() {
        drawing = false;
    }

    // MOUSE EVENTS
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", end);

    // TOUCH EVENTS
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", end);

    const clearButton = document.getElementById("clearSigBtn");
    if (clearButton) {
        clearButton.addEventListener("click", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            placeholder.style.display = "block";
            signed = false;
        });
    }

    return {
        hasSignature: () => signed,
        getDataUrl: () => signed ? canvas.toDataURL("image/png") : "",
        clear: () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            placeholder.style.display = "block";
            signed = false;
        }
    };
}
/* =====================================================================
   SECTION 4 – SUBMIT HANDLER (VALIDATE / SAVE RECORD)
===================================================================== */

document.getElementById("submitBtn")?.addEventListener("click", () => {
    const reason = document.getElementById("reason").value.trim();
    const employer = document.getElementById("companySelect").value.trim();

    // SERVICE CHECKBOXES
    const services = {
        drug: document.getElementById("srvDrug").checked,
        dna: document.getElementById("srvDNA").checked,
        vision: document.getElementById("srvVision").checked,
        alcohol: document.getElementById("srvAlcohol").checked,
        dot: document.getElementById("srvDOT").checked,
        other: document.getElementById("srvOther").checked,
        otherText: document.getElementById("srvOtherText").value.trim()
    };

    // VALIDATION
    if (reason === "") {
        alert("Please select the reason for visit.");
        return;
    }

    if (!services.drug && !services.dna && !services.vision && !services.alcohol && !services.dot && !services.other) {
        alert("Please select at least one service.");
        return;
    }

    if (services.other && services.otherText === "") {
        alert("Please enter a description for 'Other' service.");
        return;
    }

    if (employer === "") {
        alert("Please select the employer.");
        return;
    }

    // SIGNATURE CHECK
    const sigPad = window._sigPad;
    if (!sigPad || !sigPad.hasSignature()) {
        alert("Signature is required before submission.");
        return;
    }

    // CREATE RECORD
    const now = new Date().toISOString();
    const record = {
        date: now,
        reason,
        services,
        employer,
        signature: sigPad.getDataUrl()
    };

    addRecord(record);

    // CLEAR FORM
    document.getElementById("reason").value = "";
    document.getElementById("srvOtherText").value = "";
    document.querySelectorAll(".service-checkbox").forEach(c => c.checked = false);

    sigPad.clear();

    alert("Client successfully checked in!");

    // SWITCH TO VIEW TAB
    document.getElementById("tabViewBtn")?.click();

    renderRecordsTable();
});
/* =====================================================================
   SECTION 5 – RENDER RECORDS TABLE (VIEW ALL CHECK-INS)
===================================================================== */

function renderRecordsTable() {
    const tableBody = document.getElementById("recordsTableBody");
    if (!tableBody) return;

    const records = loadRecords();
    tableBody.innerHTML = "";

    if (records.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:10px;">
                    No records found.
                </td>
            </tr>`;
        return;
    }

    records.forEach((rec, index) => {
        const { date, time } = formatDateTime(rec.date);
        const services = formatServices(rec.services);

        const row = `
            <tr>
                <td>${date}</td>
                <td>${time}</td>
                <td>${rec.reason}</td>
                <td>${rec.employer}</td>
                <td>${services}</td>
                <td>
                    <button class="viewSigBtn primary-btn" data-index="${index}">
                        View Signature
                    </button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });

    attachSignatureViewButtons();
}
/* =====================================================================
   SECTION 6 – SIGNATURE VIEW MODAL
===================================================================== */

function attachSignatureViewButtons() {
    const buttons = document.querySelectorAll(".viewSigBtn");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const index = btn.dataset.index;
            const records = loadRecords();
            const rec = records[index];

            if (!rec || !rec.signature) {
                alert("No signature available for this entry.");
                return;
            }

            const modal = document.getElementById("signatureModal");
            const img = document.getElementById("signatureModalImg");

            img.src = rec.signature;
            modal.style.display = "flex";
        });
    });
}

// Close modal
document.getElementById("closeSignatureModal")?.addEventListener("click", () => {
    document.getElementById("signatureModal").style.display = "none";
});
// TEMPORARY TEST BUTTON — Confirm GitHub Save Works
document.getElementById("testSaveBtn").addEventListener("click", async () => {
    const testRecord = {
        firstName: "Test",
        lastName: "Save",
        company: "Demo Company",
        timestamp: new Date().toISOString()
    };

    saveRecordToGitHub(testRecord);
});
function toggleOtherReason() {
    const reasonSelect = document.getElementById("reasonSelect");
    const otherWrapper = document.getElementById("otherReasonWrapper");
    const otherInput = document.getElementById("otherReasonInput");

    if (reasonSelect.value == "other") {
        otherWrapper.style.display = "block";
        otherInput.value = "";
        otherInput.focus();
    } else {
        otherWrapper.style.display = "none";
        otherInput.value = "";
    }
}
