# moodwatch

> Una recomendación según tu mood. Gratis, sin registro. Personaliza opcionalmente con tu watchlist de Letterboxd.

Eliges un mood en cinco toques rápidos. Te recomiendo una película. Te muestro dónde verla en tu país. Eso es todo.

Si tienes cuenta de Letterboxd, pegas tu usuario y las recomendaciones salen de tu watchlist en vez del catálogo general.

## Cómo funciona

- El browser envía tus respuestas de mood + tu país (detectado automáticamente)
- Un backend pequeño consulta [TMDb](https://www.themoviedb.org) por candidatos y proveedores de streaming
- Una función de scoring rankea los resultados
- El botón "Dónde verla" te lleva a JustWatch del país detectado
- Si lo activas, tu watchlist pública de Letterboxd se lee una vez para filtrar

Sin tracking, sin cuentas, sin guardar datos.

## Stack

- HTML / CSS / JS vanilla, sin framework
- i18n: auto EN / ES desde `navigator.language`
- Backend: Cloudflare Worker
- Datos: TMDb v3 API + HTML público de Letterboxd

## Desarrollo local

```bash
git clone https://github.com/brm-src/moodwatch
cd moodwatch
python3 -m http.server -d public 8080
```

Abre `http://localhost:8080`. La UI funciona sin backend; las recomendaciones necesitan el Worker.

## Licencia

MIT
