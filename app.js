/* ============================================================
   GLOBAL CONSTANTS
============================================================ */
const STORAGE_KEY = "drug_test_checkins_v3";
const COMPANY_LIST_KEY = "drug_test_company_list_v3";
const ADMIN_PIN = "2468";
const OTHER_COMPANY_VALUE = "__OTHER__";

/* ============================================================
   LOAD & SAVE RECORDS
============================================================ */
function loadRecords() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
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
   COMPANY LIST
============================================================ */
function loadCompanyList() {
    return JSON.parse(localStorage.getItem(COMPANY_LIST_KEY)) || [];
}

function saveCompanyList(list) {
    localStorage.setItem(COMPANY_LIST_KEY, JSON.stringify(list));
}

function renderCompanySelect() {
    const select = document.getElementById("companySelect");
    const companies = loadCompanyList();

    select.innerHTML = `<option value="">-- Select Company --</option>`;
    companies.forEach(name => {
        let opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });

    let otherOpt = document.createElement("option");
    otherOpt.value = OTHER_COMPANY_VALUE;
    otherOpt.textContent = "Other (enter manually)";
    select.appendChild(otherOpt);
}

/* ============================================================
   OTHER FIELD TOGGLES
============================================================ */
document.getElementById("companySelect").addEventListener("change", () => {
    const show = document.getElementById("companySelect").value === OTHER_COMPANY_VALUE;
    document.getElementById("otherCompanyWrapper").style.display = show ? "block" : "none";
});

document.getElementById("reasonSelect").addEventListener("change", () => {
    const show = document.getElementById("reasonSelect").value === "other";
    document.getElementById("otherReasonWrapper").style.display = show ? "block" : "none";
});

document.getElementById("srvOther").addEventListener("change", () => {
    const show = document.getElementById("srvOther").checked;
    document.getElementById("otherServiceWrapper").style.display = show ? "block" : "none";
});

/* ============================================================
   SIGNATURE PAD
============================================================ */
function setupSignaturePad() {
    const canvas = document.getElementById("signaturePad");
    const placeholder = document.getElementById("sigPlaceholder");
    const ctx = canvas.getContext("2d");

    function resize() {
        const r = canvas.getBoundingClientRect();
        canvas.width = r.width;
        canvas.height = r.height;
    }

    resize();
    window.addEventListener("resize", resize);

    let drawing = false;
    let signed = false;
    let lastX = 0, lastY = 0;

    function pos(e) {
        const r = canvas.getBoundingClientRect();
        return {
            x: (e.touches ? e.touches[0].clientX : e.clientX) - r.left,
            y: (e.touches ? e.touches[0].clientY : e.clientY) - r.top
        };
    }

    function start(e) {
        drawing = true;
        let p = pos(e);
        lastX = p.x; lastY = p.y;
        placeholder.style.display = "none";
    }

    function draw(e) {
        if (!drawing) return;
        let p = pos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        lastX = p.x; lastY = p.y;
        signed = true;
    }

    function end() { drawing = false; }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", end);

    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", end);

    document.getElementById("clearSigBtn").addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        signed = false;
        placeholder.style.display = "block";
    });

    window._sigPad = {
        hasSignature: () => signed,
        getDataUrl: () => signed ? canvas.toDataURL("image/png") : ""
    };
}

/* ============================================================
   SUBMIT CHECK-IN
============================================================ */
document.getElementById("submitBtn").addEventListener("click", () => {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName  = document.getElementById("lastName").value.trim();
    const companySel = document.getElementById("companySelect").value;
    const reasonSel = document.getElementById("reasonSelect").value;
    const sigPad = window._sigPad;

    if (!firstName || !lastName) return alert("Enter first and last name.");

    let employer = companySel === OTHER_COMPANY_VALUE ? document.getElementById("otherCompany").value.trim() : companySel;
    if (!employer) return alert("Select or enter a company.");

    let reason = reasonSel === "other" ? document.getElementById("otherReasonInput").value.trim() : reasonSel;
    if (!reason) return alert("Enter a reason for testing.");

    const services = {
        drug: document.getElementById("srvDrug").checked,
        alcohol: document.getElementById("srvAlcohol").checked,
        vision: document.getElementById("srvVision").checked,
        dot: document.getElementById("srvDOT").checked,
        dna: document.getElementById("srvDNA").checked,
        other: document.getElementById("srvOther").checked,
        otherText: document.getElementById("srvOtherText").value.trim()
    };

    if (Object.values(services).every(v => v === false)) return alert("Select at least one service.");

    if (services.other && !services.otherText) return alert("Describe the 'Other' service.");

    if (!sigPad.hasSignature()) return alert("Signature required.");

    const record = {
        firstName,
        lastName,
        employer,
        reason,
        services,
        signature: sigPad.getDataUrl(),
        date: new Date().toISOString()
    };

    addRecord(record);
    alert("Donor successfully checked in!");

    location.reload();
});

/* ============================================================
   RENDER RECORDS (SHOW ALL IN ADMIN)
============================================================ */
function renderAdminRecords() {
    const tbody = document.querySelector("#resultsTable tbody");
    const list = loadRecords();

    tbody.innerHTML = "";

    list.forEach(rec => {
        const d = new Date(rec.date);
        tbody.innerHTML += `
            <tr>
                <td>${d.toLocaleDateString()}</td>
                <td>${d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</td>
                <td>${rec.firstName} ${rec.lastName}</td>
                <td>${rec.employer}</td>
                <td>${rec.reason}</td>
                <td>${Object.keys(rec.services).filter(s => rec.services[s]).join(", ")}</td>
                <td><button class="viewSigBtn">View</button></td>
            </tr>
        `;
    });

    document.querySelectorAll(".viewSigBtn").forEach((btn, i) => {
        btn.addEventListener("click", () => {
            document.getElementById("signatureModalImg").src = list[i].signature;
            document.getElementById("signatureModal").style.display = "flex";
        });
    });
}

document.getElementById("closeSignatureModal").addEventListener("click", () => {
    document.getElementById("signatureModal").style.display = "none";
});

/* ============================================================
   ADMIN LOGIN
============================================================ */
document.getElementById("toggleAdminBtn").addEventListener("click", () => {
    const pin = prompt("Enter Admin PIN:");
    if (pin === ADMIN_PIN) {
        document.getElementById("adminArea").style.display = "block";
        document.getElementById("checkInSection").style.display = "none";
        renderAdminRecords();
    } else {
        alert("Incorrect PIN.");
    }
});

document.getElementById("exitAdminBtn").addEventListener("click", () => {
    document.getElementById("adminArea").style.display = "none";
    document.getElementById("checkInSection").style.display = "block";
});

/* ============================================================
   INIT
============================================================ */
window.onload = () => {
    renderCompanySelect();
    setupSignaturePad();
};

// RESET FORM BUTTON
document.getElementById("resetFormBtn")?.addEventListener("click", () => {
    location.reload();
});
