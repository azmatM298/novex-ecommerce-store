
const loginForm = document.getElementById("admin-login-form");
const loginBox = document.getElementById("admin-login");
const dashboard = document.getElementById("dashboard");

async function checkAdmin() {
    const response = await fetch("/api/admin/check");

    if (response.ok) {
        loginBox.hidden = true;
        dashboard.hidden = false;
        loadAdminData();
    }
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-password").value;

    const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (response.ok) {
        loginBox.hidden = true;
        dashboard.hidden = false;
        loadAdminData();
    } else {
        document.getElementById("login-message").textContent = result.message;
    }
});

async function loadAdminData() {
    await loadAdminProducts();
    await loadAdminOrders();
}

async function loadAdminProducts() {
    const response = await fetch("/api/products");
    const products = await response.json();

    document.getElementById("admin-products").innerHTML =
        products.map(p => `
            <div class="category-card">
                <h3>${p.name}</h3>
                <p>Category: ${p.category}</p>
                <p>Price: Rs. ${p.price}</p>
                <p>Stock: ${p.stock}</p>
            </div>
        `).join("") || "<p>No products yet.</p>";
}

async function loadAdminOrders() {
    const response = await fetch("/api/admin/orders");

    if (!response.ok) return;

    const orders = await response.json();

    document.getElementById("admin-orders").innerHTML =
        orders.map(o => `
            <div class="category-card">
                <h3>Order #${o.id}</h3>
                <p>Customer: ${o.customer_name}</p>
                <p>Phone: ${o.phone}</p>
                <p>Total: Rs. ${o.total}</p>
                <p>Status: ${o.status}</p>
            </div>
        `).join("") || "<p>No orders yet.</p>";
}

document.getElementById("product-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const product = {
        name: document.getElementById("name").value.trim(),
        category: document.getElementById("category").value,
        price: Number(document.getElementById("price").value),
        stock: Number(document.getElementById("stock").value),
        image: document.getElementById("image").value.trim(),
        description: document.getElementById("description").value.trim()
    };

    const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
    });

    const result = await response.json();

    document.getElementById("admin-message").textContent = result.message;

    if (response.ok) {
        e.target.reset();
        loadAdminProducts();
    }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST" });

    dashboard.hidden = true;
    loginBox.hidden = false;
});

checkAdmin();
