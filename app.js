/* =========================================================
   GLOBAL VARIABLES + CONSTANTS
========================================================= */
const ADMIN_PIN = "2468";   // Admin PIN
let signaturePad = null;

/* =========================================================
   SIGNATURE PAD INIT
========================================================= */
function setupSignaturePad() {
    const canvas = document.getElementById("signaturePad");
    const placeholder = document.getElementById("sigPlaceholder");

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    let drawing = false;

    canvas.addEventListener("mousedown", () => {
        drawing = true;
        placeholder.style.display = "none";
    });

    // Hide placeholder when signing starts (mouse)
canvas.addEventListener("mousedown", () => {
    drawing = true;
    placeholder.style.display = "none";
});

// Mouse up stops drawing
canvas.addEventListener("mouseup", () => { 
    drawing = false; 
    ctx.beginPath(); 
});

// Mouse move draws
canvas.addEventListener("mousemove", draw);

// Hide placeholder on touchscreen start
canvas.addEventListener("touchstart", (e) => {
    drawing = true;
    placeholder.style.display = "none";
    ctx.beginPath();
});

// Mobile drawing support
canvas.addEventListener("touchmove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
});

// Restore placeholder when signature is cleared
document.getElementById("clearSigBtn").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    placeholder.style.display = "block";
});

   
   
    function draw(e) {
        if (!drawing) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    }

    // Mobile support
    canvas.addEventListener("touchstart", (e) => {
        drawing = true;
        placeholder.style.display = "none";
    });

    canvas.addEventListener("touchend", () => { drawing = false; ctx.beginPath(); });

    canvas.addEventListener("touchmove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        draw({
            offsetX: touch.clientX - rect.left,
            offsetY: touch.clientY - rect.top
        });
        e.preventDefault();
    });
}

/* CLEAR SIGNATURE */
document.getElementById("clearSigBtn").addEventListener("click", () => {
    const canvas = document.getElementById("signaturePad");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("sigPlaceholder").style.display = "block";
});

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

    // Collect selected services
    const services = Array.from(
        document.querySelectorAll('input[name="services"]:checked')
    ).map(cb => cb.value);

    // Add "Other service text"
    if (services.includes("Other")) {
        const custom = document.getElementById("srvOtherText").value.trim();
        if (custom) services.push(custom);
    }

    // Capture signature
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

    // Save to localStorage
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

/* EXIT ADMIN */
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

    // Click signature → full modal
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

