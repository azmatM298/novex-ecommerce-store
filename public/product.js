async function loadProduct() {
    const id = new URLSearchParams(window.location.search).get("id");
    const container = document.getElementById("product-detail");

    if (!id) {
        container.innerHTML = "Product not found.";
        return;
    }

    try {
        const response = await fetch(`/api/products/${id}`);

        if (!response.ok) throw new Error("Product not found");

        const product = await response.json();

        container.innerHTML = `
            <img src="${product.image || 'images/hero.jpg'}"
                 alt="${product.name}"
                 style="width:300px;max-width:100%;border-radius:12px;">

            <h2>${product.name}</h2>
            <p>${product.description || ""}</p>
            <h3>Rs. ${Number(product.price).toLocaleString()}</h3>
            <p>Available stock: ${product.stock}</p>
            <button onclick="addToCart(${product.id})">Add to Cart</button>
        `;
    } catch (error) {
        container.innerHTML = "Product load nahi ho saka.";
    }
}

function addToCart(id) {
    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Product added to cart!");
}

loadProduct();