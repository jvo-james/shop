document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  const baseProducts = [
    ...(window.womenProducts || []),
    ...(window.menProducts || []),
    ...(window.childrenProducts || [])
  ];

  const HOUSE_VENDOR_ID = "maison-elitaire";
  const HOUSE_VENDOR_NAME = "Maison Élitaire";
  const VENDOR_PRODUCTS_STORAGE_KEY = "maison-elitaire-vendor-products";
  const VENDOR_ACCOUNTS_STORAGE_KEY = "maison-elitaire-vendor-accounts";
  const VENDOR_SESSION_STORAGE_KEY = "maison-elitaire-vendor-session";
  const editMeta = window.editMeta || {};
  const PRODUCTS_PER_PAGE = 12;
  const CART_STORAGE_KEY = "maison-elitaire-cart";
  const PRICE_REDUCTION_FACTOR = 0.4;

  const reduceHousePrice = (value) => {
    const base = Number(value) || 0;
    return Math.max(5, Math.round((base * PRICE_REDUCTION_FACTOR) / 5) * 5);
  };

  const hydrateCatalogProduct = (product) => ({
    ...product,
    price: reduceHousePrice(product.price),
    vendorId: product.vendorId || HOUSE_VENDOR_ID,
    vendorName: product.vendorName || HOUSE_VENDOR_NAME,
    source: product.source || "house"
  });

  const normalizeVendorProduct = (product) => ({
    ...product,
    ownerId: product.ownerId || product.vendorId || HOUSE_VENDOR_ID,
    vendorId: product.vendorId || product.ownerId || HOUSE_VENDOR_ID,
    vendorName: product.vendorName || HOUSE_VENDOR_NAME,
    source: product.source || "vendor"
  });

  const baseCatalogProducts = baseProducts.map(hydrateCatalogProduct);

  const getStoredVendorProducts = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(VENDOR_PRODUCTS_STORAGE_KEY));
      return Array.isArray(saved) ? saved.map(normalizeVendorProduct) : [];
    } catch (error) {
      return [];
    }
  };

  const saveStoredVendorProducts = (products) => {
    localStorage.setItem(VENDOR_PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  };

  const getStoredVendorAccounts = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(VENDOR_ACCOUNTS_STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  };

  const saveStoredVendorAccounts = (accounts) => {
    localStorage.setItem(VENDOR_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  };

  const getStoredVendorSession = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(VENDOR_SESSION_STORAGE_KEY));
      return saved && typeof saved === "object" ? saved : null;
    } catch (error) {
      return null;
    }
  };

  const saveStoredVendorSession = (session) => {
    localStorage.setItem(VENDOR_SESSION_STORAGE_KEY, JSON.stringify(session));
  };

  const clearVendorSession = () => {
    localStorage.removeItem(VENDOR_SESSION_STORAGE_KEY);
  };

  const getVendorById = (vendorId) => {
    const id = String(vendorId || "").trim();
    if (!id) return null;
    const accounts = getStoredVendorAccounts();
    return accounts.find((account) => account.vendorId === id) || null;
  };

  const getVendorByEmail = (email) => {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) return null;
    const accounts = getStoredVendorAccounts();
    return accounts.find((account) => String(account.email || "").trim().toLowerCase() === normalized) || null;
  };

  const getCurrentVendor = () => {
    const session = getStoredVendorSession();
    if (!session || !session.vendorId) return null;
    return getVendorById(session.vendorId);
  };

  let vendorProducts = getStoredVendorProducts();
  let allProducts = [...baseCatalogProducts, ...vendorProducts];

  const refreshCatalogProducts = () => {
    vendorProducts = getStoredVendorProducts();
    allProducts = [...baseCatalogProducts, ...vendorProducts];
    return allProducts;
  };

  const currency = (value) => {
    const amount = Number(value) || 0;
    try {
      return new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      return `GH₵${amount.toFixed(0)}`;
    }
  };

  const normalize = (value) => String(value || "").trim().toLowerCase();

  const getQueryParam = (name) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  };

  const getProductById = (id) => {
    return allProducts.find((product) => product.id === id);
  };

  const createSlugSafeUrl = (base, params = {}) => {
    const url = new URL(base, window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    });
    return `${url.pathname}${url.search}`;
  };

  const defaultCart = [
    {
      id: "women-tailored-wool-blazer",
      name: "Tailored Wool Blazer",
      category: "Women",
      subcategory: "Outerwear",
      price: reduceHousePrice(420),
      qty: 1,
      image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "men-structured-jacket",
      name: "Structured Jacket",
      category: "Men",
      subcategory: "Jackets",
      price: reduceHousePrice(390),
      qty: 1,
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const getStoredCart = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
      return Array.isArray(saved) ? saved : defaultCart;
    } catch (error) {
      return defaultCart;
    }
  };

  let cart = getStoredCart();
  let quickProduct = null;
  let quickQuantity = 1;

  const saveCart = () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  };

  const cartDrawer = document.querySelector("[data-cart-drawer]");
  const cartItemsWrap = document.querySelector("[data-cart-items]");
  const cartSubtotal = document.querySelector("[data-cart-subtotal]");
  const cartCounts = document.querySelectorAll("[data-cart-count]");
  const cartOpenButtons = document.querySelectorAll(".cart-open-btn");
  const cartCloseButton = document.querySelector(".cart-close-btn");
  const cartOverlayClose = document.querySelector("[data-cart-close]");
  const cartClearBtn = document.querySelector(".cart-clear-btn");

  const searchOverlay = document.querySelector("[data-search-overlay]");
  const searchOpenButtons = document.querySelectorAll(".search-open-btn");
  const searchCloseButton = document.querySelector(".search-close-btn");
  const searchInput = document.getElementById("searchInput");
  const searchResultsGrid = document.getElementById("searchResultsGrid");
  const searchSuggestionButtons = document.querySelectorAll(".search-suggestions button");

  const quickOverlay = document.querySelector("[data-quick-view-overlay]");
  const quickCloseButton = document.querySelector(".quick-view-close-btn");
  const quickName = document.querySelector("[data-quick-view-name]");
  const quickCategory = document.querySelector("[data-quick-view-category]");
  const quickPrice = document.querySelector("[data-quick-view-price]");
  const quickDesc = document.querySelector("[data-quick-view-description]");
  const quickImage = document.querySelector("[data-quick-view-image]");
  const quickQty = document.querySelector("[data-quick-qty]");
  const quickAdd = document.querySelector("[data-quick-add]");
  const quickViewLink = document.querySelector("[data-quick-view-link]");
  const quickSizesWrap = document.querySelector("[data-quick-view-sizes]");
  const qtyMinus = document.querySelector("[data-qty-minus]");
  const qtyPlus = document.querySelector("[data-qty-plus]");

  function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCounts.forEach((el) => {
      el.textContent = total;
    });
  }

  function updateCartSubtotal() {
    if (!cartSubtotal) return;
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    cartSubtotal.textContent = currency(subtotal);
  }

  function renderCart() {
    if (!cartItemsWrap) return;

    if (!cart.length) {
      cartItemsWrap.innerHTML = `<div class="empty-cart">Your bag is empty.</div>`;
      updateCartCount();
      updateCartSubtotal();
      saveCart();
      return;
    }

    cartItemsWrap.innerHTML = cart.map((item, index) => `
      <article class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-copy">
          <h4>${item.name}</h4>
          <p>${item.category}${item.subcategory ? ` / ${item.subcategory}` : ""}</p>
          <div class="cart-item-row">
            <strong>${currency(item.price)}</strong>
            <button class="cart-remove-btn" data-remove-index="${index}" type="button">Remove</button>
          </div>
          <div class="cart-item-row">
            <div class="cart-item-controls">
              <button type="button" data-decrease-index="${index}">-</button>
              <span>${item.qty}</span>
              <button type="button" data-increase-index="${index}">+</button>
            </div>
            <strong>${currency(item.price * item.qty)}</strong>
          </div>
        </div>
      </article>
    `).join("");

    updateCartCount();
    updateCartSubtotal();
    saveCart();
  }

  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.add("active");
    cartDrawer.setAttribute("aria-hidden", "false");
    body.classList.add("no-scroll");
  }

  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove("active");
    cartDrawer.setAttribute("aria-hidden", "true");
    body.classList.remove("no-scroll");
  }

  function addToCart(product, qty = 1) {
    if (!product) return;

    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        price: Number(product.price),
        qty,
        image: product.image
      });
    }

    renderCart();
    openCart();
  }

  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add("active");
    searchOverlay.setAttribute("aria-hidden", "false");
    body.classList.add("no-scroll");

    if (searchInput) {
      setTimeout(() => searchInput.focus(), 50);
      renderSearchResults(searchInput.value.trim());
    }
  }

  function closeSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove("active");
    searchOverlay.setAttribute("aria-hidden", "true");
    body.classList.remove("no-scroll");
  }

  function searchProducts(term) {
    const q = normalize(term);
    if (!q) return allProducts.slice(0, 6);

    return allProducts
      .filter((product) => {
        const haystack = [
          product.name,
          product.category,
          product.subcategory,
          ...(product.edits || [])
        ];
        return haystack.some((value) => normalize(value).includes(q));
      })
      .slice(0, 8);
  }

  function createSearchResultCard(product) {
    return `
      <a class="search-result-card" href="product.html?id=${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div>
          <h4>${product.name}</h4>
          <p>${product.category} / ${product.subcategory}</p>
          <strong>${currency(product.price)}</strong>
        </div>
      </a>
    `;
  }

  function renderSearchResults(term) {
    if (!searchResultsGrid) return;

    const results = searchProducts(term);

    if (!results.length) {
      searchResultsGrid.innerHTML = `<div class="empty-cart">No matching products found.</div>`;
      return;
    }

    searchResultsGrid.innerHTML = results.map(createSearchResultCard).join("");
  }

  function renderQuickViewSizes(product) {
    if (!quickSizesWrap) return;

    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    quickSizesWrap.innerHTML = sizes.map((size, index) => `
      <button type="button" class="${index === 0 ? "active" : ""}">${size}</button>
    `).join("");

    quickSizesWrap.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        quickSizesWrap.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  function openQuickView(product) {
    if (!quickOverlay || !product) return;

    quickProduct = product;
    quickQuantity = 1;

    if (quickName) quickName.textContent = product.name;
    if (quickCategory) quickCategory.textContent = `${product.category} / ${product.subcategory}`;
    if (quickPrice) quickPrice.textContent = currency(product.price);
    if (quickDesc) quickDesc.textContent = product.description;
    if (quickImage) {
      quickImage.src = product.image;
      quickImage.alt = product.name;
    }
    if (quickQty) quickQty.textContent = quickQuantity;
    if (quickViewLink) quickViewLink.href = `product.html?id=${product.id}`;

    renderQuickViewSizes(product);

    quickOverlay.classList.add("active");
    quickOverlay.setAttribute("aria-hidden", "false");
    body.classList.add("no-scroll");
  }

  function closeQuickView() {
    if (!quickOverlay) return;
    quickOverlay.classList.remove("active");
    quickOverlay.setAttribute("aria-hidden", "true");
    body.classList.remove("no-scroll");
  }

  function openQuickViewById(productId) {
    const product = getProductById(productId);
    if (!product) return;
    openQuickView(product);
  }

  function bindGlobalQuickViewTriggers() {
    document.addEventListener("click", (e) => {
      const quickBtn = e.target.closest(".quick-view-btn");
      if (quickBtn) {
        e.preventDefault();
        e.stopPropagation();
        const product = getProductById(quickBtn.dataset.id);
        if (product) openQuickView(product);
        return;
      }

      const editorial = e.target.closest(".editorial-shop-trigger");
      if (editorial) {
        const productId = editorial.dataset.productId;
        if (productId) openQuickViewById(productId);
      }
    });

    document.querySelectorAll(".editorial-shop-trigger").forEach((item) => {
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const productId = item.dataset.productId;
          if (productId) openQuickViewById(productId);
        }
      });
    });
  }

  function bindMobileMenu() {
    const navToggle = document.querySelector(".nav-toggle");
    const mobileMenu = document.querySelector(".mobile-menu");

    if (!navToggle || !mobileMenu) return;

    navToggle.addEventListener("click", () => {
      const active = mobileMenu.classList.toggle("active");
      navToggle.setAttribute("aria-expanded", active ? "true" : "false");
    });
  }

  function createProductCard(product) {
    return `
      <article class="product-card">
        <a href="product.html?id=${product.id}">
          <div class="product-media">
            <img src="${product.image}" alt="${product.name}">
            <button class="product-quick-view quick-view-btn" data-id="${product.id}" type="button">
              Quick View
            </button>
          </div>
          <div class="product-info">
            <p class="product-category">${product.subcategory}</p>
            <h3>${product.name}</h3>
            <strong>${currency(product.price)}</strong>
          </div>
        </a>
      </article>
    `;
  }

  function renderHomeFeaturedProducts() {
    const grid = document.getElementById("homeFeaturedProducts");
    if (!grid) return;

    const featured = allProducts.filter((product) => product.featured).slice(0, 4);
    grid.innerHTML = featured.map(createProductCard).join("");
  }

  function sortProducts(products, sortValue) {
    const items = [...products];

    switch (sortValue) {
      case "price-low":
        return items.sort((a, b) => a.price - b.price);
      case "price-high":
        return items.sort((a, b) => b.price - a.price);
      case "name-asc":
        return items.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return items.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return items;
    }
  }

  function filterProductsByQuery(products) {
    const category = getQueryParam("category");
    const subcategory = getQueryParam("subcategory");
    const edit = getQueryParam("edit");

    return products.filter((product) => {
      const matchesCategory = !category || normalize(product.category) === normalize(category);
      const matchesSubcategory = !subcategory || normalize(product.subcategory) === normalize(subcategory);
      const matchesEdit = !edit || (product.edits || []).some((item) => normalize(item) === normalize(edit));
      return matchesCategory && matchesSubcategory && matchesEdit;
    });
  }

  function paginateProducts(products, page = 1) {
    const start = (page - 1) * PRODUCTS_PER_PAGE;
    return products.slice(start, start + PRODUCTS_PER_PAGE);
  }

  function updateProductsHero() {
    const eyebrow = document.getElementById("productsHeroEyebrow");
    const title = document.getElementById("productsHeroTitle");
    const copy = document.getElementById("productsHeroCopy");
    const image = document.getElementById("productsHeroImage");

    if (!eyebrow || !title || !copy || !image) return;

    const category = getQueryParam("category");
    const subcategory = getQueryParam("subcategory");
    const edit = getQueryParam("edit");

    if (edit && editMeta[edit]) {
      eyebrow.textContent = editMeta[edit].eyebrow || "Edit";
      title.textContent = editMeta[edit].title || edit;
      copy.textContent = editMeta[edit].description || "";
      image.src = editMeta[edit].heroImage || image.src;
      image.alt = editMeta[edit].title || edit;
      return;
    }

    if (category && subcategory) {
      eyebrow.textContent = category;
      title.textContent = subcategory;
      copy.textContent = `A refined selection from the ${subcategory.toLowerCase()} world of the house.`;
      return;
    }

    if (category) {
      eyebrow.textContent = "Collections";
      title.textContent = category;
      copy.textContent = `A composed selection of ${category.toLowerCase()} pieces shaped by proportion, precision, and materiality.`;
      return;
    }

    eyebrow.textContent = "Collections";
    title.textContent = "Curated modern fashion.";
    copy.textContent = "A composed edit of tailoring, fluid dressing, premium essentials, and elevated children's wear.";
  }

  function renderActiveFilters() {
    const wrap = document.getElementById("activeFilters");
    if (!wrap) return;

    const category = getQueryParam("category");
    const subcategory = getQueryParam("subcategory");
    const edit = getQueryParam("edit");

    const pills = [];

    if (category) {
      pills.push(`
        <div class="active-filter-pill">
          <span>${category}</span>
          <a href="products.html">Clear</a>
        </div>
      `);
    }

    if (subcategory) {
      pills.push(`
        <div class="active-filter-pill">
          <span>${subcategory}</span>
          <a href="${createSlugSafeUrl("products.html", { category })}">Clear</a>
        </div>
      `);
    }

    if (edit) {
      pills.push(`
        <div class="active-filter-pill">
          <span>${edit}</span>
          <a href="products.html">Clear</a>
        </div>
      `);
    }

    wrap.innerHTML = pills.join("");
  }

  function renderProductsPage() {
    const grid = document.getElementById("productsGrid");
    const toolbarLabel = document.getElementById("productsToolbarLabel");
    const paginationWrap = document.getElementById("productsPagination");
    const emptyState = document.getElementById("emptyProductsState");
    const sortSelect = document.getElementById("productsSortSelect");

    if (!grid || !toolbarLabel || !paginationWrap || !emptyState) return;

    let currentPage = Number(getQueryParam("page")) || 1;

    const render = () => {
      const filtered = filterProductsByQuery(allProducts);
      const sorted = sortProducts(filtered, sortSelect ? sortSelect.value : "default");
      const paginated = paginateProducts(sorted, currentPage);
      const totalPages = Math.max(1, Math.ceil(sorted.length / PRODUCTS_PER_PAGE));

      toolbarLabel.textContent = `Showing ${sorted.length} refined ${sorted.length === 1 ? "piece" : "pieces"}`;

      if (!sorted.length) {
        grid.innerHTML = "";
        emptyState.hidden = false;
        paginationWrap.innerHTML = "";
        return;
      }

      emptyState.hidden = true;
      grid.innerHTML = paginated.map(createProductCard).join("");

      paginationWrap.innerHTML = Array.from({ length: totalPages }, (_, i) => {
        const page = i + 1;
        return `<button type="button" class="${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>`;
      }).join("");
    };

    render();

    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        currentPage = 1;
        render();
      });
    }

    paginationWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-page]");
      if (!btn) return;
      currentPage = Number(btn.dataset.page);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    updateProductsHero();
    renderActiveFilters();
  }

  function mapColorToSwatchClass(color) {
    const c = normalize(color);

    if (c.includes("black")) return "swatch-black";
    if (c.includes("soft grey")) return "swatch-grey";
    if (c.includes("grey") || c.includes("gray")) return "swatch-grey";
    if (c.includes("cream")) return "swatch-cream";
    if (c.includes("brown")) return "swatch-brown";
    if (c.includes("stone")) return "swatch-stone";
    if (c.includes("ivory") || c.includes("white")) return "swatch-ivory";
    if (c.includes("camel")) return "swatch-camel";
    if (c.includes("champagne") || c.includes("gold")) return "swatch-champagne";

    return "swatch-ivory";
  }

  function renderProductPage() {
    if (!document.body.matches('[data-page="product"]')) return;

    const id = getQueryParam("id");
    const product = getProductById(id);

    if (!product) return;

    const productMeta = document.getElementById("productMeta");
    const productName = document.getElementById("productName");
    const productPrice = document.getElementById("productPrice");
    const productDescription = document.getElementById("productDescription");
    const productVendorWrap = document.getElementById("productVendorWrap");
    const productVendorLink = document.getElementById("productVendorLink");
    const mainProductImage = document.getElementById("mainProductImage");
    const galleryThumbs = document.getElementById("galleryThumbs");
    const productSizes = document.getElementById("productSizes");
    const productColors = document.getElementById("productColors");
    const addProductPageBtn = document.getElementById("addProductPageBtn");
    const accordionDetails = document.getElementById("accordionDetails");
    const breadcrumbCategory = document.getElementById("breadcrumbCategory");
    const breadcrumbName = document.getElementById("breadcrumbName");
    const relatedProductsGrid = document.getElementById("relatedProductsGrid");

    document.title = `${product.name} | Maison Élitaire`;

    if (productMeta) productMeta.textContent = `${product.category} / ${product.subcategory}`;
    if (productName) productName.textContent = product.name;
    if (productPrice) productPrice.textContent = currency(product.price);
    if (productDescription) productDescription.textContent = product.description;
    if (accordionDetails) accordionDetails.textContent = product.description;

    if (productVendorWrap && productVendorLink) {
      const vendorName = product.vendorName || HOUSE_VENDOR_NAME;
      const vendorId = product.vendorId || HOUSE_VENDOR_ID;
      productVendorLink.textContent = vendorName;
      productVendorLink.href = `vendors-products.html?vendorId=${encodeURIComponent(vendorId)}`;
      productVendorWrap.hidden = false;
    }

    if (breadcrumbCategory) {
      breadcrumbCategory.textContent = product.category;
      breadcrumbCategory.href = `products.html?category=${encodeURIComponent(product.category)}`;
    }

    if (breadcrumbName) breadcrumbName.textContent = product.name;

    if (mainProductImage) {
      mainProductImage.src = (product.gallery && product.gallery[0]) || product.image;
      mainProductImage.alt = product.name;
    }

    if (galleryThumbs) {
      const gallery = product.gallery && product.gallery.length ? product.gallery : [product.image];

      galleryThumbs.innerHTML = gallery.map((image, index) => `
        <button class="thumb ${index === 0 ? "active" : ""}" data-image="${image}" type="button">
          <img src="${image}" alt="${product.name} view ${index + 1}">
        </button>
      `).join("");

      galleryThumbs.addEventListener("click", (e) => {
        const thumb = e.target.closest(".thumb");
        if (!thumb || !mainProductImage) return;

        galleryThumbs.querySelectorAll(".thumb").forEach((btn) => btn.classList.remove("active"));
        thumb.classList.add("active");
        mainProductImage.src = thumb.dataset.image;
      });
    }

    if (productSizes) {
      productSizes.innerHTML = (product.sizes || []).map((size, index) => `
        <button type="button" class="${index === 0 ? "active" : ""}">${size}</button>
      `).join("");

      productSizes.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          productSizes.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    }

    if (productColors) {
      productColors.innerHTML = (product.colors || []).map((color, index) => `
        <button class="swatch ${mapColorToSwatchClass(color)} ${index === 0 ? "active" : ""}" aria-label="${color}" title="${color}" type="button"></button>
      `).join("");

      productColors.querySelectorAll(".swatch").forEach((btn) => {
        btn.addEventListener("click", () => {
          productColors.querySelectorAll(".swatch").forEach((item) => item.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    }

    if (addProductPageBtn) {
      addProductPageBtn.dataset.id = product.id;
      addProductPageBtn.dataset.name = product.name;
      addProductPageBtn.dataset.category = product.category;
      addProductPageBtn.dataset.price = String(product.price);
      addProductPageBtn.dataset.image = product.image;
      addProductPageBtn.dataset.description = product.description;

      addProductPageBtn.addEventListener("click", () => {
        addToCart(product, 1);
      });
    }

    if (relatedProductsGrid) {
      const related = allProducts
        .filter((item) => {
          if (item.id === product.id) return false;
          const sameCategory = item.category === product.category;
          const sharedEdit = (item.edits || []).some((edit) => (product.edits || []).includes(edit));
          return sameCategory || sharedEdit;
        })
        .slice(0, 4);

      relatedProductsGrid.innerHTML = related.map(createProductCard).join("");
    }
  }

  function bindAccordions() {
    const accordions = document.querySelectorAll(".accordion-item");

    accordions.forEach((item) => {
      const button = item.querySelector(".accordion-btn");
      if (!button) return;

      button.addEventListener("click", () => {
        const open = item.classList.contains("active");
        accordions.forEach((acc) => acc.classList.remove("active"));
        if (!open) item.classList.add("active");
      });
    });
  }

  function bindFiltersDrawer() {
    const openBtn = document.querySelector(".filters-drawer-open");
    const closeBtn = document.querySelector(".filters-drawer-close");
    const drawer = document.getElementById("filtersDrawer");

    if (!openBtn || !drawer) return;

    const openDrawer = () => {
      drawer.classList.add("active");
      body.classList.add("no-scroll");
      openBtn.setAttribute("aria-expanded", "true");
    };

    const closeDrawer = () => {
      drawer.classList.remove("active");
      body.classList.remove("no-scroll");
      openBtn.setAttribute("aria-expanded", "false");
    };

    openBtn.addEventListener("click", openDrawer);

    if (closeBtn) {
      closeBtn.addEventListener("click", closeDrawer);
    }

    drawer.addEventListener("click", (e) => {
      if (e.target === drawer) {
        closeDrawer();
      }
    });

    document.querySelectorAll(".filter-accordion-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.closest(".filter-accordion");
        if (!group) return;
        group.classList.toggle("active");
      });
    });
  }

  function bindGlobalUiEvents() {
    cartOpenButtons.forEach((btn) => btn.addEventListener("click", openCart));
    if (cartCloseButton) cartCloseButton.addEventListener("click", closeCart);
    if (cartOverlayClose) cartOverlayClose.addEventListener("click", closeCart);

    if (cartClearBtn) {
      cartClearBtn.addEventListener("click", () => {
        cart = [];
        renderCart();
      });
    }

    if (cartItemsWrap) {
      cartItemsWrap.addEventListener("click", (e) => {
        const removeIndex = e.target.getAttribute("data-remove-index");
        const increaseIndex = e.target.getAttribute("data-increase-index");
        const decreaseIndex = e.target.getAttribute("data-decrease-index");

        if (removeIndex !== null) {
          cart.splice(Number(removeIndex), 1);
          renderCart();
          return;
        }

        if (increaseIndex !== null) {
          cart[Number(increaseIndex)].qty += 1;
          renderCart();
          return;
        }

        if (decreaseIndex !== null) {
          const idx = Number(decreaseIndex);
          cart[idx].qty -= 1;
          if (cart[idx].qty <= 0) {
            cart.splice(idx, 1);
          }
          renderCart();
        }
      });
    }

    searchOpenButtons.forEach((btn) => btn.addEventListener("click", openSearch));
    if (searchCloseButton) searchCloseButton.addEventListener("click", closeSearch);

    if (searchOverlay) {
      searchOverlay.addEventListener("click", (e) => {
        if (e.target === searchOverlay) closeSearch();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        renderSearchResults(e.target.value);
      });
    }

    searchSuggestionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (!searchInput) return;
        searchInput.value = button.textContent.trim();
        renderSearchResults(searchInput.value);
      });
    });

    if (quickCloseButton) quickCloseButton.addEventListener("click", closeQuickView);

    if (quickOverlay) {
      quickOverlay.addEventListener("click", (e) => {
        if (e.target === quickOverlay) closeQuickView();
      });
    }

    if (qtyMinus) {
      qtyMinus.addEventListener("click", () => {
        quickQuantity = Math.max(1, quickQuantity - 1);
        if (quickQty) quickQty.textContent = quickQuantity;
      });
    }

    if (qtyPlus) {
      qtyPlus.addEventListener("click", () => {
        quickQuantity += 1;
        if (quickQty) quickQty.textContent = quickQuantity;
      });
    }

    if (quickAdd) {
      quickAdd.addEventListener("click", () => {
        if (!quickProduct) return;
        addToCart(quickProduct, quickQuantity);
        closeQuickView();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeSearch();
        closeQuickView();
        closeCart();

        const drawer = document.getElementById("filtersDrawer");
        const openBtn = document.querySelector(".filters-drawer-open");

        if (drawer && drawer.classList.contains("active")) {
          drawer.classList.remove("active");
          body.classList.remove("no-scroll");
          if (openBtn) openBtn.setAttribute("aria-expanded", "false");
        }
      }
    });
  }


  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function parseCommaList(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function createVendorProductCard(product) {
    return `
      <article class="vendor-product-card">
        <a class="vendor-product-media" href="product.html?id=${product.id}">
          <img src="${product.image}" alt="${product.name}">
        </a>
        <div class="vendor-product-copy">
          <div class="vendor-product-topline">
            <span class="status-pill">${product.category}</span>
            ${product.featured ? '<span class="status-pill status-pill-outline">Featured</span>' : ""}
            ${product.isNew ? '<span class="status-pill status-pill-outline">New</span>' : ""}
          </div>
          <h3>${product.name}</h3>
          <p>${product.subcategory || "No subcategory"} • ${currency(product.price)}</p>
          <div class="vendor-product-actions">
            <a class="btn btn-outline-dark" href="product.html?id=${product.id}" target="_blank" rel="noreferrer">Preview</a>
            <button type="button" class="btn btn-outline-dark" data-vendor-edit="${product.id}">Edit</button>
            <button type="button" class="btn btn-dark" data-vendor-delete="${product.id}">Delete</button>
          </div>
        </div>
      </article>
    `;
  }

  function createVendorPublicCard(product) {
    return `
      <article class="product-card vendor-public-card">
        <a href="product.html?id=${product.id}">
          <div class="product-media">
            <img src="${product.image}" alt="${product.name}">
          </div>
          <div class="product-info">
            <p class="product-category">${product.subcategory || product.category}</p>
            <h3>${product.name}</h3>
            <strong>${currency(product.price)}</strong>
            <span class="vendor-public-card-link">View from ${product.vendorName || HOUSE_VENDOR_NAME}</span>
          </div>
        </a>
      </article>
    `;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error("Unable to read file."));
      reader.readAsDataURL(file);
    });
  }

  function readFilesAsDataUrls(fileList) {
    const files = Array.from(fileList || []).filter(Boolean);
    return Promise.all(files.map(readFileAsDataUrl));
  }

  function renderVendorPage() {
    if (!document.body.matches('[data-page="vendor"]')) return;

    const authSection = document.getElementById("vendorAuthSection");
    const dashboardSection = document.getElementById("vendorDashboardSection");
    const authStatus = document.getElementById("vendorAuthStatus");
    const authSummary = document.getElementById("vendorAuthSummary");
    const vendorNameLabel = document.getElementById("vendorDashboardVendorName");
    const signOutBtn = document.getElementById("vendorSignOutBtn");

    const signInForm = document.getElementById("vendorSignInForm");
    const signUpForm = document.getElementById("vendorSignUpForm");

    const signInFields = {
      email: document.getElementById("vendorSignInEmail"),
      password: document.getElementById("vendorSignInPassword")
    };

    const signUpFields = {
      name: document.getElementById("vendorCreateName"),
      email: document.getElementById("vendorCreateEmail"),
      password: document.getElementById("vendorCreatePassword"),
      confirmPassword: document.getElementById("vendorCreateConfirmPassword")
    };

    const dashboardTitle = document.getElementById("vendorDashboardTitle");
    const dashboardIntro = document.getElementById("vendorDashboardIntro");
    const form = document.getElementById("vendorProductForm");
    const list = document.getElementById("vendorProductsList");
    const stats = document.getElementById("vendorStats");
    const status = document.getElementById("vendorFormStatus");
    const resetBtn = document.getElementById("vendorResetBtn");
    const searchInput = document.getElementById("vendorProductSearch");
    const categoryFilter = document.getElementById("vendorCategoryFilter");
    const formTitle = document.getElementById("vendorFormTitle");
    const formIntro = document.getElementById("vendorFormIntro");

    const imagePreview = document.getElementById("vendorProductImagePreview");
    const galleryPreview = document.getElementById("vendorProductGalleryPreview");
    const imageInput = document.getElementById("vendorProductImageFile");
    const galleryInput = document.getElementById("vendorProductGalleryFiles");

    const fields = {
      id: document.getElementById("vendorProductId"),
      name: document.getElementById("vendorProductName"),
      category: document.getElementById("vendorProductCategory"),
      subcategory: document.getElementById("vendorProductSubcategory"),
      price: document.getElementById("vendorProductPrice"),
      description: document.getElementById("vendorProductDescription"),
      sizes: document.getElementById("vendorProductSizes"),
      colors: document.getElementById("vendorProductColors"),
      edits: document.getElementById("vendorProductEdits"),
      featured: document.getElementById("vendorProductFeatured"),
      isNew: document.getElementById("vendorProductNew")
    };

    if (!authSection || !dashboardSection || !signInForm || !signUpForm || !form || !list || !stats) return;

    let editId = "";
    let currentVendor = getCurrentVendor();

    const showStatus = (message, type = "info") => {
      if (!authStatus) return;
      authStatus.textContent = message;
      authStatus.dataset.state = type;
    };

    const getCurrentVendorProducts = () => {
      const vendorId = currentVendor && currentVendor.vendorId;
      return vendorProducts.filter((product) => product.ownerId === vendorId);
    };

    const updateStats = () => {
      const current = getCurrentVendorProducts();
      const featuredCount = current.filter((product) => product.featured).length;
      const newCount = current.filter((product) => product.isNew).length;

      stats.innerHTML = `
        <article class="vendor-stat">
          <strong>${current.length}</strong>
          <span>Vendor products</span>
        </article>
        <article class="vendor-stat">
          <strong>${featuredCount}</strong>
          <span>Featured live</span>
        </article>
        <article class="vendor-stat">
          <strong>${newCount}</strong>
          <span>New arrivals</span>
        </article>
      `;
    };

    const updateImagePreview = (source, altText = "Selected image") => {
      if (!imagePreview) return;
      imagePreview.innerHTML = source
        ? `<img src="${source}" alt="${altText}">`
        : `<div class="vendor-upload-placeholder">Image preview will appear here.</div>`;
    };

    const updateGalleryPreview = (sources = []) => {
      if (!galleryPreview) return;
      if (!sources.length) {
        galleryPreview.innerHTML = `<div class="vendor-upload-placeholder">Gallery preview will appear here.</div>`;
        return;
      }

      galleryPreview.innerHTML = sources.map((source) => `<img src="${source}" alt="Gallery preview">`).join("");
    };

    const resetPreview = () => {
      updateImagePreview("");
      updateGalleryPreview([]);
    };

    const updateAuthView = () => {
      const signedIn = Boolean(currentVendor);
      authSection.hidden = signedIn;
      dashboardSection.hidden = !signedIn;

      if (signedIn) {
        if (vendorNameLabel) vendorNameLabel.textContent = currentVendor.vendorName || HOUSE_VENDOR_NAME;
        if (dashboardTitle) dashboardTitle.textContent = `Welcome back, ${currentVendor.vendorName || HOUSE_VENDOR_NAME}`;
        if (dashboardIntro) {
          dashboardIntro.textContent = "Add products, edit details, and keep your catalog live from one private dashboard.";
        }
        if (authSummary) authSummary.textContent = `Signed in as ${currentVendor.vendorName || HOUSE_VENDOR_NAME}`;
        updateStats();
        renderList();
        resetForm();
      } else {
        if (authSummary) authSummary.textContent = "Create an account or sign in to open the private vendor dashboard.";
        if (vendorNameLabel) vendorNameLabel.textContent = "";
      }
    };

    const resetForm = () => {
      editId = "";
      if (fields.id) fields.id.value = "";
      form.reset();
      if (fields.featured) fields.featured.checked = false;
      if (fields.isNew) fields.isNew.checked = false;
      if (formTitle) formTitle.textContent = "Create a product";
      if (formIntro) {
        formIntro.textContent = "Upload real images, describe the product, and publish to your public catalog.";
      }
      if (status) status.textContent = "Ready to create a new product.";
      resetPreview();
    };

    const fillForm = (product) => {
      if (!product) return;

      editId = product.id;
      if (fields.id) fields.id.value = product.id;
      if (fields.name) fields.name.value = product.name || "";
      if (fields.category) fields.category.value = product.category || "Women";
      if (fields.subcategory) fields.subcategory.value = product.subcategory || "";
      if (fields.price) fields.price.value = product.price ?? "";
      if (fields.description) fields.description.value = product.description || "";
      if (fields.sizes) fields.sizes.value = (product.sizes || []).join(", ");
      if (fields.colors) fields.colors.value = (product.colors || []).join(", ");
      if (fields.edits) fields.edits.value = (product.edits || []).join(", ");
      if (fields.featured) fields.featured.checked = Boolean(product.featured);
      if (fields.isNew) fields.isNew.checked = Boolean(product.isNew);

      updateImagePreview(product.image, product.name);
      updateGalleryPreview(product.gallery || [product.image]);

      if (formTitle) formTitle.textContent = `Edit ${product.name}`;
      if (formIntro) {
        formIntro.textContent = "Change details below and save to update the live catalog.";
      }
      if (status) status.textContent = `Editing ${product.name}.`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const renderList = () => {
      const term = normalize(searchInput ? searchInput.value : "");
      const category = normalize(categoryFilter ? categoryFilter.value : "");
      const current = getCurrentVendorProducts().filter((product) => {
        const matchesTerm = !term || [
          product.name,
          product.category,
          product.subcategory,
          product.description,
          ...(product.edits || [])
        ].some((value) => normalize(value).includes(term));
        const matchesCategory = !category || normalize(product.category) === category;
        return matchesTerm && matchesCategory;
      });

      if (!current.length) {
        list.innerHTML = `
          <div class="vendor-empty">
            <p class="eyebrow">No vendor products</p>
            <h3>Start by adding your first product.</h3>
            <p>Your items will appear here once they are saved.</p>
          </div>
        `;
        updateStats();
        return;
      }

      list.innerHTML = current.map(createVendorProductCard).join("");
      updateStats();
    };

    const persistAndRefresh = () => {
      saveStoredVendorProducts(vendorProducts);
      refreshCatalogProducts();
      updateStats();
      renderList();
      renderHomeFeaturedProducts();
    };

    const ensureVendorAuthenticated = () => {
      currentVendor = getCurrentVendor();
      if (!currentVendor) {
        clearVendorSession();
        updateAuthView();
        return false;
      }
      return true;
    };

    signUpForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = signUpFields.name ? signUpFields.name.value.trim() : "";
      const email = signUpFields.email ? signUpFields.email.value.trim().toLowerCase() : "";
      const password = signUpFields.password ? signUpFields.password.value : "";
      const confirmPassword = signUpFields.confirmPassword ? signUpFields.confirmPassword.value : "";

      if (!name || !email || !password || !confirmPassword) {
        showStatus("Complete the account details to continue.", "error");
        return;
      }

      if (password.length < 4) {
        showStatus("Use a password with at least 4 characters.", "error");
        return;
      }

      if (password !== confirmPassword) {
        showStatus("Passwords do not match.", "error");
        return;
      }

      if (getVendorByEmail(email)) {
        showStatus("An account already exists with that email.", "error");
        return;
      }

      const account = {
        vendorId: `vendor-${slugify(`${name}-${Date.now()}`)}`,
        vendorName: name,
        email,
        password
      };

      const accounts = getStoredVendorAccounts();
      accounts.unshift(account);
      saveStoredVendorAccounts(accounts);
      saveStoredVendorSession({ vendorId: account.vendorId });

      currentVendor = account;
      showStatus(`Account created for ${name}.`, "success");
      signUpForm.reset();
      if (signInForm) signInForm.reset();
      updateAuthView();
    });

    signInForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const email = signInFields.email ? signInFields.email.value.trim().toLowerCase() : "";
      const password = signInFields.password ? signInFields.password.value : "";

      const account = getVendorByEmail(email);
      if (!account || account.password !== password) {
        showStatus("Incorrect email or password.", "error");
        return;
      }

      saveStoredVendorSession({ vendorId: account.vendorId });
      currentVendor = account;
      showStatus(`Signed in as ${account.vendorName}.`, "success");
      signInForm.reset();
      updateAuthView();
    });

    if (signOutBtn) {
      signOutBtn.addEventListener("click", () => {
        clearVendorSession();
        currentVendor = null;
        if (status) status.textContent = "Signed out successfully.";
        updateAuthView();
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!ensureVendorAuthenticated()) return;

      const name = fields.name ? fields.name.value.trim() : "";
      const category = fields.category ? fields.category.value.trim() : "";
      const subcategory = fields.subcategory ? fields.subcategory.value.trim() : "";
      const price = Number(fields.price ? fields.price.value : 0);
      const description = fields.description ? fields.description.value.trim() : "";

      if (!name || !category || !subcategory || !price || !description) {
        if (status) status.textContent = "Please complete the required fields before saving.";
        return;
      }

      const existing = vendorProducts.find((product) => product.id === editId && product.ownerId === currentVendor.vendorId);
      const id = existing ? existing.id : (fields.id && fields.id.value.trim()) || `vendor-${slugify(name)}-${Date.now()}`;

      let imageData = existing ? existing.image : "";
      let galleryData = existing ? (Array.isArray(existing.gallery) ? existing.gallery : [existing.image].filter(Boolean)) : [];

      try {
        const imageFile = imageInput && imageInput.files ? imageInput.files[0] : null;
        const galleryFiles = galleryInput && galleryInput.files ? galleryInput.files : null;
        const uploadedImage = imageFile ? await readFileAsDataUrl(imageFile) : "";
        const uploadedGallery = galleryFiles && galleryFiles.length ? await readFilesAsDataUrls(galleryFiles) : [];

        if (uploadedImage) imageData = uploadedImage;
        if (uploadedGallery.length) galleryData = uploadedGallery;
        if (!galleryData.length && imageData) galleryData = [imageData];
      } catch (error) {
        if (status) status.textContent = "Could not read the uploaded image. Please try again.";
        return;
      }

      if (!imageData) {
        if (status) status.textContent = "Upload a main product image before saving.";
        return;
      }

      const sizes = fields.sizes ? parseCommaList(fields.sizes.value) : [];
      const colors = fields.colors ? parseCommaList(fields.colors.value) : [];
      const edits = fields.edits ? parseCommaList(fields.edits.value) : [];

      const product = {
        id,
        ownerId: currentVendor.vendorId,
        vendorId: currentVendor.vendorId,
        vendorName: currentVendor.vendorName,
        name,
        gender: category,
        category,
        subcategory,
        price,
        featured: Boolean(fields.featured && fields.featured.checked),
        isNew: Boolean(fields.isNew && fields.isNew.checked),
        image: imageData,
        gallery: galleryData,
        description,
        sizes,
        colors,
        edits,
        source: "vendor"
      };

      if (existing) {
        vendorProducts = vendorProducts.map((item) => (item.id === existing.id ? product : item));
      } else {
        vendorProducts = [product, ...vendorProducts];
      }

      editId = product.id;
      persistAndRefresh();

      if (status) status.textContent = `${product.name} saved successfully.`;
      if (formTitle) formTitle.textContent = `Edit ${product.name}`;
      if (formIntro) {
        formIntro.textContent = "Change details below and save to update the live catalog.";
      }
      if (fields.id) fields.id.value = product.id;
    });

    list.addEventListener("click", (event) => {
      const editBtn = event.target.closest("[data-vendor-edit]");
      const deleteBtn = event.target.closest("[data-vendor-delete]");

      if (editBtn) {
        const product = vendorProducts.find((item) => item.id === editBtn.dataset.vendorEdit && item.ownerId === currentVendor.vendorId);
        if (product) fillForm(product);
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.vendorDelete;
        const product = vendorProducts.find((item) => item.id === id && item.ownerId === currentVendor.vendorId);
        if (!product) return;

        const confirmed = window.confirm(`Delete ${product.name}?`);
        if (!confirmed) return;

        vendorProducts = vendorProducts.filter((item) => !(item.id === id && item.ownerId === currentVendor.vendorId));
        if (editId === id) resetForm();
        persistAndRefresh();
        if (status) status.textContent = `${product.name} deleted.`;
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", resetForm);
    }

    if (searchInput) {
      searchInput.addEventListener("input", renderList);
    }

    if (categoryFilter) {
      categoryFilter.addEventListener("change", renderList);
    }

    updateAuthView();
    if (currentVendor) {
      renderList();
      resetForm();
    }
  }

  function renderVendorProductsPage() {
    if (!document.body.matches('[data-page="vendor-products"]')) return;

    refreshCatalogProducts();

    const vendorId = getQueryParam("vendorId") || HOUSE_VENDOR_ID;
    const vendor = getVendorById(vendorId);
    const vendorName = vendor ? vendor.vendorName : (vendorId === HOUSE_VENDOR_ID ? HOUSE_VENDOR_NAME : "Vendor");
    const vendorProductsForPage = allProducts.filter((product) => product.vendorId === vendorId || (!product.vendorId && vendorId === HOUSE_VENDOR_ID));

    const title = document.getElementById("vendorProductsTitle");
    const subtitle = document.getElementById("vendorProductsSubtitle");
    const count = document.getElementById("vendorProductsCount");
    const grid = document.getElementById("vendorPublicProductsGrid");
    const empty = document.getElementById("vendorPublicEmptyState");

    document.title = `${vendorName} | Vendor Products | Maison Élitaire`;

    if (title) title.textContent = vendorName;
    if (subtitle) {
      subtitle.textContent = vendor ? "Browse the products published by this vendor." : "Browse the products from this shop profile.";
    }
    if (count) count.textContent = `${vendorProductsForPage.length} ${vendorProductsForPage.length === 1 ? "product" : "products"}`;

    if (!grid || !empty) return;

    if (!vendorProductsForPage.length) {
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    grid.innerHTML = vendorProductsForPage.map(createVendorPublicCard).join("");
  }

  function renderHomePageExtras() {
    renderHomeFeaturedProducts();
  }

  function initialize() {
    bindMobileMenu();
    bindGlobalQuickViewTriggers();
    refreshCatalogProducts();
    bindAccordions();
    bindFiltersDrawer();
    bindGlobalUiEvents();

    renderCart();
    updateCartCount();
    updateCartSubtotal();

    renderHomePageExtras();
    renderProductsPage();
    renderProductPage();
    renderVendorPage();
    renderVendorProductsPage();
  }

  initialize();
});
