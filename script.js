// ==========================================
// 1. LOADER (إخفاء شاشة التحميل)
// ==========================================
window.addEventListener("load", function () {
    setTimeout(function () {
        const loader = document.getElementById("loader");
        if (loader) {
            loader.style.display = "none";
        }
    }, 1500);
});

// ==========================================
// 2. SMOOTH SCROLL (التنقل السلس عند الضغط على الروابط)
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", function (e) {
        const id = this.getAttribute("href");

        if (id && id.startsWith("#") && id !== "#" && document.querySelector(id)) {
            e.preventDefault();
            document.querySelector(id).scrollIntoView({
                behavior: "smooth"
            });

            // إغلاق القائمة الجانبية إذا كانت مفتوحة عند الضغط على رابط
            const sideMenu = document.getElementById("sideMenu");
            if (sideMenu && sideMenu.classList.contains("active")) {
                sideMenu.classList.remove("active");
            }
        }
    });
});

// ==========================================
// 3. IMAGE SLIDER (سلايدر الصور)
// ==========================================
const slides = document.querySelectorAll(".slide");
if (slides.length > 0) {
    let current = 0;
    setInterval(function () {
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
    }, 4000);
}

// ==========================================
// 4. LIVE MENU SEARCH (البحث الفوري في المنيو)
// ==========================================
const search = document.getElementById("search");
if (search) {
    search.addEventListener("keyup", function () {
        const value = this.value.toLowerCase().trim();
        const cards = document.querySelectorAll(".card");

        cards.forEach(function (card) {
            const text = card.innerText.toLowerCase();
            if (text.includes(value)) {
                card.style.display = "inline-block";
            } else {
                card.style.display = "none";
            }
        });
    });
}

// ==========================================
// 5. COUNTDOWN TIMER (العداد التنازلي للعروض)
// ==========================================
const daysElem = document.getElementById("days");
if (daysElem) {
    let total = 172800; // 48 ساعة بالثواني

    const timer = setInterval(function () {
        let d = Math.floor(total / 86400);
        let h = Math.floor((total % 86400) / 3600);
        let m = Math.floor((total % 3600) / 60);
        let s = total % 60;

        document.getElementById("days").textContent = String(d).padStart(2, '0');
        document.getElementById("hours").textContent = String(h).padStart(2, '0');
        document.getElementById("minutes").textContent = String(m).padStart(2, '0');
        document.getElementById("seconds").textContent = String(s).padStart(2, '0');

        if (total > 0) {
            total--;
        } else {
            clearInterval(timer);
        }
    }, 1000);
}

// ==========================================
// 6. NAVBAR SCROLL EFFECT (تغيير خلفية الشريط عند التمرير)
// ==========================================
const navbar = document.querySelector(".top-nav") || document.getElementById("navbar");
if (navbar) {
    window.addEventListener("scroll", function () {
        if (window.scrollY > 80) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });
}

// ==========================================
// 7. SIDE MENU TOGGLE (فتح وغلق القائمة الجانبية)
// ==========================================
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");

if (menuBtn && sideMenu) {
    menuBtn.onclick = function (e) {
        e.preventDefault();
        sideMenu.classList.toggle("active");
    };
}

console.log("MIM89 Fast Food System Ready!");
