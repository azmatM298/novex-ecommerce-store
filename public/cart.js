async function loadCart() {
    const container = document.getElementById("cart-items");
    const totalBox = document.getElementById("cart-total");

    let cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        totalBox.textContent = "Total: Rs. 0";
        return;
    }

    try {
        const response = await fetch("/api/products");
        const products = await response.json();

        let total = 0;

        container.innerHTML = cart.map(item => {
            const product = products.find(p => p.id === item.id);

            if (!product) return "";

            const subtotal = product.price * item.quantity;
            total += subtotal;

            return `
                <div class="category-card">
                    <h3>${product.name}</h3>
                    <p>Price: Rs. ${product.price}</p>
                    <p>Quantity: ${item.quantity}</p>
                    <p>Subtotal: Rs. ${subtotal}</p>
                    <button onclick="removeItem(${product.id})">
                        Remove
                    </button>
                </div>
            `;
        }).join("");

        totalBox.textContent = "Total: Rs. " + total.toLocaleString();

    } catch (error) {
        container.innerHTML = "<p>Unable to load cart.</p>";
    }
}

function removeItem(id) {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");

    cart = cart.filter(item => item.id !== id);

    localStorage.setItem("cart", JSON.stringify(cart));

    loadCart();
}

loadCart();