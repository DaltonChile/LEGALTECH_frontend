# LegalTech Frontend - Home Page

Home page que muestra el catálogo de templates de contratos legales, consumiendo el API del backend.

## Características

- ✨ Diseño moderno con Tailwind CSS
- 🎨 Gradientes y animaciones fluidas
- 📱 Totalmente responsive
- 🔌 Conectado al backend API (GET /api/v1/templates)
- ⚡ Estados de carga y error manejados
- 🎯 Iconos dinámicos según tipo de contrato

## Estructura de Componentes

```
src/
├── components/
│   ├── Navbar.tsx              # Barra de navegación
│   ├── Hero.tsx                # Sección hero con gradientes
│   ├── ContractMockup.tsx      # Card mockup animado
│   ├── ContractCard.tsx        # Tarjeta de contrato
│   └── ContractCatalog.tsx     # Grid de contratos (consume API)
├── services/
│   └── api.ts                  # Servicios API con axios
├── App.tsx                     # Componente principal
└── index.css                   # Estilos Tailwind
```

## Instalación y Ejecución

### 1. Instalar dependencias

```bash
cd /home/yoga/LEGALTECH_frontend
npm install
```

### 2. Configurar variables de entorno

El archivo `.env` ya está creado con:
```
VITE_API_URL=http://localhost:3000/api/v1
```

### 3. Iniciar el backend

En otra terminal:
```bash
cd /home/yoga/LEGALTECH_backend
npm run dev
```

El backend debe estar corriendo en `http://localhost:3000`

### 4. Iniciar el frontend

```bash
npm run dev
```

El frontend se abrirá en `http://localhost:5173`

## Integración con el Backend

El frontend consume el endpoint:

```typescript
GET /api/v1/templates
```

Respuesta esperada:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Constitución de SpA",
      "slug": "constitucion-spa",
      "base_price": 15000,
      "description": "..."
    }
  ]
}
```

## Mapeo de Iconos

Los iconos se asignan automáticamente según el slug del template:

- `arrendamiento` → 🏠 Home
- `compraventa` → 🤝 Handshake
- `prestacion` → 💼 Briefcase
- `confidencialidad` → 🛡️ ShieldCheck
- `sociedad` → 👥 Users
- `trabajo` → 📄 FileText

## Próximos Pasos

- [ ] Implementar navegación a página de personalización
- [ ] Agregar React Router para múltiples páginas
- [ ] Implementar formulario de personalización de contratos
- [ ] Agregar autenticación para usuarios admin
- [ ] Implementar flow completo de checkout y pago

## Tecnologías

- React 19
- TypeScript
- Tailwind CSS 4
- Vite 7
- Axios
- Lucide React (iconos)
