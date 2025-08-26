# Simulador de Agujeros Negros

Un simulador interactivo y sofisticado de agujeros negros con física relativista, efectos visuales avanzados y datos astronómicos reales.

## Características

### 🌌 Física Realista
- **Motor de física con relatividad general simplificada**
  - Correcciones relativistas a la gravedad newtoniana
  - Dilatación temporal gravitacional
  - Corrimiento al rojo gravitacional
  - Precesión del perihelio
  - Radio de Schwarzschild y horizonte de eventos

- **Integración numérica precisa**
  - Método Runge-Kutta de 4º orden para alta precisión
  - Diferentes niveles de precisión seleccionables
  - Conservación de energía y momento angular

### 🎨 Efectos Visuales Avanzados
- **Disco de acreción** animado con estructura espiral
- **Jets relativistas** para agujeros negros activos
- **Lente gravitacional** con anillo de Einstein
- **Horizonte de eventos** con efectos de distorsión
- **Trayectorias orbitales** con estelas de colores
- **Efectos de absorción** con fuerzas de marea

### 🎮 Controles Interactivos
- **Colocación de objetos**: Planetas, estrellas, asteroides y estrellas de neutrones
- **Modos de velocidad inicial**: Orbital, escape, personalizada
- **Zoom y navegación** con ratón y teclado
- **Panel de control** completo con todas las opciones
- **Selección de objetos** para ver propiedades detalladas

### 📊 Datos Astronómicos Reales
- **Agujeros negros famosos**:
  - Sagitario A* (centro de la Vía Láctea)
  - M87* (galaxia M87)
  - Agujeros negros estelares e intermedios
- **Constantes físicas precisas**
- **Escalas realistas** con unidades astronómicas

## Cómo Usar

### Instalación
1. Clona o descarga el proyecto
2. Abre `index.html` en un navegador moderno
3. ¡Listo! No requiere instalación adicional

### Controles Básicos

#### Ratón
- **Click izquierdo**: Colocar objeto seleccionado o seleccionar objeto existente
- **Arrastrar**: Mover la vista
- **Rueda**: Zoom in/out

#### Teclado
- **Espacio**: Pausar/reanudar simulación
- **R**: Reiniciar simulación
- **Supr**: Eliminar objeto seleccionado
- **+/-**: Zoom in/out
- **0**: Resetear zoom

### Panel de Control

#### Agujero Negro
- Selecciona presets de agujeros negros reales
- Ajusta la masa con el deslizador
- Activa/desactiva efectos visuales

#### Añadir Objetos
1. Haz clic en el tipo de objeto (planeta, estrella, etc.)
2. Selecciona el modo de velocidad inicial
3. Haz clic en el espacio para colocar el objeto

#### Visualización
- Muestra/oculta órbitas, vectores, cuadrícula
- Activa efectos relativistas
- Habilita lente gravitacional

#### Simulación
- Controla la velocidad de simulación
- Ajusta la precisión física
- Pausa, reinicia o limpia la simulación

## Escenarios de Ejemplo

El simulador incluye varios escenarios predefinidos que puedes cargar:

### Sistema Binario
```javascript
loadScenario('binary')
```
Un sistema de agujero negro y estrella masiva orbitando mutuamente.

### Disco de Acreción
```javascript
loadScenario('accretion')
```
Múltiples asteroides formando un disco de acreción alrededor del agujero negro.

### Núcleo Galáctico
```javascript
loadScenario('galaxy')
```
Simulación de un núcleo galáctico con muchas estrellas orbitando.

### Colisión Estelar
```javascript
loadScenario('collision')
```
Una estrella en curso de colisión con el agujero negro.

## Características Técnicas

### Precisión Física
- Integración Runge-Kutta 4º orden
- Correcciones relativistas de Schwarzschild
- Conservación de cantidades físicas

### Rendimiento
- Optimización para múltiples objetos
- Renderizado eficiente con Canvas 2D
- Control de precisión ajustable

### Datos Utilizados
- Constante gravitacional: G = 6.67430×10⁻¹¹ m³/kg·s²
- Velocidad de la luz: c = 299,792,458 m/s
- Masa solar: M☉ = 1.989×10³⁰ kg
- Masa terrestre: M⊕ = 5.972×10²⁴ kg

## Guardar y Cargar Simulaciones

### Guardar
```javascript
saveSimulation()
```
Guarda el estado actual de la simulación en un archivo JSON.

### Cargar
Usa el input de archivo o:
```javascript
loadSimulation(file)
```

## Depuración

Para información de depuración:
```javascript
debugInfo()
```

## Física Implementada

### Ecuaciones Principales

1. **Fuerza gravitacional con corrección relativista**:
   ```
   F = GMm/r² × (1 + 3Rs/r + v²/c²)
   ```

2. **Radio de Schwarzschild**:
   ```
   Rs = 2GM/c²
   ```

3. **Dilatación temporal**:
   ```
   τ = t × √(1 - Rs/r) × √(1 - v²/c²)
   ```

4. **Velocidad orbital**:
   ```
   v = √(GM/r)
   ```

## Créditos

Desarrollado con física relativista simplificada basada en la métrica de Schwarzschild.
Datos astronómicos de fuentes científicas públicas.

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
