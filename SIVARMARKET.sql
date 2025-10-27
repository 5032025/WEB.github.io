DROP DATABASE IF EXISTS SivarMarket;

-- 1. CREACIÓN DE LA BASE DE DATOS
CREATE DATABASE SivarMarket CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE SivarMarket;

-- 2. ESQUEMA DE TABLAS (Corregido para MySQL)

-- Usuarios/Clientes (con datos de facturación CRÍTICOS)
CREATE TABLE Usuarios (
    IdUsuario INT PRIMARY KEY AUTO_INCREMENT,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    -- CRÍTICO: DUI para validación y factura
    DUI VARCHAR(10) UNIQUE NOT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    Domicilio VARCHAR(255), -- CRÍTICO: Para la factura legal
    Telefono VARCHAR(20)
);

-- Categorías de productos
CREATE TABLE Categorias (
    IdCategoria INT PRIMARY KEY AUTO_INCREMENT,
    Nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Productos (La fuente de verdad del inventario)
CREATE TABLE Productos (
    IdProducto VARCHAR(10) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Precio DECIMAL(10,2) NOT NULL,
    Stock INT NOT NULL, -- CRÍTICO: Se deduce en el Checkout
    IdCategoria INT NOT NULL,
    FOREIGN KEY (IdCategoria) REFERENCES Categorias(IdCategoria)
);

-- Detalle del Carrito (Simula la sesión del cliente)
CREATE TABLE CarritoDetalle (
    IdDetalle INT PRIMARY KEY AUTO_INCREMENT,
    IdUsuario INT NOT NULL,
    IdProducto VARCHAR(10) NOT NULL,
    Cantidad INT NOT NULL,
    FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario),
    FOREIGN KEY (IdProducto) REFERENCES Productos(IdProducto),
    UNIQUE (IdUsuario, IdProducto)
);

-- Ventas (Encabezado de factura: el registro histórico)
CREATE TABLE Ventas (
    IdVenta INT PRIMARY KEY AUTO_INCREMENT,
    IdUsuario INT NOT NULL,
    DUI_Factura VARCHAR(10) NOT NULL, -- Dato del cliente en el momento de la venta
    Fecha DATETIME DEFAULT NOW(), -- Uso de NOW() en lugar de GETDATE()
    -- CRÍTICO: Totales finales para contabilidad, calculados por el backend (Java)
    Subtotal DECIMAL(10,2) NOT NULL,
    IVA DECIMAL(10,2) NOT NULL,
    TotalFinal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario)
);

-- Detalle de ventas (ítems vendidos)
CREATE TABLE DetalleVentas (
    IdDetalle INT PRIMARY KEY AUTO_INCREMENT,
    IdVenta INT NOT NULL,
    IdProducto VARCHAR(10) NOT NULL,
    Cantidad INT NOT NULL,
    -- Se guarda el precio para que la factura sea inmutable
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (IdVenta) REFERENCES Ventas(IdVenta),
    FOREIGN KEY (IdProducto) REFERENCES Productos(IdProducto)
);


-- 3. INSERCIÓN DE DATOS DE PRUEBA

-- A. Insertar Categorías
INSERT INTO Categorias (Nombre) VALUES
('Granos Básicos'),
('Lácteos'),
('Bebidas'),
('Carnes');

-- B. Insertar Usuarios
INSERT INTO Usuarios (Nombre, Apellido, DUI, Email, Domicilio, Telefono) VALUES
('Ana', 'Gómez', '04781234-5', 'ana@sivar.com', 'Colonia San Benito', '7777-7777'),
('Luis', 'Figueroa', '05987654-2', 'luis@sivar.com', 'Residencial Cumbres', '7888-8888');

-- C. Insertar Productos (Ahora en inserts individuales para evitar errores de sintaxis)
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P001', 'Aceite 1lt', 3.10, 40, 1);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P002', 'Agua (Galón)', 1.50, 80, 3);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P003', 'Sal Rosa 500g', 2.20, 55, 1);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P004', 'Arroz Blanco 2lb', 1.90, 75, 1);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P005', 'Arroz Precocido 2lb', 2.10, 60, 1);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P006', 'Azúcar Blanca 1kg', 1.25, 100, 1);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P007', 'Azúcar Morena 1kg', 1.50, 80, 1);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P008', 'Café Soluble 100g', 3.50, 50, 3);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P009', 'Elotes (Unidad)', 0.75, 150, 1);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P010', 'Frijoles Rojos 1lb', 1.75, 80, 1);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P011', 'Harina de Trigo 1kg', 2.90, 50, 1);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P012', 'Huevos (Docena)', 2.75, 30, 1);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P013', 'Leche Entera 1lt', 1.45, 60, 2);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P014', 'Pollo (lb)', 4.00, 45, 4);
INSERT INTO Productos (IdProducto, Nombre, Precio, Stock, IdCategoria) VALUES ('P015', 'Carne de Res (lb)', 5.50, 35, 4);

