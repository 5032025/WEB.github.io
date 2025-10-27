







































// ====================================================================
// 1. DATA SIMULADA (REPOSITORIO LOCAL) - SOLO LOS 15 PRODUCTOS SOLICITADOS
// ====================================================================

// Mapeo CRÍTICO: Se mantienen SOLO los 15 productos solicitados.
// Se elimina la descripción y las opciones.
const PRODUCT_DATA = new Map([
    // ID, { id, nombre, precio, stock }
    ["P001", { id: "P001", nombre: "Aceite 1lt", precio: 3.10, stock: 40 }],
    ["P002", { id: "P002", nombre: "Agua (Galón)", precio: 1.50, stock: 80 }],
    ["P003", { id: "P003", nombre: "Sal Rosada 500g", precio: 2.20, stock: 55 }],
    ["P004", { id: "P004", nombre: "Arroz Blanco 2lb", precio: 1.90, stock: 75 }],
    ["P005", { id: "P005", nombre: "Arroz Precocido 2lb", precio: 2.10, stock: 60 }],
    ["P006", { id: "P006", nombre: "Azúcar Blanca 1kg", precio: 1.25, stock: 100 }],
    ["P007", { id: "P007", nombre: "Azúcar Morena 1kg", precio: 1.50, stock: 80 }],
    ["P008", { id: "P008", nombre: "Café Soluble 100g", precio: 3.50, stock: 50 }],
    ["P009", { id: "P009", nombre: "Elotes (Unidad)", precio: 0.75, stock: 150 }],
    ["P010", { id: "P010", nombre: "Frijoles Rojos 1lb", precio: 1.75, stock: 80 }],
    ["P011", { id: "P011", nombre: "Harina de Trigo 1kg", precio: 2.90, stock: 50 }],
    ["P012", { id: "P012", nombre: "Huevos (Docena)", precio: 2.75, stock: 30 }],
    ["P013", { id: "P013", nombre: "Leche Entera 1lt", precio: 1.45, stock: 60 }],
    ["P014", { id: "P014", nombre: "Pollo (lb)", precio: 4.00, stock: 45 }],
    ["P015", { id: "P015", nombre: "Carne de Res (lb)", precio: 5.50, stock: 35 }],
]);

// Mapeo de productos a los nombres de imagen exactos proporcionados.
const IMAGE_MAP = {
    "P001": "Aceite.jpg",
    "P002": "Agua.jpg",
    "P003": "Salrosa.jpg",
    "P004": "Arrozblanco.jpg",
    "P005": "Arrozprecocido.jpg",
    "P006": "Azucarblanca.jpg",
    "P007": "Azucarmorena.jpg",
    "P008": "Cafesoluble.jpg",
    "P009": "Elotes.jpg",
    "P010": "Frijoles.jpg",
    "P011": "Harinadetrigo.jpg",
    "P012": "Huevos.jpg",
    "P013": "Litroleche.jpg",
    "P014": "Pollo.jpg",
    "P015": "Res.jpg"
};

// ====================================================================
// 2. CLASES DE LÓGICA DE NEGOCIO (Lógica de Carrito)
// ====================================================================

/** Representa el ítem de carrito (relación Producto-cantidad) */
class CartItem {
    constructor(product, cantidad) {
        this.product = product;
        this.cantidad = cantidad;
    }

    getSubtotal() {
        // Usa Math.round para evitar problemas de precisión flotante
        return (Math.round((this.product.precio * 100) * this.cantidad) / 100).toFixed(2);
    }
}

/** Representa el Carrito de Compras */
class ShoppingCart {
    constructor() {
        this.items = [];
    }

    getItem(productId) {
        // Usa el ID del producto (no el uniqueId de las opciones)
        return this.items.find(item => item.product.id === productId);
    }

    addItem(productId, quantity = 1) {
        const product = PRODUCT_DATA.get(productId);

        if (!product) {
            console.error("Producto no encontrado:", productId);
            return;
        }

        const existingItem = this.getItem(productId);
        const currentInCart = existingItem ? existingItem.cantidad : 0;
        const newQuantity = currentInCart + quantity;

        // Control de Disponibilidad (Stock)
        if (newQuantity > product.stock) {
            alert(`Solo quedan ${product.stock} unidades de ${product.nombre}. No se puede agregar la cantidad solicitada.`);
            return;
        }

        if (existingItem) {
            existingItem.cantidad = newQuantity;
        } else {
            // Clonar el objeto del producto para evitar mutaciones directas en el mapa por referencias (aunque aquí solo cambiamos la cantidad)
            const productCopy = {...product};
            this.items.push(new CartItem(productCopy, quantity));
        }

        uiController.updateCartIcon();
    }

    removeItem(productId) {
        const existingItem = this.getItem(productId);
        if (!existingItem) return;

        existingItem.cantidad -= 1;

        if (existingItem.cantidad <= 0) {
            this.items = this.items.filter(item => item.product.id !== productId);
        }
        uiController.updateCartIcon();
    }

    removeItemCompletely(productId) {
        this.items = this.items.filter(item => item.product.id !== productId);
        uiController.updateCartIcon();
    }

    /**
     * @description Deducir el stock de los productos comprados.
     */
    commitPurchase() {
        // Recorrer el carrito y actualizar el stock en PRODUCT_DATA
        this.items.forEach(cartItem => {
            const product = PRODUCT_DATA.get(cartItem.product.id);
            if (product) {
                // Actualizar el stock del producto en la fuente de datos
                product.stock -= cartItem.cantidad;
                // No es necesario actualizar cartItem.product.stock, ya que el carrito se limpiará.
            }
        });

        this.clear(); // Limpiar el carrito después de la compra
    }

    getTotal() {
        let total = 0;
        this.items.forEach(item => {
            total += item.product.precio * item.cantidad;
        });
        return (Math.round(total * 100) / 100).toFixed(2);
    }

    clear() {
        this.items = [];
        uiController.updateCartIcon();
    }
}

const cart = new ShoppingCart();


// ====================================================================
// 3. UI CONTROLLER (Controlador de Interfaz y Renderizado)
// ====================================================================

const uiController = {
    updateCartIcon: function() {
        const cartCount = cart.items.reduce((acc, item) => acc + item.cantidad, 0);
        let countBadge = document.getElementById('cart-badge');

        if (cartCount > 0) {
            if (!countBadge) {
                const icon = document.getElementById('main-cart-icon');
                if (icon) {
                    countBadge = document.createElement('span');
                    countBadge.id = 'cart-badge';
                    // Estilo básico para el badge (si no está en CSS)
                    countBadge.style.cssText = 'position: absolute; top: -10px; right: -10px; background: red; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.75rem;';
                    icon.appendChild(countBadge);
                }
            }
            if(countBadge) countBadge.textContent = cartCount;
        } else {
            if (countBadge) countBadge.remove();
        }
    },

    showCartModal: function(show = true) {
        const modal = document.getElementById('cart-modal');
        if (!modal) return;

        if (show) {
            this.renderCartItems();
            modal.classList.add('open');
        } else {
            modal.classList.remove('open');
        }
    },

    showPaymentModal: function(show = true) {
        const modal = document.getElementById('payment-modal');
        if (!modal) return;

        if (show) {
            const total = cart.getTotal();
            document.getElementById('final-payment-total').textContent = '$' + total;

            // Actualizar el monto en el detalle de PayPal
            const paypalAmountDisplay = document.getElementById('paypal-amount-display');
            if(paypalAmountDisplay) paypalAmountDisplay.textContent = '$' + total;

            // Inicializar la vista de pago al abrir el modal
            handlePaymentMethodChange();
            modal.classList.add('open');
        } else {
            modal.classList.remove('open');
        }
    },

    /** Muestra/Oculta el modal de Login/Registro */
    showLoginModal: function(show = true) {
        const modal = document.getElementById('login-modal');
        if (!modal) return;

        if (show) {
            modal.classList.add('open');
        } else {
            modal.classList.remove('open');
        }
    },

    renderCartItems: function() {
        const list = document.getElementById('cart-list');
        const totalElement = document.getElementById('cart-total');
        const subtotalElement = document.getElementById('cart-subtotal');
        const checkoutBtn = document.getElementById('checkout-btn');
        const clearCartBtn = document.getElementById('clear-cart-btn');

        if (!list || !totalElement || !checkoutBtn || !clearCartBtn) return;

        list.innerHTML = '';

        if (cart.items.length === 0) {
            list.innerHTML = '<p class="empty-cart-message" style="text-align:center; color:#777; margin-top: 15px;">El carrito está vacío. ¡Añade productos!</p>';
            totalElement.textContent = '$0.00';
            if (subtotalElement) subtotalElement.textContent = '$0.00';
            checkoutBtn.disabled = true;
            clearCartBtn.disabled = true;
            return;
        }

        cart.items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'cart-item';
            li.dataset.productId = item.product.id; // Se usa productId

            // Revisa el stock disponible para determinar si se debe deshabilitar el botón +
            const productInStock = PRODUCT_DATA.get(item.product.id);
            const plusDisabled = productInStock && item.cantidad >= productInStock.stock ? 'disabled' : '';

            li.innerHTML = `
                <span class="item-name">${item.product.nombre}</span>
                <span class="item-qty-controls">
                    <button class="btn-qty-minus">-</button>
                    <span class="item-qty">${item.cantidad}</span>
                    <button class="btn-qty-plus" ${plusDisabled}>+</button>
                </span>
                <span class="item-price">$${item.getSubtotal()}</span>
                <button class="btn-remove-item" title="Eliminar completamente">x</button>
            `;
            list.appendChild(li);
        });

        const totalValue = '$' + cart.getTotal();
        totalElement.textContent = totalValue;
        if (subtotalElement) subtotalElement.textContent = totalValue;

        checkoutBtn.disabled = false;
        clearCartBtn.disabled = false;
    }
};


// ====================================================================
// 4. FUNCIONES AUXILIARES
// ====================================================================

function handlePaymentMethodChange() {
    const paymentMethod = document.getElementById('payment-method')?.value;
    const cardDetails = document.getElementById('card-details');
    const paypalDetails = document.getElementById('paypal-details');

    // Referencias a los campos de tarjeta
    const cardNumberEl = document.getElementById('card-number');
    const cardExpiryEl = document.getElementById('card-expiry');
    const cardCvvEl = document.getElementById('card-cvv');

    // Ocultar todos los campos específicos primero
    if (cardDetails) cardDetails.style.display = 'none';
    if (paypalDetails) paypalDetails.style.display = 'none';

    // Deshabilitar la obligatoriedad de los campos de tarjeta por defecto
    if (cardNumberEl) cardNumberEl.required = false;
    if (cardExpiryEl) cardExpiryEl.required = false;
    if (cardCvvEl) cardCvvEl.required = false;

    // Mostrar los detalles específicos según el método de pago
    if (paymentMethod === 'card') {
        if (cardDetails) cardDetails.style.display = 'block';

        // Habilitar la obligatoriedad de los campos de tarjeta
        if (cardNumberEl) cardNumberEl.required = true;
        if (cardExpiryEl) cardExpiryEl.required = true;
        if (cardCvvEl) cardCvvEl.required = true;

    } else if (paymentMethod === 'paypal') {
        // Mostrar el mensaje de PayPal (no requiere campos de formulario)
        if (paypalDetails) paypalDetails.style.display = 'block';
    }
}

// **NUEVA FUNCIÓN:** Maneja la simulación de Iniciar Sesión
function handleLogin(email, password) {
    const loginBtn = document.getElementById('register-btn'); // El botón principal del formulario

    // 1. Validación básica para Login
    if (!email || !password) {
        alert("Por favor, ingrese su correo y contraseña para iniciar sesión.");
        return;
    }

    // 2. Simulación de carga
    if (loginBtn) {
        loginBtn.textContent = "Verificando...";
        loginBtn.disabled = true;
    }

    // 3. Simulación de delay y éxito
    setTimeout(() => {
        alert(`✅ ¡Inicio de sesión exitoso! Bienvenido/a de nuevo.`);

        // Simular cierre y limpieza
        document.getElementById('login-form')?.reset();
        uiController.showLoginModal(false);

        // 4. Actualizar el botón principal de la navegación
        const mainLoginBtn = document.getElementById('main-login-btn');
        if (mainLoginBtn) {
            mainLoginBtn.textContent = "Mi Cuenta (Simulado)";
            mainLoginBtn.classList.remove('btn-login');
            mainLoginBtn.style.cssText = 'background-color: transparent !important; color: var(--color-text-dark) !important; border: none; padding: 8px 15px;';
        }

        // 5. Restaurar el botón del modal y la vista a REGISTRO (estado por defecto)
        const form = document.getElementById('login-form');
        if (form) {
            const nameContainer = document.getElementById('reg-name')?.parentNode;
            const duiContainer = document.getElementById('reg-dui')?.parentNode;
            const loginTitle = form.querySelector('h2');
            const toggleLink = document.getElementById('show-login-form');

            // Restaurar a vista de Registro (por defecto)
            if (nameContainer) nameContainer.style.display = 'block';
            if (duiContainer) duiContainer.style.display = 'block';
            if (loginTitle) loginTitle.textContent = "Registro de Usuario";
            if (toggleLink) toggleLink.textContent = "Inicia Sesión aquí";

            // Restaurar 'required' para el registro
            if (document.getElementById('reg-name')) document.getElementById('reg-name').required = true;
            if (document.getElementById('reg-dui')) document.getElementById('reg-dui').required = true;
        }

        if (loginBtn) {
            loginBtn.textContent = "Registrarse";
            loginBtn.disabled = false;
        }

    }, 1500);
}


// ====================================================================
// 5. LÓGICA DE RENDERIZADO DEL CATÁLOGO
// ====================================================================

function renderProducts() {
    const productListContainer = document.querySelector('.product-list');
    if (!productListContainer) return;

    productListContainer.innerHTML = '';

    PRODUCT_DATA.forEach(product => {
        // CORRECCIÓN: Usamos IMAGE_MAP con el ID del producto
        const imageFileName = IMAGE_MAP[product.id];

        if (!imageFileName) {
            console.warn(`No se encontró mapeo de imagen para el producto: ${product.id}`);
            return;
        }

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.productId = product.id;

        // Determinar estado de stock
        const buttonDisabled = product.stock <= 0 ? 'disabled' : '';
        const stockMessageColor = product.stock > 0 ? 'var(--color-accent-green)' : 'red';
        const stockMessageText = product.stock > 0 ? `Disponibles: ${product.stock} unid.` : 'Agotado';

        const imagePath = imageFileName;

        const html = `
            <img src="${imagePath}" alt="${product.nombre}" class="product-image" onerror="this.src='placeholder.jpg'">
            <div class="product-info">
                <h3>${product.nombre}</h3>
                <p class="product-stock" style="color: ${stockMessageColor};">${stockMessageText}</p>
                <div class="product-meta">
                    <span class="product-price">$${product.precio.toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-add-cart" ${buttonDisabled}><i class="fas fa-cart-plus"></i> Agregar</button>
            </div>
        `;
        productCard.innerHTML = html;
        productListContainer.appendChild(productCard);
    });
}


// ====================================================================
// 6. EVENT LISTENERS (Inicialización y Manejo de Eventos)
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    uiController.updateCartIcon();

    // --- MANEJO DEL MODAL DE LOGIN/REGISTRO ---

    // Evento: Abrir el modal de Login/Registro
    document.getElementById('main-login-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        uiController.showLoginModal(true);
    });

    // Evento: Cerrar los modales al hacer clic en el 'x'
    document.querySelector('#login-modal .close-modal')?.addEventListener('click', () => uiController.showLoginModal(false));
    document.querySelector('#cart-modal .close-modal')?.addEventListener('click', () => uiController.showCartModal(false));
    document.querySelector('#payment-modal .close-modal')?.addEventListener('click', () => uiController.showPaymentModal(false));


    // Evento: Simular Registro / Login (Envío del formulario)
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();

        // ** Obtención de datos del formulario **
        const nameInput = document.getElementById('reg-name');
        const duiInput = document.getElementById('reg-dui');
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        // *** Lógica de Selección: Login vs. Registro ***
        const isLoginView = document.getElementById('register-btn').textContent === "Iniciar Sesión";

        if (isLoginView) {
            handleLogin(email, password);
            return;
        }

        // Si estamos en vista de Registro:
        const name = nameInput.value;
        const dui = duiInput.value;

        // ** Validación simple de DUI (Formato XXXXXXXX-X) **
        if (!/^\d{8}-\d{1}$/.test(dui)) {
            alert("Por favor, ingrese un número de DUI válido (XXXXXXXX-X).");
            return;
        }

        document.getElementById('register-btn').textContent = "Registrando...";
        document.getElementById('register-btn').disabled = true;


        setTimeout(() => {
            alert(`✅ ¡Registro exitoso, ${name}! Bienvenido/a a Sivar Market. \nCorreo: ${email}\nDUI: ${dui}`);

            // Simular cierre y reinicio (limpia los campos)
            document.getElementById('login-form').reset();
            uiController.showLoginModal(false);

            document.getElementById('register-btn').textContent = "Registrarse";
            document.getElementById('register-btn').disabled = false;
        }, 1500);
    });

    // **NUEVO EVENTO:** Alternar la vista del formulario (Registro <-> Iniciar Sesión)
    document.getElementById('show-login-form')?.addEventListener('click', (e) => {
        e.preventDefault();
        const form = document.getElementById('login-form');
        const loginTitle = form.querySelector('h2');
        const registerBtn = document.getElementById('register-btn');
        const toggleLink = document.getElementById('show-login-form');

        const nameContainer = document.getElementById('reg-name')?.parentNode;
        const duiContainer = document.getElementById('reg-dui')?.parentNode;

        // La vista actual es la que se muestra en el botón, el texto del botón de acción.
        const isRegisteringView = registerBtn.textContent === "Registrarse";

        if (isRegisteringView) {
            // Cambiar a vista de LOGIN (Ocultar Nombre y DUI)
            if (nameContainer) nameContainer.style.display = 'none';
            if (duiContainer) duiContainer.style.display = 'none';

            if (loginTitle) loginTitle.textContent = "Iniciar Sesión";
            registerBtn.textContent = "Iniciar Sesión";
            toggleLink.textContent = "Registrarse aquí";

            // Quitar el 'required' de los campos ocultos
            if (document.getElementById('reg-name')) document.getElementById('reg-name').required = false;
            if (document.getElementById('reg-dui')) document.getElementById('reg-dui').required = false;

        } else {
            // Cambiar a vista de REGISTRO (Mostrar Nombre y DUI)
            if (nameContainer) nameContainer.style.display = 'block';
            if (duiContainer) duiContainer.style.display = 'block';

            if (loginTitle) loginTitle.textContent = "Registro de Usuario";
            registerBtn.textContent = "Registrarse";
            toggleLink.textContent = "Inicia Sesión aquí";

            // Restaurar el 'required' de los campos
            if (document.getElementById('reg-name')) document.getElementById('reg-name').required = true;
            if (document.getElementById('reg-dui')) document.getElementById('reg-dui').required = true;
        }
    });

    // --- MANEJO DEL CATÁLOGO DE PRODUCTOS Y CARRITO ---

    // Evento: Clic en el botón "Agregar" de la tarjeta de producto
    document.querySelector('.product-list')?.addEventListener('click', (e) => {
        const target = e.target.closest('.btn-add-cart');
        if (!target) return;

        const productCard = target.closest('.product-card');
        if (!productCard) return;

        const productId = productCard.dataset.productId;

        if (productId) {
            cart.addItem(productId, 1);
            console.log(`¡${PRODUCT_DATA.get(productId)?.nombre || productId} agregado!`);
            // Renderiza el catálogo nuevamente para actualizar el stock visible
            renderProducts();
        }
    });

    // Evento: Abrir Modal de Carrito
    document.getElementById('main-cart-icon')?.addEventListener('click', (e) => {
        e.preventDefault();
        uiController.showCartModal(true);
    });

    // Evento: Manejo de Cantidad en el Modal de Carrito (usa productId)
    document.getElementById('cart-modal')?.addEventListener('click', (e) => {
        const target = e.target;
        const listItem = target.closest('.cart-item');
        if (!listItem) return;

        const productId = listItem.dataset.productId;

        if (target.classList.contains('btn-qty-plus')) {
            cart.addItem(productId, 1);
        } else if (target.classList.contains('btn-qty-minus')) {
            cart.removeItem(productId);
        } else if (target.classList.contains('btn-remove-item')) {
            cart.removeItemCompletely(productId);
        }

        uiController.renderCartItems();
    });

    // Evento: Vaciar Carrito
    document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
        if (cart.items.length === 0) return;

        if (confirm("¿Estás seguro de que deseas eliminar todos los productos del carrito?")) {
            cart.clear();
            uiController.renderCartItems();
            alert("El carrito ha sido vaciado.");
            renderProducts(); // Actualizar el catálogo para reflejar el stock actual
        }
    });

    // --- MANEJO DEL MODAL DE PAGO ---

    // Evento: Iniciar el proceso de Checkout
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
        if (cart.items.length === 0) {
            alert("El carrito está vacío.");
            return;
        }
        uiController.showCartModal(false);
        uiController.showPaymentModal(true);
    });

    // Evento para manejar el cambio en el selector de método de pago
    document.getElementById('payment-method')?.addEventListener('change', handlePaymentMethodChange);

    // Evento: Confirmar Pago
    document.getElementById('payment-form')?.addEventListener('submit', (e) => {
        e.preventDefault();

        const paymentMethod = document.getElementById('payment-method').value;

        // Si el método es 'card', se asume que la validación HTML ya se ejecutó,
        // pero la validación JS de formato es más robusta.
        if (paymentMethod === 'card') {
            const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
            const cardExpiry = document.getElementById('card-expiry').value;
            const cardCvv = document.getElementById('card-cvv').value;

            // Validación de formato para tarjeta de crédito
            if (!/^\d{12,16}$/.test(cardNumber)) {
                alert("Por favor, ingrese un número de tarjeta válido (12-16 dígitos).");
                return;
            }
            if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
                alert("Por favor, ingrese una fecha de expiración válida (MM/AA).");
                return;
            }
            if (!/^\d{3,4}$/.test(cardCvv)) {
                alert("Por favor, ingrese un CVV válido (3 o 4 dígitos).");
                return;
            }
        }

        // Simulación de procesamiento de pago
        const total = cart.getTotal();
        const confirmBtn = document.getElementById('confirm-payment-btn');

        if (confirmBtn) {
            confirmBtn.textContent = "Procesando...";
            confirmBtn.disabled = true;
        }

        setTimeout(() => {
            // ** EJECUCIÓN CRÍTICA: Deducir el stock y limpiar el carrito **
            cart.commitPurchase();

            // ** SIMULACIÓN DE GENERACIÓN DE FACTURA **
            alert(`✅ ¡Checkout completado! Pago con ${paymentMethod} procesado. Se ha generado una factura por $${total}.`);

            uiController.showPaymentModal(false);
            uiController.renderCartItems();
            renderProducts(); // Vuelve a renderizar para actualizar stock en el catálogo

            if (confirmBtn) {
                confirmBtn.textContent = "Confirmar Pago";
                confirmBtn.disabled = false;
            }
        }, 1500);
    });
});


// ====================================================================
// 7. FUNCIONALIDAD PARA MOSTRAR/OCULTAR CONTRASEÑA
// ====================================================================

const passwordInput = document.getElementById('reg-password');
const toggleButton = document.getElementById('togglePassword');
const eyeIcon = document.getElementById('eyeIcon');

if (toggleButton && passwordInput && eyeIcon) {
    toggleButton.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        if (type === 'text') {
            // Ojo cerrado (contraseña visible)
            eyeIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
            `;
        } else {
            // Ojo abierto (contraseña oculta)
            eyeIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            `;
        }
    });
}