# Inventario editable

Cada auto vive en su propia carpeta y usa un único archivo `car.json`. El nombre de la carpeta es la URL del auto.

Para agregar uno, duplica una carpeta existente, cambia su nombre y edita `car.json`. Guarda las fotos en `public/vehicles` y escribe sus rutas en `images`, por ejemplo:

```json
"images": [
  { "path": "/vehicles/mi-auto-frontal.jpg", "alt": "Toyota RAV4, vista frontal" },
  { "path": "/vehicles/mi-auto-lateral.jpg", "alt": "Toyota RAV4, vista lateral" }
]
```

La primera imagen es la portada. Los valores admitidos son:

- `status`: `AVAILABLE`, `RESERVED`, `SOLD` o `DRAFT`
- `transmission`: `MANUAL` o `AUTOMATIC`
- `fuelType`: `GASOLINE`, `DIESEL`, `HYBRID`, `ELECTRIC` u `OTHER`
- `bodyType`: `SUV`, `SEDAN`, `HATCHBACK`, `PICKUP`, `WAGON`, `COUPE`, `VAN` u `OTHER`

Los datos generales y el WhatsApp están en `inventory/settings.json`. Cada cambio enviado a la rama `main` vuelve a publicar GitHub Pages automáticamente.
