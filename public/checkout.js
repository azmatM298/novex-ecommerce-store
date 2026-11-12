document.getElementById("checkout-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("customer-name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const message = document.getElementById("checkout-message");

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (cart.length === 0) {
        message.textContent = "Your cart is empty!";
        return;
    }

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_name: name,
                phone,
                address,
                items: cart
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Order failed");
        }

        localStorage.removeItem("cart");
        message.textContent = "Order placed successfully! Order ID: " + result.orderId;
        document.getElementById("checkout-form").reset();

    } catch (error) {
        message.textContent = error.message;
    }
});