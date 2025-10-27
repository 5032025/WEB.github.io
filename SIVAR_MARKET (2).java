//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Sistema de Ventas para Tienda - Consola
 * Requisitos cubiertos:
 *  - Productos, Carrito de compras, Generación de factura.
 * Evaluación:
 *  - Uso de colecciones (List, Map).
 *  - Facturas impresas y guardadas a archivo TXT.
 *  - Relación entre entidades (producto-venta con datos de cliente al vuelo).
 *
 * Ejecutar:
 *   javac SIVAR_MARKET.java
 *   java SIVAR_MARKET
 */
public class SIVAR_MARKET {

    public static void main(String[] args) {
        StoreRepository repo = new StoreRepository();
        repo.cargarDatosDemo();

        ShoppingCart cart = new ShoppingCart();
        Scanner sc = new Scanner(System.in);

        System.out.println("=== SISTEMA DE VENTAS - TIENDA ===");

        boolean seguir = true;
        while (seguir) {
            System.out.println("\nMENÚ");
            System.out.println("1) Listar productos");
            System.out.println("2) Agregar producto al carrito");
            System.out.println("3) Ver carrito");
            System.out.println("4) Remover del carrito");
            System.out.println("5) Checkout (generar factura)");
            System.out.println("6) Vaciar carrito");
            System.out.println("0) Salir");
            System.out.print("Opción: ");

            String op = sc.nextLine().trim();
            switch (op) {
                case "1" -> listarProductos(repo);
                case "2" -> agregarProducto(repo, cart, sc);
                case "3" -> verCarrito(cart);
                case "4" -> removerProducto(cart, sc);
                case "5" -> checkout(cart, sc);
                case "6" -> { cart.clear(); System.out.println("Carrito vaciado."); }
                case "0" -> { seguir = false; System.out.println("¡Hasta luego!"); }
                default -> System.out.println("Opción inválida.");
            }
        }
        sc.close();
    }

    // --------- UI Helpers ---------
    private static void listarProductos(StoreRepository repo) {
        System.out.println("\nPRODUCTOS DISPONIBLES:");
        System.out.printf("%-6s %-24s %12s%n", "ID", "Nombre", "Precio(USD)");
        for (Product p : repo.getProductos().values()) {
            System.out.printf("%-6s %-24s %12s%n", p.id(), p.nombre(), p.precio());
        }
    }

    private static void agregarProducto(StoreRepository repo, ShoppingCart cart, Scanner sc) {
        System.out.print("Ingrese ID de producto: ");
        String id = sc.nextLine().trim();
        Product p = repo.getProductos().get(id);
        if (p == null) {
            System.out.println("Producto no encontrado.");
            return;
        }
        System.out.print("Cantidad: ");
        String raw = sc.nextLine().trim();
        if (!raw.matches("\\d+")) {
            System.out.println("Cantidad inválida.");
            return;
        }
        int qty = Integer.parseInt(raw);
        if (qty <= 0) {
            System.out.println("La cantidad debe ser positiva.");
            return;
        }
        cart.addItem(p, qty);
        System.out.println("Agregado: " + p.nombre() + " x" + qty);
    }

    private static void verCarrito(ShoppingCart cart) {
        System.out.println("\nCARRITO:");
        if (cart.getItems().isEmpty()) {
            System.out.println(" (vacío)");
            return;
        }
        System.out.printf("%-24s %8s %12s %12s%n", "Producto", "Cant", "Precio", "Subtotal");
        for (CartItem it : cart.getItems()) {
            System.out.printf("%-24s %8d %12s %12s%n",
                    it.product().nombre(),
                    it.cantidad(),
                    it.product().precio(),
                    it.subtotal());
        }
        System.out.println("-----------------------------------------------");
        System.out.printf("%-24s %8s %12s %12s%n", "", "", "TOTAL:", cart.total());
    }

    private static void removerProducto(ShoppingCart cart, Scanner sc) {
        if (cart.getItems().isEmpty()) {
            System.out.println("El carrito está vacío.");
            return;
        }
        System.out.print("ID del producto a remover: ");
        String id = sc.nextLine().trim();
        boolean removed = cart.removeItemById(id);
        System.out.println(removed ? "Producto removido." : "No se encontró ese producto en el carrito.");
    }

    private static void checkout(ShoppingCart cart, Scanner sc) {
        if (cart.getItems().isEmpty()) {
            System.out.println("El carrito está vacío.");
            return;
        }

        // Capturar datos del cliente SIEMPRE (ya no hay lista de clientes)
        Customer clienteFactura = capturarDatosCliente(sc);

        // Configurable: IVA 13% (común en SV)
        BigDecimal tasaIVA = new BigDecimal("0.13");

        Invoice factura = Invoice.desdeCarrito(clienteFactura, cart, tasaIVA);
        String texto = factura.toPlainText();

        System.out.println("\n===== FACTURA GENERADA =====");
        System.out.println(texto);

        try {
            Path ruta = factura.guardarComoTxt();
            System.out.println("Factura guardada en: " + ruta.toAbsolutePath());
        } catch (IOException e) {
            System.out.println("No se pudo guardar la factura: " + e.getMessage());
        }
        cart.clear();
    }

    /**
     * Pide/valida datos de facturación (DUI, nombre, correo, domicilio).
     */
    private static Customer capturarDatosCliente(Scanner sc) {
        System.out.println("\n--- DATOS DE FACTURACIÓN ---");
        String nombre = leerCampo(sc, "Nombre completo", "", true);
        String dui    = leerCampo(sc, "DUI (########-#)", "", true, "^(\\d{8}-\\d)$");
        String email  = leerCampo(sc, "Correo", "", true, "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
        String dom    = leerCampo(sc, "Domicilio", "", true);

        String idGenerado = "C-" + DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        return new Customer(idGenerado, nombre, email, dui, dom);
    }

    /**
     * Lee un campo con valor por defecto. Si es requerido, repite hasta obtener algo válido.
     */
    private static String leerCampo(Scanner sc, String label, String defecto, boolean requerido) {
        while (true) {
            System.out.print(label + (defecto != null && !defecto.isEmpty() ? " [" + defecto + "]" : "") + ": ");
            String v = sc.nextLine().trim();
            if (v.isEmpty()) v = (defecto == null ? "" : defecto);
            if (!requerido || !v.isEmpty()) return v;
            System.out.println("Este campo es obligatorio.");
        }
    }

    /**
     * Lee un campo con regex de validación.
     */
    private static String leerCampo(Scanner sc, String label, String defecto, boolean requerido, String regex) {
        while (true) {
            String v = leerCampo(sc, label, defecto, requerido);
            if (!requerido && v.isEmpty()) return v;
            if (regex == null || regex.isEmpty() || v.matches(regex)) return v;
            System.out.println("Formato inválido. Intenta de nuevo.");
        }
    }
}

/* ===================== ENTIDADES ===================== */

/** Producto (Entidad) */
class Product {
    private final String id;
    private final String nombre;
    private final BigDecimal precio;

    public Product(String id, String nombre, BigDecimal precio) {
        this.id = id;
        this.nombre = nombre;
        this.precio = precio;
    }
    public String id() { return id; }
    public String nombre() { return nombre; }
    public BigDecimal precio() { return precio; }
}

/** Cliente (Entidad temporal para facturación) */
class Customer {
    private final String id;
    private final String nombre;
    private final String email;
    private final String dui;
    private final String domicilio;

    public Customer(String id, String nombre, String email, String dui, String domicilio) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.dui = dui;
        this.domicilio = domicilio;
    }
    public String id() { return id; }
    public String nombre() { return nombre; }
    public String email() { return email; }
    public String dui() { return dui; }
    public String domicilio() { return domicilio; }
}

/** Ítem de carrito: relación Producto-cantidad (parte de la Venta) */
class CartItem {
    private final Product product;
    private int cantidad;

    public CartItem(Product product, int cantidad) {
        this.product = product;
        this.cantidad = cantidad;
    }
    public Product product() { return product; }
    public int cantidad() { return cantidad; }
    public void addCantidad(int delta) { this.cantidad += delta; }

    public BigDecimal subtotal() {
        return product.precio().multiply(BigDecimal.valueOf(cantidad));
    }
}

/** Carrito de compras (colección de CartItem) */
class ShoppingCart {
    private final List<CartItem> items = new ArrayList<>();

    public void addItem(Product p, int cant) {
        // Si ya existe el producto, acumular cantidad
        for (CartItem it : items) {
            if (it.product().id().equals(p.id())) {
                it.addCantidad(cant);
                return;
            }
        }
        items.add(new CartItem(p, cant));
    }

    public boolean removeItemById(String productId) {
        return items.removeIf(it -> it.product().id().equalsIgnoreCase(productId));
    }

    public List<CartItem> getItems() { return Collections.unmodifiableList(items); }

    public BigDecimal total() {
        BigDecimal t = BigDecimal.ZERO;
        for (CartItem it : items) {
            t = t.add(it.subtotal());
        }
        return t;
    }

    public void clear() { items.clear(); }
}

/** Factura / Venta (relación DatosCliente-Productos) */
class Invoice {
    private final String numero;
    private final Customer cliente;
    private final List<CartItem> items;
    private final LocalDateTime fecha;
    private final BigDecimal subtotal;
    private final BigDecimal iva;
    private final BigDecimal total;

    private Invoice(String numero, Customer cliente, List<CartItem> items,
                    LocalDateTime fecha, BigDecimal subtotal, BigDecimal iva, BigDecimal total) {
        this.numero = numero;
        this.cliente = cliente;
        this.items = items;
        this.fecha = fecha;
        this.subtotal = subtotal;
        this.iva = iva;
        this.total = total;
    }

    /** Fábrica: crear factura a partir del carrito */
    public static Invoice desdeCarrito(Customer c, ShoppingCart cart, BigDecimal tasaIVA) {
        String num = "FACT-" + DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").format(LocalDateTime.now());
        LocalDateTime ts = LocalDateTime.now();

        BigDecimal sub = cart.total();
        BigDecimal ivaCalc = sub.multiply(tasaIVA).setScale(2, RoundingMode.HALF_UP);
        BigDecimal tot = sub.add(ivaCalc).setScale(2, RoundingMode.HALF_UP);

        // Clonar los items actuales (inmutabilidad simple)
        List<CartItem> copia = new ArrayList<>();
        for (CartItem it : cart.getItems()) {
            copia.add(new CartItem(it.product(), it.cantidad()));
        }
        return new Invoice(num, c, copia, ts, sub.setScale(2, RoundingMode.HALF_UP), ivaCalc, tot);
    }

    /** Representación de factura en texto plano para imprimir/guardar */
    public String toPlainText() {
        StringBuilder sb = new StringBuilder();
        sb.append("TIENDA SIVAR MARKET\n");
        sb.append("Factura No: ").append(numero).append("\n");
        sb.append("Fecha: ").append(fecha.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))).append("\n");
        sb.append("Cliente: ").append(cliente.nombre()).append("  <").append(cliente.email()).append(">\n");
        sb.append("DUI: ").append(cliente.dui()).append("\n");
        sb.append("Domicilio: ").append(cliente.domicilio()).append("\n");
        sb.append("------------------------------------------------------------\n");
        sb.append(String.format("%-24s %8s %12s %12s%n", "Producto", "Cant", "Precio", "Subtotal"));
        for (CartItem it : items) {
            sb.append(String.format("%-24s %8d %12s %12s%n",
                    it.product().nombre(), it.cantidad(),
                    it.product().precio(), it.subtotal()));
        }
        sb.append("------------------------------------------------------------\n");
        sb.append(String.format("%-24s %8s %12s %12s%n", "", "", "SUBTOTAL:", subtotal));
        sb.append(String.format("%-24s %8s %12s %12s%n", "", "", "IVA:", iva));
        sb.append(String.format("%-24s %8s %12s %12s%n", "", "", "TOTAL:", total));
        return sb.toString();
    }

    /** Guarda la factura como archivo TXT en ./facturas/FACT-*.txt y devuelve la ruta */
    public Path guardarComoTxt() throws IOException {
        Path dir = Paths.get("facturas");
        if (!Files.exists(dir)) Files.createDirectories(dir);
        Path file = dir.resolve(numero + ".txt");
        Files.writeString(file, toPlainText(), StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return file;
    }
}

/** Repositorio simple en memoria: SOLO productos */
class StoreRepository {
    private final Map<String, Product> productos = new LinkedHashMap<>();

    public Map<String, Product> getProductos() { return productos; }

    /** Datos de ejemplo */
    public void cargarDatosDemo() {
        // Productos (25 en total)
        addProducto(new Product("P001", "Café 250g", new BigDecimal("3.50")));
        addProducto(new Product("P002", "Azúcar 1kg", new BigDecimal("1.25")));
        addProducto(new Product("P003", "Arroz 2lb", new BigDecimal("1.90")));
        addProducto(new Product("P004", "Aceite 1lt", new BigDecimal("3.10")));
        addProducto(new Product("P005", "Leche 1lt", new BigDecimal("1.45")));
        addProducto(new Product("P006", "Pan blanco 500g", new BigDecimal("1.10")));
        addProducto(new Product("P007", "Huevos docena", new BigDecimal("2.50")));
        addProducto(new Product("P008", "Harina de trigo 1kg", new BigDecimal("1.70")));
        addProducto(new Product("P009", "Sal 500g", new BigDecimal("0.60")));
        addProducto(new Product("P010", "Fideos espagueti 400g", new BigDecimal("1.20")));
        addProducto(new Product("P011", "Atún en agua 140g", new BigDecimal("1.35")));
        addProducto(new Product("P012", "Sardinas 155g", new BigDecimal("1.10")));
        addProducto(new Product("P013", "Galletas surtidas 300g", new BigDecimal("2.30")));
        addProducto(new Product("P014", "Jugo de naranja 1lt", new BigDecimal("2.00")));
        addProducto(new Product("P015", "Refresco cola 2lt", new BigDecimal("1.85")));
        addProducto(new Product("P016", "Agua embotellada 1lt", new BigDecimal("0.85")));
        addProducto(new Product("P017", "Mantequilla 250g", new BigDecimal("1.95")));
        addProducto(new Product("P018", "Queso fresco 1lb", new BigDecimal("3.20")));
        addProducto(new Product("P019", "Jamón 200g", new BigDecimal("2.75")));
        addProducto(new Product("P020", "Papel higiénico 4 rollos", new BigDecimal("2.60")));
        addProducto(new Product("P021", "Detergente 1kg", new BigDecimal("3.40")));
        addProducto(new Product("P022", "Jabón de baño 3 unidades", new BigDecimal("2.10")));
        addProducto(new Product("P023", "Shampoo 400ml", new BigDecimal("3.90")));
        addProducto(new Product("P024", "Pasta dental 90g", new BigDecimal("1.75")));
        addProducto(new Product("P025", "Desodorante 150ml", new BigDecimal("3.15")));
    }

    private void addProducto(Product p) { productos.put(p.id(), p); }
}
