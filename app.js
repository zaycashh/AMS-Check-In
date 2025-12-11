/* ============================================================
   GLOBAL CONSTANTS
============================================================ */

const STORAGE_KEY = "drug_test_checkins_v3";
const COMPANY_LIST_KEY = "drug_test_company_list_v3";
const OTHER_COMPANY_VALUE = "__OTHER__";
const ADMIN_PIN = "2468";

/* ============================================================
   LOAD & SAVE FUNCTIONS
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

function loadCompanyList() {
    return JSON.parse(localStorage.getItem(COMPANY_LIST_KEY)) || [];
}

function saveCompanyList(list) {
    localStorage.setItem(COMPANY_LIST_KEY, JSON.stringify(list));
}

/* ============================================================
   COMPANY SELECT
============================================================ */

function renderCompanySelect() {
    const select = document.getElementById("companySelect");
    if (!select) return;

    const companies = loadCompanyList();

    select.innerHTML = `<option value="">-- Select Company --</option>`;

    companies.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });

    const other = document.createElement("option");
    other.value = OTHER_COMPANY_VALUE;
    other.textContent = "Other (enter manually)";
    select.appendChild(other);
}

function renderCompanyListDisplay() {
    const container = document.getElementById("companyListDisplay");
    const search = document.getElementById("companySearch").value.toLowerCase();
    const companies = loadCompanyList();

    let html = companies
        .filter(c => c.toLowerCase().includes(search))
        .map(c => `
            <div class="company-item">
                <span>${c}</span>
                <div>
                    <button class="editCompanyBtn" data-name="${c}">Edit</button>
                    <button class="deleteCompanyBtn" data-name="${c}" style="background:#d9534f;color:white;">Delete</button>
                </div>
            </div>
        `)
        .join("");

    container.innerHTML = html || "<p>No companies found.</p>";

    document.querySelectorAll(".editCompanyBtn").forEach(btn => {
        btn.onclick = () => {
            const name = btn.dataset.name;
            const updated = prompt("Edit company name:", name);
            if (!updated) return;

            let list = loadCompanyList();
            const i = list.indexOf(name);
            list[i] = updated.trim();
            list.sort();
            saveCompanyList(list);
            renderCompanySelect();
            renderCompanyListDisplay();
        };
    });

    document.querySelectorAll(".deleteCompanyBtn").forEach(btn => {
        btn.onclick = () => {
            const name = btn.dataset.name;
            if (!confirm(`Delete ${name}?`)) return;

            let list = loadCompanyList().filter(n => n !== name);
            saveCompanyList(list);
            renderCompanySelect();
            renderCompanyListDisplay();
        };
    });
}

/* ============================================================
   OTHER FIELD TOGGLES
============================================================ */

function toggleOtherCompany() {
    document.getElementById("otherCompanyWrapper").style.display =
        document.getElementById("companySelect").value === OTHER_COMPANY_VALUE
            ? "block"
            : "none";
}

function toggleOtherReason() {
    document.getElementById("otherReasonWrapper").style.display =
        document.getElementById("reasonSelect").value === "other"
            ? "block"
            : "none";
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

    let drawing = false,
        signed = false,
        lastX = 0,
        lastY = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    resize();
    window.addEventListener("resize", resize);

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        return { x, y };
    }

    function start(e) {
        drawing = true;
        const p = getPos(e);
        lastX = p.x;
        lastY = p.y;
        placeholder.style.display = "none";
    }

    function move(e) {
        if (!drawing) return;
        const p = getPos(e);
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
    window.addEventListener("mouseup", () => (drawing = false));

    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", move);
    canvas.addEventListener("touchend", () => (drawing = false));

    document.getElementById("clearSigBtn").onclick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        signed = false;
        placeholder.style.display = "block";
    };

    window._sigPad = {
        hasSignature: () => signed,
        getDataUrl: () => (signed ? canvas.toDataURL("image/png") : ""),
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

document.getElementById("submitBtn").onclick = () => {
    const fn = firstName.value.trim();
    const ln = lastName.value.trim();
    let company = companySelect.value;
    let reason = reasonSelect.value;

    if (!fn || !ln) return alert("Enter first and last name.");

    if (company === OTHER_COMPANY_VALUE)
        company = otherCompany.value.trim();
    if (!company) return alert("Enter a company.");

    if (reason === "other")
        reason = otherReasonInput.value.trim();
    if (!reason) return alert("Enter reason.");

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
        return alert("Select a service.");

    if (services.other && !services.otherText)
        return alert("Describe the other service.");

    if (!window._sigPad.hasSignature())
        return alert("Signature required.");

    addRecord({
        firstName: fn,
        lastName: ln,
        employer: company,
        reason,
        services,
        signature: window._sigPad.getDataUrl(),
        date: new Date().toISOString()
    });

    alert("Donor checked in.");
    window._sigPad.clear();
    document.getElementById("checkInSection").reset?.(); // clean reset
    location.reload();
};

/* ============================================================
   ADMIN LOGIN
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
   INIT
============================================================ */

window.onload = () => {
    renderCompanySelect();
    renderCompanyListDisplay();
    setupSignaturePad();
};
