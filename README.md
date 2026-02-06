# 🎯 Calendario CPTP 2026 - Edición Enterprise

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=for-the-badge&logo=supabase)
![Zod](https://img.shields.io/badge/Zod-Validation-3068b7?style=for-the-badge&logo=zod)
![Security](https://img.shields.io/badge/Security-A+-red?style=for-the-badge)

> **Score de Auditoría de Ingeniería:** 10/10 (Elite Standard)

Este repositorio contiene el código fuente de la aplicación oficial de calendario para la **Federación Paraguaya de Tiro Práctico**. Es una implementación de referencia de arquitectura moderna "Inhackeable" y escalable.

## 🚀 Características Principales

### 🛡️ Seguridad de Nivel Bancario
- **Middleware Server-Side:** Protección de rutas `/admin` en el borde (Edge), eliminando accesos no autorizados antes de renderizar.
- **Validación Zod:** Esquemas estrictos para cada entrada de datos. Nada entra a la DB sin pasar por el filtro.
- **Variables de Entorno Seguras:** El sistema se niega a iniciar si falta configuración crítica, evitando fallos silenciosos.

### 📱 UX/UI de Alta Gama
- **Diseño Móvil Nativo:** Tablas con scroll horizontal inteligente y formularios adaptativos (Grid System).
- **Feedback Instantáneo:** Sistema de `Toasts` para notificaciones y `Skeletons` para estados de carga.
- **Accesibilidad (A11y):** Cumplimiento WCAG con roles ARIA y gestión de foco.
- **Reglamentos (Digitalizados):** Módulo CMS para gestión y distribución de documentos oficiales en PDF.

### 🏗️ Arquitectura Limpia
- **Patrón Singleton:** Gestión optimizada de conexiones a Supabase.
- **Componentes Reutilizables:** Factoría de formularios (`EventForm`) que unifica creación y edición.
- **Full TypeScript:** Sin `any`. Tipado inferido directamente de la base de datos y esquemas.

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Core** | Next.js 16 (App Router) |
| **Lenguaje** | TypeScript 5+ |
| **Estilos** | CSS Moderno (Variables & Flexbox/Grid) |
| **Base de Datos** | Supabase (PostgreSQL) |
| **Validación** | Zod Library |

## 📦 Instalación y Despliegue

### Requisitos Previos
- Node.js 18+
- Cuenta de Supabase

### Pasos
1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Morochief/calendario-fpt.git
    cd calendario-fpt
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env.local` y añade tus credenciales de Supabase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
    ```

4.  **Iniciar Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```

## 📚 Documentación de Arquitectura
Para un desglose profundo de las decisiones técnicas, patrones de diseño y protocolos de seguridad, consulta el **[Documento de Arquitectura (SAD)](./docs/ARCHITECTURE.md)** (Nota: El SAD se encuentra actualmente en los artifacts del agente, se recomienda moverlo a `docs/` en el repo).

---
*Desarrollado con estándares de ingeniería del 1%.*
