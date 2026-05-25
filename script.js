function toggleMenu(){
    const navLinks = document.getElementById("navLinks");
    navLinks.classList.toggle("active");
}

function toggleContact(event){
    event.preventDefault();
    event.stopPropagation();

    const contactMenu = document.getElementById("contactMenu");
    contactMenu.classList.toggle("show");
}

document.addEventListener("click", function(){
    const contactMenu = document.getElementById("contactMenu");

    if(contactMenu){
        contactMenu.classList.remove("show");
    }
});

function showMessage(){
    window.location.href = "mailto:contact@timbiai.com";
}