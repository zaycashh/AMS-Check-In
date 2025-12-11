/* =========================================================
   GLOBAL VARIABLES + CONSTANTS
========================================================= */
const ADMIN_PIN = "2468"; 
let signaturePad = null;

/* =========================================================
   SIGNATURE PAD INIT (FIXED & UPDATED)
========================================================= */
function setupSignaturePad() {
    const canvas = document.getElementById("signaturePad");
    const placeholder = document.getElementById("sigPlaceholder");
    const ctx = canvas.getContext("2d");

    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    let drawing = false;

    /* ------------ Unified Mouse Position Function ------------ */
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /* ------------ Unified Touch Position Function ------------ */
    function getTouchPos(e) {
        const rect = canvas.getBoundingClientRect();
        const t = e.touches[0];
        return {
            x: t.clientX - rect.left,
            y: t.clientY - rect.top
        };
    }

    /* =========================================================
       MOUSE EVENTS — PERFECT ALIGNMENT
    ========================================================== */
    canvas.addEventListener("mousedown", (e) => {
        const pos = getMousePos(e);
        drawing = true;
        placeholder.style.display = "none";
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!drawing) return;
        const pos = getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener("mouseup", () => {
        drawing = false;
        ctx.beginPath();
    });

    /* =========================================================
       TOUCH EVENTS — PERFECT ALIGNMENT
    ========================================================== */
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const pos = getTouchPos(e);
        drawing = true;
        placeholder.style.display = "none";
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (!drawing) return;
        const pos = getTouchPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }, { passive: false });

    canvas.addEventListener("touchend", () => {
        drawing = false;
        ctx.beginPath();
    });

    /* =========================================================
       CLEAR SIGNATURE
    ========================================================== */
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
   SERVICES — HANDLE "OTHER"
========================================================= */
document.querySelector('input[value="Other"]').addEventListener("change", (e) => {
    document.getElementById("otherServiceWrapper").style.display =
        e.target.checked ? "block" : "none";
});

/* =========================================================
   FORM SUBMISSION
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

    let finalCompany = company;
    if (company === "__OTHER__") {
        finalCompany = document.getElementById("otherCompany").value.trim();
    }

    let finalReason = reason;
    if (reason === "other") {
        finalReason = document.getElementById("otherReasonInput").value.trim();
    }

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
});

/* =========================================================
   RESET FORM BUTTON
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
        renderAdminRecords();
    } else {
        alert("Incorrect PIN.");
    }
});

document.getElementById("exitAdminBtn").addEventListener("click", () => {
    document.getElementById("adminArea").style.display = "none";
    document.getElementById("checkInSection").style.display = "block";
});

/* =========================================================
   RENDER ADMIN TABLE
========================================================= */
function renderAdminRecords() {
    const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");
    const tbody = document.querySelector("#resultsTable tbody");
    tbody.innerHTML = "";

    logs.forEach(log => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${log.date}</td>
            <td>${log.time}</td>
            <td>${log.first} ${log.last}</td>
            <td>${log.company}</td>
            <td>${log.reason}</td>
            <td>${log.services}</td>
            <td><img src="${log.signature}" class="sig-thumb" data-img="${log.signature}"></td>
        `;

        tbody.appendChild(row);
    });

    document.querySelectorAll(".sig-thumb").forEach(img => {
        img.addEventListener("click", () => {
            document.getElementById("signatureModalImg").src =
                img.getAttribute("data-img");
            document.getElementById("signatureModal").style.display = "flex";
        });
    });
}

/* CLOSE SIGNATURE MODAL */
document.getElementById("closeSignatureModal").addEventListener("click", () => {
    document.getElementById("signatureModal").style.display = "none";
});

/* =========================================================
   INITIAL PAGE LOAD
========================================================= */
window.onload = () => {
    setupSignaturePad();
};
