const navLinks = document.getElementById("navLinks");
const menuToggle = document.getElementById("menuToggle");
const navbar = document.getElementById("navbar");
const year = document.getElementById("year");

if (year) {
    year.textContent = new Date().getFullYear();
}

function closeMenu() {
    navLinks.classList.remove("active");
    menuToggle.classList.remove("active");
}

menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");
    menuToggle.classList.toggle("active", isOpen);
});

navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
});

window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
});

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.14 });

revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;
    revealObserver.observe(element);
});
