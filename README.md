# Alquiler de autos

Front simple para Oracle APEX/ORDS con dos vistas:

- Usuario: consulta autos disponibles y registra una solicitud de alquiler.
- Administrador: backoffice para cargar autos, clientes y alquileres.

## Estructura

```txt
index.html       Estructura de la app
css/styles.css   Estilos
js/app.js        Logica de vistas, render y llamadas a ORDS
api/autos.js     Proxy serverless para Vercel
```

## Endpoint base

El front apunta a:

```txt
https://oracleapex.com/ords/tbdandres/alquiler/
```

## Templates REST necesarios

Para que todo funcione, el modulo `alquiler_api` necesita estos templates:

```txt
autos/
clientes/
alquileres/
```

Metodos esperados:

```txt
GET  autos/
POST autos/
GET  clientes/
POST clientes/
GET  alquileres/
POST alquileres/
```

`autos/` ya devuelve datos. Si `clientes/` o `alquileres/` todavia no existen en APEX, el front va a mostrar la vista pero no va a poder guardar esos formularios.

## CORS

El modulo REST debe permitir estos origenes:

```txt
https://alquiler-front-alpha.vercel.app,https://andrewmeierdev.github.io
```

SQL sugerido:

```sql
BEGIN
  ORDS.SET_MODULE_ORIGINS_ALLOWED(
    p_module_name     => 'alquiler_api',
    p_origins_allowed => 'https://alquiler-front-alpha.vercel.app,https://andrewmeierdev.github.io'
  );

  COMMIT;
END;
/
```
