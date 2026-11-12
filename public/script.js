document.addEventListener("DOMContentLoaded", () => {
    console.log("NOVEX Store website loaded successfully!");

    const cartLink = document.querySelector(".cart-link");

    if (cartLink) {
        cartLink.addEventListener("click", () => {
            console.log("Opening shopping cart...");
        });
    }
});