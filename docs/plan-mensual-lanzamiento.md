# Plan mensual de lanzamiento y validación

## El Horno del Pingüino

**Alcance:** 30 días de validación go-to-market para una pastelería pequeña en Loja, Ecuador
**Fecha del documento:** 27 de julio de 2026
**Horizonte:** 27 de julio–25 de agosto de 2026
**Versión:** 1.1 · Documento operativo y relevo técnico
**Decisión que habilita:** continuar sin cambios, invertir gradualmente o corregir la propuesta

> Este plan no promete posiciones en Google ni ventas. Busca instalar una base medible, reducir incertidumbre y decidir con evidencia qué merece tiempo o dinero.

---

## Estado de implementación y relevo — 28 de julio de 2026

> **Lectura rápida:** la base técnica y la instrumentación están implementadas y verificadas en `origin/main`; la activación externa de la medición y el trabajo SEO/comercial siguen pendientes. No confundir código listo con servicio externo activado ni con operación comercial validada.

### Implementado y verificado

| Estado | Entregable | Evidencia |
|---|---|---|
| [x] | Migración de seguridad: Astro 7.1.4, Tailwind CSS 4, Vitest 4 y Node.js `>=22.12`; auditoría de seguridad en 0 vulnerabilidades. | [PR #23](https://github.com/elhornodelpinguino/El-horno-del-pinguino-Landing-page/pull/23) · `npm audit` 0 |
| [x] | Núcleo analítico e integración en las páginas, fusionados mediante los PR #21 y #24. | [PR #21](https://github.com/elhornodelpinguino/El-horno-del-pinguino-Landing-page/pull/21) · [PR #24](https://github.com/elhornodelpinguino/El-horno-del-pinguino-Landing-page/pull/24) · [issue #19](https://github.com/elhornodelpinguino/El-horno-del-pinguino-Landing-page/issues/19) |
| [x] | Page views para `/` y `/negocios`. | Verificación final del flujo integrado |
| [x] | Contextos de WhatsApp: `consumer`, `business-intro` y `business-closing`. | Verificación final de los CTA y payloads |
| [x] | Pixel controlado de GoatCounter en `/count`, con diseño de privacidad: sin `Referer` y sólo `p` y `e` opcional en la solicitud. | Implementado en el código; **esto no significa que el sitio de GoatCounter ya esté creado o activado en producción** |
| [x] | Deduplicación y seguridad ante fallas para que la medición no rompa la navegación. | Pruebas unitarias, E2E y revisión de runtime |
| [x] | Evidencia final: 92 pruebas unitarias, 95 E2E, `astro check` y build de producción limpios. | Verificación sobre `origin/main` |
| [x] | Commit principal final verificado: `4e296535` (`origin/main`). | [commit `4e296535`](https://github.com/elhornodelpinguino/El-horno-del-pinguino-Landing-page/commit/4e296535) |

### Pendiente o bloqueado

| Estado | Trabajo | Criterio para cerrarlo |
|---|---|---|
| [ ] | Crear y configurar el sitio de GoatCounter. | El sitio existe, el acceso queda bajo control del propietario y el endpoint válido está confirmado. |
| [ ] | Configurar en producción `PUBLIC_ANALYTICS_PROVIDER=goatcounter` y `PUBLIC_ANALYTICS_ENDPOINT=https://<site>.goatcounter.com/count`. | Variables válidas en el proveedor de despliegue; no guardar secretos ni credenciales en Git. |
| [ ] | Redeploy y verificación de la integración. | Inspeccionar las solicitudes de red: sin `Referer` y sólo `p` y `e` opcional; confirmar que no hay duplicados ni errores que afecten la navegación. |
| [ ] | Recopilar el baseline de tráfico y conversiones. | Registrar fecha de activación real, visitas, page views, clics, consultas y oportunidades; no presentar una implementación como datos de producción. |
| [ ] | Dominio, Search Console, Google Business Profile, datos del propietario y registro comercial semanal. | Se completan únicamente con evidencia y datos reales del propietario; no se asumen como terminados. |
| [ ] | Evaluar `@vitest/coverage-v8`. | Instalarlo sólo si se necesita cobertura cuantificada; no bloquea la evidencia actual. |
| [ ] | Reducir el riesgo de flake del E2E de WhatsApp. | La prueba no depende innecesariamente de DNS/servicio externo `wa.me`; mientras tanto, mantenerlo como riesgo conocido. |

### Lista de recuperación después de migrar Linux

- [ ] Clonar el repositorio y cambiar a `main` desde `origin/main`.
- [ ] Instalar Node.js `>=22.12` y npm compatible con el proyecto.
- [ ] Ejecutar `npm ci`.
- [ ] Ejecutar `npm audit --audit-level moderate`, `npm test`, `npx astro check`, `npm run build` y `npm run test:e2e`.
- [ ] Restaurar únicamente secretos y variables de entorno desde el panel del proveedor o un gestor seguro; **nunca commitearlos**.
- [ ] Verificar los despliegues en los paneles de Cloudflare y Vercel, si cada uno corresponde al flujo vigente.
- [ ] Después del redeploy, verificar GoatCounter, las solicitudes de red y la ausencia de `Referer` antes de iniciar el baseline.

El código fuente y este plan están respaldados en Git. Las configuraciones de paneles externos, dominios, credenciales, secretos y ajustes de GoatCounter/Search Console/Google Business Profile deben respaldarse por separado y de forma segura.

---

## Resumen ejecutivo

La landing ya está publicada y funcional en Cloudflare Pages:

<https://el-horno-del-pinguino-landing-page.pages.dev>

Durante los próximos 30 días se trabajará sobre la **distribución, medición y aprendizaje**, no sobre una reconstrucción de la aplicación. El orden recomendado es:

1. **Estabilizar la identidad web:** elegir un dominio, conectarlo, migrar canonicals y conservar redirecciones.
2. **Hacerla descubrible:** configurar Search Console, enviar el sitemap, abrir o verificar Google Business Profile y revisar datos locales.
3. **Medir acciones reales:** habilitar GoatCounter una vez creado y configurado el sitio, y registrar clics de WhatsApp, consultas y ventas con un método simple.
4. **Decidir al día 30:** continuar igual, pagar sólo lo que quite una limitación demostrada o corregir la propuesta comercial.

La hipótesis financiera es **USD 0/mes mientras sea viable** y un gasto anual cercano a **dominio-only, aproximadamente USD 10–25/año**, sujeto a verificar el TLD, impuestos, disponibilidad y precio de renovación. Cloudflare Pages Free y el backend actual en Render Free se mantienen durante esta prueba; no se propone contratar campañas, correo corporativo, herramientas premium ni una base de datos pagada en este mes.

---

## 1. Objetivo mensual y resultados esperados

### Objetivo

Validar durante un mes si la landing puede generar **descubrimiento local y conversaciones comerciales medibles** para pedidos B2C y oportunidades B2B, con la menor inversión recurrente posible.

### Resultados esperados al día 30

- [ ] Un dominio elegido por el propietario y conectado correctamente, o una decisión documentada de postergar la compra.
- [ ] Una única versión canónica definida, con redirecciones y HTTPS verificados.
- [ ] Search Console configurado, sitemap enviado y estado de indexación revisado.
- [ ] Google Business Profile creado o verificado sólo con datos reales y elegibilidad confirmada.
- [ ] Datos locales y estructurados revisados sin inventar dirección, horarios, precios, reseñas o atributos.
- [ ] GoatCounter configurado y con una línea base de tráfico posterior a su activación real.
- [ ] Método observable para registrar clics de WhatsApp, consultas, pedidos y oportunidades B2B.
- [ ] Un tablero o registro semanal de métricas, incidencias y aprendizajes.
- [ ] Una decisión de cierre respaldada por datos, no por una expectativa de ranking.

### Qué significa validar

Validar no significa “aparecer primero en Google” en 30 días. Significa poder responder, con datos y contexto:

- ¿La gente puede encontrar y cargar la landing?
- ¿Google la descubrió, rastreó o indexó alguna URL?
- ¿Alguien inició una conversación o preguntó por un pedido?
- ¿Qué canal y qué mensaje parecen traer mejores señales?
- ¿Qué limitación concreta justificaría el primer gasto?

---

## 2. Principios de operación

| Principio | Aplicación durante este mes |
|---|---|
| **Free-first** | Usar primero Cloudflare Pages Free, Search Console, Google Business Profile y GoatCounter, verificando antes el plan y sus condiciones. |
| **Open-when-practical** | Preferir formatos, scripts y registros exportables; evitar quedar atado a una herramienta premium para conocer lo básico. |
| **Pagar sólo ante evidencia** | Un gasto debe responder a una limitación observada: identidad, medición, velocidad, capacidad o conversión. |
| **Evitar costo de mantenimiento oculto** | No contratar servicios que requieran renovación, monitoreo, configuración o soporte mensual sin dueño claro. |
| **Datos reales antes que volumen** | No publicar horarios, dirección, cobertura, precios, testimonios o resultados que el negocio no pueda sostener. |
| **Una variable importante por vez** | No cambiar dominio, propuesta, canales y diseño simultáneamente si luego no se podrá atribuir el efecto. |
| **Reversibilidad** | Mantener la URL de Pages y el fallback local como red de seguridad durante la migración. |

---

## 3. Alcance

### Incluido

- Elección y compra opcional de un dominio propio.
- Configuración de DNS y conexión con Cloudflare Pages.
- Migración controlada de `site`, canonical, Open Graph, sitemap y referencias estructuradas.
- Redirecciones desde la URL anterior cuando corresponda.
- Alta o verificación de Search Console.
- Revisión y envío del sitemap.
- Alta o verificación de Google Business Profile, si el negocio cumple los requisitos.
- Revisión de datos locales, área de servicio, teléfono, horario, categoría y enlaces.
- Configuración inicial de GoatCounter y su endpoint controlado.
- Definición de eventos o registros simples para WhatsApp y consultas.
- Línea base semanal, QA móvil/escritorio y registro de incidencias.
- Decisión de cierre y backlog priorizado para 60–90 días.

### Fuera de alcance

- Rediseño completo de la landing o implementación de nuevas funcionalidades de producto.
- Campañas pagadas, pauta en Meta/Google o compra de leads.
- Contratación de correo corporativo, CRM premium, call tracking o dashboards pagos.
- Promesa de ranking, volumen de ventas o retorno económico.
- Publicación de reseñas, fotos o datos no verificables.
- Automatización compleja de atribución, CRM o reservas.
- Optimización del backend de Render más allá de verificar disponibilidad y fallback.
- Creación de múltiples perfiles de Google para un mismo negocio.

---

## 4. Dependencias y decisiones del propietario

Estas decisiones deben resolverse antes de ejecutar la actividad asociada. Si no se resuelven, se conserva la URL actual y se documenta el bloqueo; no se improvisan datos.

| Decisión / dato | Responsable de decidir | Cuándo | Condición mínima |
|---|---|---:|---|
| Nombre del dominio y TLD preferido | Propietario | Semana 1, jornada 1 | Elegir una opción principal y una alternativa; verificar precio de compra y renovación. |
| Acceso a la cuenta registradora y Cloudflare | Propietario | Semana 1 | Acceso seguro, 2FA y correo de recuperación controlado por el propietario. |
| Nombre comercial exacto | Propietario | Semana 1 | Debe coincidir con el uso real del negocio. |
| Dirección, modalidad de atención o zona de servicio | Propietario | Semana 2 | Confirmar si recibe clientes, entrega o trabaja sólo por encargo. |
| Horarios y teléfono de contacto | Propietario | Semana 2 | Datos vigentes y atendidos por una persona responsable. |
| Categoría principal y descripción local | Propietario + responsable web | Semana 2 | La categoría describe el negocio principal; no se rellena con palabras clave. |
| Método de registro comercial | Propietario | Semana 3 | Elegir una hoja o registro simple con fecha, origen y resultado. |
| Capacidad real de producción y entrega | Propietario | Semana 3–4 | Define si las consultas son oportunidades o pedidos que no se pueden atender. |

### Paquete de datos que debe entregar el propietario

- Nombre comercial usado públicamente.
- Teléfono/WhatsApp atendido y horario real de respuesta.
- Dirección exacta si corresponde, o zona de servicio si no existe local abierto.
- Horarios de atención y días de producción/entrega.
- Área geográfica prioritaria en Loja.
- Productos y formatos que realmente se ofrecen.
- Fotos y logotipo que se puedan publicar.
- Capacidad semanal aproximada, fechas no disponibles y condiciones de pedido.
- Acceso o invitación a las cuentas de Cloudflare, registrador, Google y Render, sin compartir contraseñas por chat.

---

## 5. Plan de ejecución por semanas

### Semana 1 — Fundación: dominio, DNS y migración canónica

**Objetivo de la semana:** contar con una dirección propia —si se decide comprarla— sin romper la publicación existente.

| Actividad | Responsable sugerido | Costo | Esfuerzo | Entregable | Criterio de aceptación |
|---|---|---:|---:|---|---|
| Comparar 2–3 nombres de dominio y verificar renovación | Propietario | USD 0 antes de comprar | 1 jornada | Decisión registrada con opción principal y alternativa | El nombre es pronunciable, fácil de dictar y representa al negocio; el precio de renovación fue verificado. |
| Comprar y proteger el dominio, si se aprueba | Propietario | **USD 10–25/año estimados**; verificar TLD, impuestos y renovación | 0,5 jornada | Dominio bajo control del propietario | La cuenta tiene 2FA, correo de recuperación y no depende de una cuenta personal de un tercero. |
| Conectar DNS con Cloudflare Pages | Responsable web | USD 0 adicional en la prueba | 0,5–1 jornada | DNS y custom domain configurados | La raíz y/o `www` resuelven por HTTPS y Pages muestra el dominio como activo. |
| Definir versión canónica y migrar referencias | Responsable web | USD 0 adicional | 1 jornada | Canonicals, sitemap, metadata y datos estructurados coherentes | La URL canónica coincide con el dominio elegido; no quedan referencias de producción contradictorias. |
| Configurar redirecciones y probar rutas | Responsable web | USD 0 adicional | 0,5 jornada | Redirección desde URL anterior y rutas funcionales | La URL anterior lleva a la nueva sin bucles; home, `/negocios`, robots y sitemap responden correctamente. |
| QA de migración | Responsable web + propietario | USD 0 | 0,5 jornada | Registro de pruebas | HTTPS, móvil, enlaces principales, WhatsApp y carga inicial pasan una revisión manual. |

**Nota:** la compra del dominio no es obligatoria para aprender; sí es recomendable para una presencia comercial estable y una identidad que el propietario pueda conservar aunque cambie de proveedor.

### Semana 2 — Descubrimiento: Search Console, sitemap y presencia local

**Objetivo de la semana:** dejar habilitadas las fuentes gratuitas que ayudan a descubrir la empresa y observar su presencia en búsqueda.

| Actividad | Responsable sugerido | Costo | Esfuerzo | Entregable | Criterio de aceptación |
|---|---|---:|---:|---|---|
| Verificar la propiedad en Google Search Console | Responsable web + propietario | USD 0 | 0,5 jornada | Propiedad verificada | El dominio o prefijo elegido queda verificado y el propietario conserva acceso. |
| Enviar y revisar sitemap | Responsable web | USD 0 | 0,5 jornada | Registro de envío y estado | El sitemap devuelve HTTP 200, contiene URLs canónicas y queda enviado en Search Console. |
| Solicitar inspección de URLs prioritarias | Responsable web | USD 0 | 0,5 jornada | Capturas o registro de inspección | Home y `/negocios` pueden ser rastreadas; se anotan advertencias sin prometer indexación inmediata. |
| Crear o verificar Google Business Profile | Propietario + responsable web | USD 0 | 1 jornada, más verificación | Perfil reclamado o decisión de elegibilidad | El nombre, categoría, teléfono, horario y dirección/zona son reales y consistentes. |
| Revisar fotos, descripción y enlace local | Propietario | USD 0 | 0,5 jornada | Perfil inicial completo | No se agregan promociones engañosas, URLs dentro de la descripción ni atributos no comprobados. |
| Revisar schema local | Responsable web | USD 0 adicional | 0,5–1 jornada | Lista de campos confirmados | `LocalBusiness`/tipo apropiado, nombre, URL, zona/dirección y contacto coinciden con el negocio real. |

**Dependencia crítica:** Google puede requerir verificación. No se debe crear un perfil duplicado ni mostrar una dirección residencial o virtual si el negocio no recibe clientes allí.

### Semana 3 — Medición y conversión

**Objetivo de la semana:** obtener una primera línea base y medir acciones que importan para el negocio, empezando por herramientas gratuitas.

| Actividad | Responsable sugerido | Costo | Esfuerzo | Entregable | Criterio de aceptación |
|---|---|---:|---:|---|---|
| Crear/configurar GoatCounter y verificar la integración | Propietario + responsable web | Por confirmar | 0,5 jornada | Sitio y endpoint controlados | El endpoint válido recibe page views sin `Referer`, sin duplicados y sin afectar la experiencia; se registra la fecha de activación. |
| Definir eventos de conversión de bajo mantenimiento | Responsable web | USD 0 | 0,5 jornada | Lista de eventos y nombres | Se diferencian al menos `whatsapp_click`, `contact_click` y `b2b_click`, o se documenta una alternativa manual. |
| Verificar los enlaces de WhatsApp y mensajes prellenados | Responsable web + propietario | USD 0 | 0,5 jornada | Registro de pruebas en móvil | Cada CTA abre el número correcto, con contexto suficiente y sin exponer información privada. |
| Crear registro comercial mínimo | Propietario | USD 0 | 0,5 jornada | Hoja o formulario simple | Cada consulta se registra con fecha, canal, tipo B2C/B2B, estado y resultado conocido. |
| Tomar baseline de SEO y tráfico | Responsable web | USD 0 | 0,5 jornada | Tabla de baseline | Se anotan indexación, impresiones, clics, sesiones y eventos disponibles, incluyendo ceros. |
| Revisión de capacidad y respuesta | Propietario | USD 0 | 0,5 jornada | Regla operativa | Existe una respuesta estándar y un tiempo objetivo realista; no se publican promesas que no se pueden cumplir. |

**Regla de atribución:** una conversación no equivale automáticamente a una venta. El registro debe separar “clic”, “consulta”, “cotización”, “pedido confirmado” y “venta atribuible”.

### Semana 4 — Validación, QA y decisión

**Objetivo de la semana:** interpretar señales con prudencia y decidir el siguiente paso sin comprar herramientas por ansiedad.

| Actividad | Responsable sugerido | Costo | Esfuerzo | Entregable | Criterio de aceptación |
|---|---|---:|---:|---|---|
| Comparar baseline con cierre | Responsable web | USD 0 | 0,5 jornada | Informe de variaciones | Cada cambio tiene periodo, fuente y limitación anotados; no se confunde correlación con causalidad. |
| Revisar indexación y consultas en Search Console | Responsable web | USD 0 | 0,5 jornada | Resumen de cobertura y rendimiento | Se documentan impresiones/clics aunque sean bajos o cero; no se promete ranking. |
| Revisar sesiones y conversiones | Responsable web + propietario | USD 0 | 0,5 jornada | Resumen de embudo | Se comparan visitas, clics, consultas y pedidos con el mismo criterio del baseline. |
| QA final de dominio, SEO, móvil y contacto | Responsable web | USD 0 | 0,5–1 jornada | Checklist cerrado | No hay enlaces rotos críticos, canonical contradictorio, CTA principal sin respuesta ni clipping visible. |
| Priorizar backlog de 60–90 días | Propietario + responsable web | USD 0 | 0,5 jornada | Backlog ordenado | Cada ítem tiene problema, evidencia, costo estimado y criterio para probarlo. |
| Reunión de decisión del día 30 | Propietario + responsable web | USD 0 | 20–30 min | Acta de cierre | Se elige una de las tres rutas de cierre y se registra la razón. |

---

## 6. Checklist de jornadas

La carga propuesta es de **3–5 jornadas breves por semana**, no trabajo diario permanente. Una “jornada” puede ser de 45–120 minutos según la actividad.

### Semana 1

- [ ] Jornada 1: decidir nombre, TLD, registrador y responsable de la cuenta.
- [ ] Jornada 2: comprar/configurar dominio si se aprobó; activar 2FA.
- [ ] Jornada 3: configurar DNS y custom domain en Pages.
- [ ] Jornada 4: migrar canonicals, sitemap, metadata y referencias estructuradas.
- [ ] Jornada 5: probar redirecciones, HTTPS, rutas principales y WhatsApp.

### Semana 2

- [ ] Jornada 1: verificar Search Console.
- [ ] Jornada 2: enviar sitemap e inspeccionar home y `/negocios`.
- [ ] Jornada 3: preparar datos reales para Google Business Profile.
- [ ] Jornada 4: crear/verificar perfil y revisar fotos, categoría, horario y enlace.
- [ ] Jornada 5: revisar schema local y registrar pendientes de verificación.

### Semana 3

- [ ] Jornada 1: crear/configurar GoatCounter y verificar el endpoint.
- [ ] Jornada 2: probar eventos/CTA de WhatsApp y contacto.
- [ ] Jornada 3: crear y explicar el registro comercial mínimo.
- [ ] Jornada 4: tomar baseline y guardar fecha de corte.
- [ ] Jornada 5: ajustar la regla de respuesta y capacidad del negocio.

### Semana 4

- [ ] Jornada 1: actualizar métricas de tráfico, Search Console y consultas.
- [ ] Jornada 2: revisar QA técnico y móvil.
- [ ] Jornada 3: clasificar aprendizajes, dudas y falsos positivos.
- [ ] Jornada 4: preparar backlog 60–90 días.
- [ ] Jornada 5: reunión de 20–30 minutos y decisión de cierre.

---

## 7. Presupuesto y gatillos de pago

### Presupuesto obligatorio

| Concepto | USD/año | USD/mes | Decisión |
|---|---:|---:|---|
| Dominio propio, si se aprueba | **Aproximadamente 10–25**, según TLD, impuestos y renovación | Equivalente anual; no es una suscripción mensual objetivo | Recomendado, pero no bloquea la medición inicial. Verificar renovación antes de comprar. |
| Cloudflare Pages Free | 0 | 0 | Mantener. El límite informado de 500 builds/mes y 100 dominios personalizados por proyecto es suficiente para esta etapa. |
| Search Console | 0 | 0 | Usar. |
| Google Business Profile | 0 | 0 | Usar si el negocio es elegible y los datos son reales. |
| GoatCounter | Por confirmar | Por confirmar | Crear el sitio, revisar plan/condiciones y activar sólo después de validar el endpoint. |
| Backend Render actual | 0 en el plan vigente, según contexto operativo | 0 mientras el plan siga siendo suficiente | Mantener fallback local y revisar límites antes de pagar. |

**Objetivo de gasto del mes:** **USD 0/mes** y, si se aprueba, **un solo gasto anual de dominio**.

### Opcional, no recomendado antes de evidencia

- Dominio alternativo o múltiples TLD.
- Correo corporativo.
- Analítica premium, CRM, call tracking o dashboard pago.
- Upgrade de Render o de Cloudflare.
- Campañas pagadas.
- Fotografía o producción de contenido contratada.

### Gatillos para empezar a pagar

Pagar sólo si se observa una limitación concreta y se puede medir el cambio. Ejemplos:

| Evidencia observada | Gasto que podría evaluarse | Condición previa |
|---|---|---|
| La URL de Pages reduce confianza o dificulta recordar/compartir la marca | Dominio propio | Confirmar nombre, renovación y propiedad de la cuenta. |
| Hay consultas suficientes para que el registro manual se vuelva un cuello de botella | Herramienta de registro/CRM | Medir el volumen y comparar con una hoja simple. |
| El backend gratuito falla o deja de cubrir una función necesaria | Upgrade de Render o rediseño del flujo | Documentar error, frecuencia e impacto; preservar el fallback. |
| Hay tráfico recurrente pero no se entiende dónde se pierde la conversión | Analítica adicional | Probar primero instrumentación abierta y un evento bien definido. |
| Existe una oferta validada y audiencia local identificable | Pauta pequeña y acotada | Definir objetivo, presupuesto máximo, periodo y criterio de detenerla. |

No se compra una herramienta sólo porque “podría ayudar”. Primero se registra el problema, se estima el costo de no resolverlo y se define qué resultado observable justificaría mantener el gasto.

---

## 8. KPI y línea base

### Registro semanal

| KPI | Definición operativa | Fuente | Baseline del día 1 | Meta de medición del mes |
|---|---|---|---:|---|
| Indexación | URLs prioritarias descubiertas/indexadas o estado reportado | Search Console | Registrar, aunque sea 0 o “pendiente” | Tener un estado comparable al día 30. |
| Impresiones | Veces que una URL apareció en resultados | Search Console | Registrar | Observar tendencia, sin prometer crecimiento. |
| Clics orgánicos | Clics desde resultados de búsqueda | Search Console | Registrar | Comparar con el periodo inicial disponible. |
| Sesiones/visitas | Visitas observables a la landing | GoatCounter | Registrar fecha de activación real | Contar con una serie semanal consistente. |
| Clics de WhatsApp | Interacciones con CTA de WhatsApp | Evento o registro manual | Registrar | Distinguir clic de conversación real. |
| Consultas | Conversaciones con una necesidad comercial | WhatsApp/registro | Registrar 0 si no existen | Registrar fecha, canal y tipo de necesidad. |
| Ventas atribuibles | Venta donde el canal de entrada es conocido | Registro del propietario | Registrar 0 si no existen | No atribuir ventas sin evidencia. |
| Oportunidades B2B | Solicitudes de cafeterías, colegios, clubes o empresas | Registro del propietario | Registrar 0 si no existen | Separarlas de pedidos B2C y de simples consultas. |
| Tiempo de respuesta | Tiempo aproximado entre consulta y primera respuesta | WhatsApp/registro | Medir una muestra razonable | Detectar si la operación está perdiendo oportunidades. |

### Reglas de lectura

- El primer mes **establece la línea base**; no es una prueba suficiente para concluir que el SEO funciona o no funciona.
- Un cero es un dato válido si se registra junto con el periodo y la cobertura de medición.
- “Sesión”, “clic”, “consulta”, “cotización”, “pedido” y “venta” son etapas distintas.
- Las señales de Google pueden tardar; la ausencia de ranking temprano no demuestra ausencia de demanda.
- El propietario debe anotar también acciones offline: recomendación, feria, visita a un negocio o contacto directo.

---

## 9. Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Señal temprana | Mitigación |
|---|---|---|---|---|
| Se compra un dominio sin revisar renovación o acceso | Media | Alto | Cuenta a nombre de un tercero o precio inicial muy distinto al de renovación | Comprar sólo con cuenta del propietario, 2FA y verificación anual del costo. |
| La migración rompe canonicals o genera duplicación | Media | Alto | URLs mezcladas entre Pages y dominio; redirecciones en bucle | Mantener checklist, probar HTTP/HTTPS, revisar sitemap y conservar la URL anterior como respaldo. |
| Google Business Profile no es elegible o no verifica | Media | Medio | No hay local atendido, dirección virtual o datos inconsistentes | Confirmar modalidad real; usar área de servicio si corresponde; no crear perfiles duplicados. |
| No se registran consultas y luego no se puede atribuir nada | Alta | Alto | “Creo que llegaron por la página” sin fecha ni origen | Registro mínimo desde la semana 3 y pregunta simple de origen en WhatsApp. |
| El tráfico es bajo y se interpreta como fracaso definitivo | Alta | Medio | Conclusiones antes de tener cuatro semanas comparables | Tratar el mes como baseline; separar descubrimiento, conversión y propuesta. |
| Render Free se duerme o falla al cargar datos | Media | Medio | Catálogo vacío, errores intermitentes o tiempos altos | Mantener fallback local, monitorear una vez por semana y no pagar sin evidencia de impacto. |
| Se publican datos comerciales incorrectos | Media | Alto | Horarios, dirección, precios o capacidad cambian entre canales | Aprobación del propietario antes de publicar; registro de fecha de actualización. |
| Se agregan demasiadas herramientas | Media | Medio | Más tiempo administrando paneles que atendiendo pedidos | Una fuente principal por KPI; revisar herramientas opcionales sólo en el día 30. |
| La medición de eventos agrega mantenimiento | Baja | Medio | Eventos duplicados o difíciles de interpretar | Comenzar con tres eventos y un registro manual de respaldo. |

---

## 10. Revisión semanal y registro mínimo

### Reunión

Una vez por semana, reservar **20–30 minutos** con el propietario y la persona responsable de la web. La reunión no es una presentación extensa; es un control de decisiones.

### Agenda fija

1. ¿Qué se completó y qué quedó bloqueado?
2. ¿Qué cambió en indexación, tráfico, clics, consultas y pedidos?
3. ¿Qué evidencia es confiable y qué todavía es una hipótesis?
4. ¿Qué decisión debe tomar el propietario?
5. ¿Cuál es la única prioridad de la próxima semana?

### Registro mínimo

```text
Fecha:
Semana:
Responsables presentes:

Hechos observados:
-

Métricas del periodo:
- Indexación:
- Impresiones / clics:
- Sesiones:
- Clics WhatsApp:
- Consultas / ventas / B2B:

Decisiones:
-

Bloqueos:
-

Próxima prioridad:
-
```

---

## 11. Definition of Done del mes

El mes se considera terminado cuando:

- [ ] La decisión de dominio está ejecutada o postergada con razón y fecha de revisión.
- [ ] La versión canónica, DNS, HTTPS y redirecciones fueron probados.
- [ ] Search Console está verificado o el bloqueo de verificación está documentado.
- [ ] Sitemap, robots, canonicals y datos estructurados fueron revisados en la versión vigente.
- [ ] Google Business Profile está creado/verificado o se documentó por qué todavía no corresponde.
- [ ] GoatCounter tiene una fecha de activación real y registros comparables.
- [ ] El propietario tiene un método simple para registrar consultas, pedidos y origen.
- [ ] Se realizaron cuatro revisiones semanales o se documentaron las semanas omitidas.
- [ ] Se completó el QA de móvil, escritorio, enlaces principales y CTA de WhatsApp.
- [ ] Existe una tabla de KPI con baseline, fecha de corte y limitaciones.
- [ ] Existe backlog de 60–90 días priorizado por evidencia y costo.
- [ ] El propietario tomó una decisión de cierre.

---

## 12. Decisión de cierre del día 30

La decisión debe elegir **una sola ruta principal**. Los umbrales siguientes son orientativos para ordenar la conversación; no son promesas ni benchmarks universales.

### A. Continuar igual

Elegir esta ruta si:

- La base técnica está estable.
- La medición ya funciona, pero aún hay pocos datos para concluir.
- Existen señales iniciales —visitas, impresiones, clics o consultas— que justifican observar otro ciclo sin aumentar gasto.
- El propietario puede sostener la operación con USD 0/mes, con dominio-only si ya lo compró.

**Acción:** repetir el registro durante 30–60 días y mejorar sólo una hipótesis prioritaria.

### B. Invertir gradualmente

Elegir esta ruta si:

- Hay consultas o pedidos atribuibles de forma razonable.
- La propuesta y la capacidad de respuesta son claras.
- Se identifica una limitación específica que un gasto puede resolver.
- Se puede definir presupuesto máximo, periodo de prueba y criterio de detención antes de pagar.

**Acción:** aprobar un solo gasto pequeño —por ejemplo, dominio si aún falta o una herramienta que reemplace un cuello de botella demostrado— y medir antes/después.

### C. Corregir la propuesta

Elegir esta ruta si:

- Hay tráfico o impresiones, pero las personas no avanzan a contacto.
- Las consultas no coinciden con los productos, capacidad o zona atendida.
- Se repiten objeciones sobre precio, entrega, formatos o confianza.
- La propuesta B2C/B2B es demasiado amplia para el mes de prueba.

**Acción:** cambiar mensaje, oferta, segmento o proceso de contacto antes de comprar tráfico. Mantener la instrumentación para poder evaluar la siguiente versión.

### Registro de la decisión

```text
Ruta elegida: [ ] Continuar igual  [ ] Invertir gradualmente  [ ] Corregir propuesta

Evidencia principal:

Dato que todavía no se puede concluir:

Gasto aprobado (si corresponde):

Hipótesis de los próximos 30–60 días:

Criterio para detener o cambiar el plan:
```

---

## 13. Próximos 60–90 días

Después del primer mes, mantener sólo las acciones que hayan producido aprendizaje:

1. Consolidar el dominio y la presencia local; revisar coherencia de nombre, zona, teléfono y horario.
2. Mejorar una página o sección según consultas reales, no según preferencias abstractas.
3. Publicar contenido local útil sólo si el propietario puede sostenerlo y actualizarlo.
4. Probar una acción comercial acotada —alianza B2B, recomendación o pauta pequeña— con presupuesto y criterio de detención explícitos.
5. Revisar mensualmente el embudo completo: impresión → visita → clic → consulta → cotización → pedido → venta.

---

## Fuentes oficiales consultadas

Las fuentes se usaron para verificar límites, características y criterios de las herramientas; no sustituyen la revisión del plan o del precio que aparezca al momento de contratar.

| Fuente | Qué se verificó | URL visible |
|---|---|---|
| **Cloudflare Pages — Limits** | Límite del plan Free de 500 builds por mes y 100 custom domains por proyecto. Última actualización visible: 16 de julio de 2026. | <https://developers.cloudflare.com/pages/platform/limits/> |
| **Cloudflare Registrar** | Registro y renovación “at cost”, DNS/CDN/SSL y necesidad de revisar TLD y renovación. | <https://www.cloudflare.com/products/registrar/> |
| **Render — Pricing** | Planes Hobby/Free, costos de cómputo, límites y condiciones que pueden cambiar. | <https://render.com/pricing> |
| **Google Business Profile Help** | Representación real, nombre, dirección o área de servicio, categorías, teléfono y prevención de perfiles duplicados. | <https://support.google.com/business/answer/3038177?hl=en> |

### Nota de actualización

Los precios y límites de terceros cambian. Antes de comprar o activar una opción paga, verificar la página oficial, el precio de renovación, impuestos, límites del plan y condiciones de cancelación.
