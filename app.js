/* ============================================================
   GLOBAL CONSTANTS
============================================================ */
const STORAGE_KEY = "ams_checkins_v1";
const COMPANY_LIST_KEY = "ams_company_list_v1";
const OTHER_COMPANY_VALUE = "__OTHER__";
const ADMIN_PIN = "2468";

/* ============================================================
   DATE HELPERS
============================================================ */
function formatDateTime(iso) {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString(),
        time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
}

/* ============================================================
   LOAD & SAVE RECORDS
============================================================ */
function loadRecords() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
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
   COMPANY LIST MANAGEMENT
============================================================ */
function loadCompanyList() {
    return JSON.parse(localStorage.getItem(COMPANY_LIST_KEY) || "[]");
}

function saveCompanyList(list) {
    localStorage.setItem(COMPANY_LIST_KEY, JSON.stringify(list));
}

function renderCompanySelect() {
    const select = document.getElementById("companySelect");
    const companies = loadCompanyList();

    select.innerHTML = `<option value="">-- Select Company --</option>`;

    companies.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });

    const otherOpt = document.createElement("option");
    otherOpt.value = OTHER_COMPANY_VALUE;
    otherOpt.textContent = "Other (enter manually)";
    select.appendChild(otherOpt);
}

function renderCompanyListDisplay() {
    const container = document.getElementById("companyListDisplay");
    const searchValue = document.getElementById("companySearch").value.toLowerCase();
    const list = loadCompanyList().filter(c => c.toLowerCase().includes(searchValue));

    container.innerHTML = "";

    list.forEach(name => {
        const row = document.createElement("div");
        row.className = "company-item";
        row.innerHTML = `
            <span>${name}</span>
            <div>
                <button class="editCompanyBtn" data-name="${name}">Edit</button>
                <button class="deleteCompanyBtn" data-name="${name}" style="background:#c0392b;color:#fff;">Delete</button>
            </div>
        `;
        container.appendChild(row);
    });

    document.querySelectorAll(".editCompanyBtn").forEach(btn => {
        btn.onclick = () => {
            const oldName = btn.dataset.name;
            const newName = prompt("Edit company name:", oldName);
            if (!newName) return;

            const list = loadCompanyList();
            const index = list.indexOf(oldName);
            if (index !== -1) list[index] = newName.trim();

            list.sort();
            saveCompanyList(list);
            renderCompanySelect();
            renderCompanyListDisplay();
        };
    });

    document.querySelectorAll(".deleteCompanyBtn").forEach(btn => {
        btn.onclick = () => {
            const name = btn.dataset.name;
            if (!confirm(`Delete "${name}"?`)) return;

            const updated = loadCompanyList().filter(c => c !== name);
            saveCompanyList(updated);
            renderCompanySelect();
            renderCompanyListDisplay();
        };
    });
}

/* ============================================================
   TOGGLE "OTHER" FIELDS
============================================================ */
function toggleOtherCompany() {
    document.getElementById("otherCompanyWrapper").style.display =
        document.getElementById("companySelect").value === OTHER_COMPANY_VALUE ? "block" : "none";
}

function toggleOtherReason() {
    document.getElementById("otherReasonWrapper").style.display =
        document.getElementById("reasonSelect").value === "other" ? "block" : "none";
}

function toggleOtherService() {
    document.getElementById("otherServiceWrapper").style.display =
        document.getElementById("srvOther").checked ? "block" : "none";
}

/* ============================================================
   SIGNATURE PAD
============================================================ */
function setupSignaturePad() {
    const canvas = document.getElementById("signaturePad");
    const placeholder = document.getElementById("sigPlaceholder");
    const ctx = canvas.getContext("2d");

    let drawing = false, signed = false, lastX = 0, lastY = 0;

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resize();

    function pos(e) {
        const r = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
        return { x, y };
    }

    function start(e) {
        drawing = true;
        let p = pos(e);
        lastX = p.x; lastY = p.y;
        placeholder.style.display = "none";
    }

    function draw(e) {
        if (!drawing) return;
        const p = pos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();
        lastX = p.x;
        lastY = p.y;
        signed = true;
    }

    function end() { drawing = false; }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", end);

    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", end);

    document.getElementById("clearSigBtn").onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        signed = false;
        placeholder.style.display = "block";
    };

    window._sigPad = {
        hasSignature: () => signed,
        getDataUrl: () => signed ? canvas.toDataURL("image/png") : "",
        clear: () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            signed = false;
            placeholder.style.display = "block";
        }
    };
}

/* ============================================================
   SUBMIT CHECK-IN
============================================================ */
document.getElementById("submitBtn").addEventListener("click", () => {

    const first = document.getElementById("firstName").value.trim();
    const last = document.getElementById("lastName").value.trim();
    if (!first || !last) return alert("Enter first and last name.");

    let company = document.getElementById("companySelect").value;
    if (company === OTHER_COMPANY_VALUE)
        company = document.getElementById("otherCompany").value.trim();

    if (!company) return alert("Enter or select a company.");

    let reason = document.getElementById("reasonSelect").value;
    if (reason === "other")
        reason = document.getElementById("otherReasonInput").value.trim();

    if (!reason) return alert("Enter a reason for testing.");

    const services = {
        drug: srvDrug.checked,
        alcohol: srvAlcohol.checked,
        vision: srvVision.checked,
        dot: srvDOT.checked,
        dna: srvDNA.checked,
        other: srvOther.checked,
        otherText: srvOtherText.value.trim()
    };

    if (!Object.values(services).includes(true))
        return alert("Select at least one service.");

    if (services.other && !services.otherText)
        return alert("Describe the 'Other' service.");

    const sig = window._sigPad;
    if (!sig.hasSignature()) return alert("Signature required.");

    const record = {
        firstName: first,
        lastName: last,
        company,
        reason,
        services,
        signature: sig.getDataUrl(),
        date: new Date().toISOString()
    };

    addRecord(record);
    sig.clear();

    document.getElementById("firstName").value = "";
    document.getElementById("lastName").value = "";
    document.getElementById("companySelect").value = "";
    document.getElementById("reasonSelect").value = "";
    document.getElementById("otherCompanyWrapper").style.display = "none";
    document.getElementById("otherReasonWrapper").style.display = "none";
    document.getElementById("otherServiceWrapper").style.display = "none";
    srvDrug.checked = srvAlcohol.checked = srvVision.checked = srvDOT.checked = srvDNA.checked = srvOther.checked = false;
    srvOtherText.value = "";

    alert("Donor successfully checked in!");
    renderRecentTable();
});

/* ============================================================
   RENDER RECENT CHECK-INS (TAB B)
============================================================ */
function renderRecentTable() {
    const tbody = document.querySelector("#recentTable tbody");
    const list = loadRecords();
    tbody.innerHTML = "";

    list.slice().reverse().forEach(rec => {
        const dt = formatDateTime(rec.date);
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${dt.date}</td>
            <td>${dt.time}</td>
            <td>${rec.firstName} ${rec.lastName}</td>
            <td>${rec.company}</td>
            <td>${rec.reason}</td>
            <td>${Object.keys(rec.services).filter(k => rec.services[k] && k !== "otherText").join(", ")}</td>
            <td><button class="viewSigBtn">View</button></td>
        `;
        row.querySelector(".viewSigBtn").onclick = () => {
            document.getElementById("signatureModalImg").src = rec.signature;
            document.getElementById("signatureModal").style.display = "flex";
        };
        tbody.appendChild(row);
    });
}

/* ============================================================
   ADMIN LOGIN / EXIT
============================================================ */
document.getElementById("toggleAdminBtn").onclick = () => {
    const pin = prompt("Enter Admin PIN:");
    if (pin === ADMIN_PIN) {
        adminArea.style.display = "block";
        checkInSection.style.display = "none";
    } else {
        alert("Incorrect PIN.");
    }
};

document.getElementById("exitAdminBtn").onclick = () => {
    adminArea.style.display = "none";
    checkInSection.style.display = "block";
};

/* ============================================================
   INITIALIZE
============================================================ */
window.onload = () => {
    renderCompanySelect();
    renderCompanyListDisplay();
    setupSignaturePad();
    renderRecentTable();
};
