
async function loadProducts() {
    const container = document.getElementById("products-grid");

    try {
        const params = new URLSearchParams(window.location.search);
        const category = params.get("category");
        const search = params.get("q");

        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Products loading failed");
        }

        let products = await response.json();

        if (category) {
            products = products.filter(product =>
                product.category?.toLowerCase() === category.toLowerCase()
            );
        }

        if (search) {
            products = products.filter(product =>
                product.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (products.length === 0) {
            container.innerHTML = "<p>No products found.</p>";
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="category-card">
                <img src="${product.image || 'images/tech-1.webp'}"
                     alt="${product.name}"
                     style="width:100%;max-width:220px;height:180px;object-fit:contain;">

                <h3>${product.name}</h3>
                <p>Rs. ${Number(product.price).toLocaleString()}</p>

                <a class="shop-btn" href="/product.html?id=${product.id}">
                    View Product
                </a>
            </div>
        `).join("");

    } catch (error) {
        container.innerHTML = "Products load nahi ho sake.";
        console.error(error);
    }
}

loadProducts();
