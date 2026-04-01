# Can I Hack You? Platform

Plataforma interactiva para visualizar en tiempo real eventos de ejecucion de codigo en un entorno local, con foco educativo sobre seguridad en cadena de suministro.

## Repositorios del proyecto

- Proyecto demo (ataques simulados): https://github.com/emigimenezj/can-i-hack-you-demo
- Plataforma (este repositorio): https://github.com/emigimenezj/can-i-hack-you-platform

## Que hace esta plataforma

Esta aplicacion permite que una persona:

1. Genere y vea su Session ID en la interfaz.
2. Vincule un clon local del repositorio demo a su Session ID.
3. Ejecute pruebas locales en el proyecto demo.
4. Vea en tiempo real, desde la pagina de sesion, que vector se activo y cuando.

La interfaz tambien incluye una seccion especifica de ataques donde se explica cada vector y su mitigacion.

## Flujo general

1. El usuario entra a la plataforma web y se genera un Session ID (persistido en Zustand).
2. La plataforma muestra un comando de vinculacion que ya incluye ese Session ID.
3. El usuario clona el repo demo y ejecuta el comando de vinculacion.
4. El repo demo simula ataques y envia eventos al backend de esta plataforma.
5. La pagina de sesion consume SSE y muestra la linea de tiempo en vivo.

## Comando de vinculacion (inofensivo)

El comando de vinculacion es inofensivo y solo hace dos cosas:

1. Clona el repo demo en una carpeta local.
2. Guarda una clave de configuracion local de Git para asociar el repo a la sesion.

Ejemplo:

```bash
git clone https://github.com/emigimenezj/can-i-hack-you-demo.git can-i-hack-you-test && git -C can-i-hack-you-test config --local can-i-hack-you.session <SESSION_ID>
```

No instala dependencias por si mismo, no ejecuta scripts de npm y no dispara ataques por si solo.

## Tipos de ataques simulados

Actualmente se explican y visualizan 3 vectores:

1. npm lifecycle scripts: preinstall, postinstall y prepare.
2. Plugin de ESLint con ejecucion automatica al analizar codigo.
3. Tarea automatica de VSCode definida en .vscode.

## Estructura del monorepo

- apps/web: frontend Astro (interfaz de usuario)
- apps/api: backend Express (SSE, health y colecta de eventos)

## Requisitos

- Node.js >= 22.12.0
- pnpm >= 10

## Comandos principales

Desde la raiz del repositorio:

```bash
pnpm install
pnpm dev
```

Build de todo el monorepo:

```bash
pnpm build
```

Inicio en modo produccion (scripts start):

```bash
pnpm start
```

## Variables de entorno importantes

Frontend (apps/web):

- PUBLIC_API_URL: URL base del backend. Si no existe, se usa localhost.

Backend (apps/api):

- PORT: puerto HTTP del servicio (fallback 3001).
- HOST: host de escucha (fallback 0.0.0.0).
- RATE_LIMIT_HEALTH_MAX: maximo por minuto para /health.
- RATE_LIMIT_EVENTS_MAX: maximo por minuto para /events/:sessionID.
- RATE_LIMIT_COLLECT_MAX: maximo por minuto para /collect.

## Nota de seguridad

El objetivo del proyecto es educativo. No esta pensado para uso malicioso. La idea es entender como se comportan ciertos vectores de ejecucion en flujos de desarrollo reales y como mitigarlos.
