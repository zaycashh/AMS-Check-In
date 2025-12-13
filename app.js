/* =========================================================
   GLOBAL VARIABLES
========================================================= */
const ADMIN_PIN = "2468";
let isAdminMode = false;

let searchPanel = null;
let searchOverlay = null;

/* =========================================================
   SIGNATURE PAD INITIALIZATION
========================================================= */
function setupSignaturePad() {
    const canvas = document.getElementById("signaturePad");
    const placeholder = document.getElementById("sigPlaceholder");
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    let drawing = false;

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const p = e.touches ? e.touches[0] : e;
        return { x: p.clientX - rect.left, y: p.clientY - rect.top };
    }

    function draw(e) {
        if (!drawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        if (e.touches) e.preventDefault();
    }

    canvas.addEventListener("mousedown", e => {
        drawing = true;
        placeholder.style.display = "none";
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener("mouseup", () => {
        drawing = false;
        ctx.beginPath();
    });

    canvas.addEventListener("mousemove", draw);

    canvas.addEventListener("touchstart", e => {
        drawing = true;
        placeholder.style.display = "none";
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
    });

    canvas.addEventListener("touchend", () => {
        drawing = false;
        ctx.beginPath();
    });

    canvas.addEventListener("touchmove", draw);

    const clearBtn = document.getElementById("clearSigBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            placeholder.style.display = "block";
        });
    }
}

/* =========================================================
   SUBMIT FORM
========================================================= */
document.getElementById("submitBtn")?.addEventListener("click", () => {
    const first = firstName.value.trim();
    const last = lastName.value.trim();

    if (!first || !last) {
        alert("Please enter first and last name.");
        return;
    }

    const record = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        first,
        last,
        company: companySelect.value,
        reason: reasonSelect.value,
        signature: signaturePad.toDataURL()
    };

    const logs = JSON.parse(localStorage.getItem("ams_logs") || "[]");
    logs.push(record);
    localStorage.setItem("ams_logs", JSON.stringify(logs));

    alert("Check-in submitted!");
    location.reload();
});

/* =========================================================
   ADMIN LOGIN
========================================================= */
document.getElementById("toggleAdminBtn")?.addEventListener("click", () => {
    const pin = prompt("Enter Admin PIN:");
    if (pin !== ADMIN_PIN) {
        alert("Incorrect PIN");
        return;
    }

    isAdminMode = true;

    adminArea.style.display = "block";
    checkInSection.style.display = "none";

    if (searchPanel) searchPanel.classList.remove("open");
    if (searchOverlay) searchOverlay.style.display = "none";

    if (!window.__recentLoaded && typeof renderRecentCheckIns === "function") {
        renderRecentCheckIns();
        window.__recentLoaded = true;
    }

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelector('[data-tab="tabRecent"]')?.classList.add("active");

    document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
    document.getElementById("tabRecent")?.style.display = "block";
});

/* =========================================================
   ADMIN TAB NAVIGATION
========================================================= */
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        const target = tab.dataset.tab;

        if (searchPanel) searchPanel.classList.remove("open");
        if (searchOverlay) searchOverlay.style.display = "none";

        if (target === "tabSearch") {
            if (!isAdminMode) return;
            searchPanel.classList.add("open");
            searchOverlay.style.display = "block";
            return;
        }

        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
        document.getElementById(target)?.style.display = "block";
    });
});

/* =========================================================
   EXIT ADMIN MODE
========================================================= */
document.getElementById("exitAdminBtn")?.addEventListener("click", () => {
    isAdminMode = false;

    if (searchPanel) searchPanel.classList.remove("open");
    if (searchOverlay) searchOverlay.style.display = "none";

    adminArea.style.display = "none";
    checkInSection.style.display = "block";
});

/* =========================================================
   SEARCH PANEL CLOSE (X + OVERLAY)
========================================================= */
document.getElementById("closeSearchPanel")?.addEventListener("click", () => {
    searchPanel.classList.remove("open");
    searchOverlay.style.display = "none";
});

document.addEventListener("click", e => {
    if (e.target === searchOverlay) {
        searchPanel.classList.remove("open");
        searchOverlay.style.display = "none";
    }
});

/* =========================================================
   PAGE LOAD
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    searchPanel = document.getElementById("searchPanel");
    searchOverlay = document.getElementById("searchPanelOverlay");
    setupSignaturePad();
});
