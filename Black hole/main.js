// Variables globales
let physicsEngine;
let renderer;
let controls;
let lastTime = 0;
let fps = 0;
let frameCount = 0;
let fpsTime = 0;

// Estado de la simulación
window.simulationRunning = false;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeSimulation();
    requestAnimationFrame(animate);
});

function initializeSimulation() {
    // Obtener canvas
    const canvas = document.getElementById('simulationCanvas');
    
    // Crear motor de física
    physicsEngine = new PhysicsEngine();
    
    // Crear agujero negro inicial (Sagitario A*)
    physicsEngine.createBlackHole(4.3e6, { x: 0, y: 0 });
    
    // Crear renderizador
    renderer = new Renderer(canvas);
    
    // Crear controles
    controls = new Controls(physicsEngine, renderer);
    
    // Añadir algunos objetos de demostración
    addDemoObjects();
    
    // Actualizar contador de objetos
    controls.updateObjectCount();
    
    // Mostrar información inicial
    showWelcomeMessage();
}

function addDemoObjects() {
    // Planeta en órbita estable
    const r1 = 5e11; // 500 millones de km
    const v1 = physicsEngine.calculateOrbitalVelocity(r1);
    physicsEngine.addObject('planet', 
        { x: r1, y: 0 }, 
        { x: 0, y: v1 }, 
        1
    );
    
    // Estrella en órbita elíptica
    const r2 = 8e11;
    const v2 = physicsEngine.calculateOrbitalVelocity(r2) * 0.8;
    physicsEngine.addObject('star', 
        { x: 0, y: -r2 }, 
        { x: v2, y: 0 }, 
        0.8
    );
    
    // Asteroide en trayectoria de escape
    const r3 = 3e11;
    const v3 = physicsEngine.calculateEscapeVelocity(r3) * 1.1;
    physicsEngine.addObject('asteroid', 
        { x: -r3, y: r3 }, 
        { x: v3 * 0.7, y: -v3 * 0.7 }, 
        1e-12
    );
}

function animate(currentTime) {
    // Calcular delta time
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Actualizar FPS
    updateFPS(currentTime);
    
    // Actualizar física si la simulación está corriendo
    if (window.simulationRunning && deltaTime < 0.1) {
        physicsEngine.update(deltaTime);
    }
    
    // Renderizar
    renderer.render(physicsEngine);
    
    // Actualizar información de tiempo
    updateTimeScale();
    
    // Continuar animación
    requestAnimationFrame(animate);
}

function updateFPS(currentTime) {
    frameCount++;
    if (currentTime - fpsTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        fpsTime = currentTime;
        document.getElementById('fps').textContent = `FPS: ${fps}`;
    }
}

function updateTimeScale() {
    const scale = physicsEngine.timeStep / 1000;
    document.getElementById('time-scale').textContent = `Escala temporal: ${scale.toFixed(1)}x`;
}

function showWelcomeMessage() {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║     SIMULADOR DE AGUJEROS NEGROS         ║
    ╠══════════════════════════════════════════╣
    ║                                          ║
    ║  Controles:                              ║
    ║  • Click en botones para añadir objetos  ║
    ║  • Arrastra para mover la vista          ║
    ║  • Rueda del ratón para zoom             ║
    ║  • Espacio para pausar/reanudar          ║
    ║  • R para reiniciar                      ║
    ║  • Supr para eliminar objeto seleccionado║
    ║                                          ║
    ║  ¡Experimenta con la física relativista! ║
    ╚══════════════════════════════════════════╝
    `);
}

// Utilidades adicionales
function formatNumber(num, decimals = 2) {
    if (Math.abs(num) >= 1e9) {
        return (num / 1e9).toFixed(decimals) + 'B';
    } else if (Math.abs(num) >= 1e6) {
        return (num / 1e6).toFixed(decimals) + 'M';
    } else if (Math.abs(num) >= 1e3) {
        return (num / 1e3).toFixed(decimals) + 'K';
    } else {
        return num.toFixed(decimals);
    }
}

// Funciones de ejemplo para escenarios predefinidos
window.loadScenario = function(scenario) {
    physicsEngine.clear();
    controls.updateObjectCount();
    
    switch(scenario) {
        case 'binary':
            loadBinarySystem();
            break;
        case 'accretion':
            loadAccretionScenario();
            break;
        case 'galaxy':
            loadGalaxyScenario();
            break;
        case 'collision':
            loadCollisionScenario();
            break;
    }
};

function loadBinarySystem() {
    // Sistema binario de agujero negro y estrella
    const r = 1e12;
    const v = physicsEngine.calculateOrbitalVelocity(r) * 0.5;
    
    physicsEngine.addObject('star', 
        { x: r, y: 0 }, 
        { x: 0, y: v }, 
        10
    );
    
    // Planeta orbitando el sistema binario
    const r2 = 2e12;
    const v2 = physicsEngine.calculateOrbitalVelocity(r2);
    physicsEngine.addObject('planet', 
        { x: r2, y: 0 }, 
        { x: 0, y: v2 }, 
        1
    );
}

function loadAccretionScenario() {
    // Múltiples asteroides formando un disco de acreción
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 3e11 + Math.random() * 5e11;
        const v = physicsEngine.calculateOrbitalVelocity(r) * (0.9 + Math.random() * 0.2);
        
        const vAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.2;
        
        physicsEngine.addObject('asteroid', 
            { x: r * Math.cos(angle), y: r * Math.sin(angle) }, 
            { x: v * Math.cos(vAngle), y: v * Math.sin(vAngle) }, 
            1e-12
        );
    }
}

function loadGalaxyScenario() {
    // Simular núcleo galáctico con muchas estrellas
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 5e11 + Math.random() * 1e12;
        const v = physicsEngine.calculateOrbitalVelocity(r) * (0.8 + Math.random() * 0.4);
        
        const vAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.3;
        const mass = 0.5 + Math.random() * 2;
        
        physicsEngine.addObject('star', 
            { x: r * Math.cos(angle), y: r * Math.sin(angle) }, 
            { x: v * Math.cos(vAngle), y: v * Math.sin(vAngle) }, 
            mass
        );
    }
}

function loadCollisionScenario() {
    // Estrella en curso de colisión con el agujero negro
    physicsEngine.addObject('star', 
        { x: 1e12, y: 0 }, 
        { x: -50000, y: 10000 }, 
        2
    );
    
    // Observadores seguros
    const r = 2e12;
    for (let i = 0; i < 3; i++) {
        const angle = i * Math.PI * 2 / 3;
        const v = physicsEngine.calculateOrbitalVelocity(r);
        physicsEngine.addObject('planet', 
            { x: r * Math.cos(angle), y: r * Math.sin(angle) }, 
            { x: -v * Math.sin(angle), y: v * Math.cos(angle) }, 
            0.5
        );
    }
}

// Exportar funciones para depuración
window.debugInfo = function() {
    console.log('Physics Engine:', physicsEngine);
    console.log('Renderer:', renderer);
    console.log('Controls:', controls);
    console.log('Black Hole:', physicsEngine.blackHole);
    console.log('Objects:', physicsEngine.objects);
};

// Función para guardar/cargar simulaciones
window.saveSimulation = function() {
    const data = {
        blackHole: {
            mass: physicsEngine.blackHole.mass,
            position: physicsEngine.blackHole.position
        },
        objects: physicsEngine.objects.map(obj => ({
            type: obj.type,
            position: obj.position,
            velocity: obj.velocity,
            mass: obj.mass
        })),
        settings: {
            zoom: renderer.zoom,
            offset: renderer.offset,
            showEventHorizon: renderer.showEventHorizon,
            showAccretionDisk: renderer.showAccretionDisk,
            showJets: renderer.showJets,
            showOrbits: renderer.showOrbits,
            gravitationalLensing: renderer.gravitationalLensing,
            timeStep: physicsEngine.timeStep,
            accuracy: physicsEngine.accuracy
        }
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'black-hole-simulation.json';
    a.click();
    URL.revokeObjectURL(url);
};

window.loadSimulation = function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Limpiar simulación actual
            physicsEngine.clear();
            
            // Cargar agujero negro
            physicsEngine.createBlackHole(data.blackHole.mass, data.blackHole.position);
            
            // Cargar objetos
            data.objects.forEach(obj => {
                physicsEngine.addObject(obj.type, obj.position, obj.velocity, obj.mass);
            });
            
            // Cargar configuración
            Object.assign(renderer, data.settings);
            physicsEngine.timeStep = data.settings.timeStep;
            physicsEngine.accuracy = data.settings.accuracy;
            
            // Actualizar UI
            controls.updateObjectCount();
            console.log('Simulación cargada exitosamente');
        } catch (error) {
            console.error('Error al cargar la simulación:', error);
        }
    };
    reader.readAsText(file);
};
