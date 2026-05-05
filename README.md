# Autos disponibles

Este front consume autos desde Oracle APEX.

## Importante sobre GitHub Pages

GitHub Pages solo sirve archivos estaticos. No ejecuta `api/autos.js`, por eso `/api/autos` devuelve 404 en:

```txt
https://andrewmeierdev.github.io/alquiler-front/
```

Ademas, el navegador bloquea la llamada directa a Oracle APEX si el servicio no tiene CORS habilitado.

## Opcion recomendada: Vercel

1. Subi este repo a GitHub.
2. Importalo en Vercel.
3. Deploy.
4. Abrí la URL de Vercel.

En Vercel si funciona:

```txt
/api/autos -> api/autos.js -> Oracle APEX
```

## Usar GitHub Pages con un proxy publicado

Si queres seguir usando GitHub Pages, publica el proxy en Vercel/Netlify y pega la URL en `index.html`:

```js
const DEPLOYED_PROXY_URL = "https://tu-proyecto.vercel.app/api/autos";
```

Sin proxy publicado o sin CORS habilitado en Oracle APEX, GitHub Pages no puede consumir ese endpoint desde el navegador.
