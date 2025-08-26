class Controls {
    constructor(physicsEngine, renderer) {
        this.physicsEngine = physicsEngine;
        this.renderer = renderer;
        this.selectedObject = null;
        this.placingObject = null;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        
        this.initializeControls();
        this.initializeMouseControls();
        this.initializeKeyboardControls();
    }

    initializeControls() {
        // Controles del agujero negro
        const massSlider = document.getElementById('black-hole-mass');
        const massValue = document.getElementById('mass-value');
        const presetSelect = document.getElementById('black-hole-preset');
        
        massSlider.addEventListener('input', (e) => {
            const exponent = parseFloat(e.target.value);
            const mass = Math.pow(10, exponent);
            massValue.textContent = this.formatMass(mass);
            
            if (this.physicsEngine.blackHole) {
                this.physicsEngine.blackHole.mass = mass;
                this.physicsEngine.blackHole.massKg = mass * CONSTANTS.SOLAR_MASS;
                this.physicsEngine.blackHole.updateProperties();
            }
            
            presetSelect.value = 'custom';
        });
        
        presetSelect.addEventListener('change', (e) => {
            const preset = BLACK_HOLE_PRESETS[e.target.value];
            if (preset) {
                const mass = preset.mass;
                const exponent = Math.log10(mass);
                massSlider.value = exponent;
                massValue.textContent = this.formatMass(mass);
                
                if (this.physicsEngine.blackHole) {
                    this.physicsEngine.blackHole.mass = mass;
                    this.physicsEngine.blackHole.massKg = mass * CONSTANTS.SOLAR_MASS;
                    this.physicsEngine.blackHole.updateProperties();
                }
            }
        });
        
        // Opciones de visualización
        document.getElementById('show-event-horizon').addEventListener('change', (e) => {
            this.renderer.showEventHorizon = e.target.checked;
        });
        
        document.getElementById('show-accretion-disk').addEventListener('change', (e) => {
            this.renderer.showAccretionDisk = e.target.checked;
        });
        
        document.getElementById('show-jets').addEventListener('change', (e) => {
            this.renderer.showJets = e.target.checked;
        });
        
        document.getElementById('gravitational-lensing').addEventListener('change', (e) => {
            this.renderer.gravitationalLensing = e.target.checked;
        });
        
        document.getElementById('show-orbits').addEventListener('change', (e) => {
            this.renderer.showOrbits = e.target.checked;
        });
        
        document.getElementById('show-vectors').addEventListener('change', (e) => {
            this.renderer.showVectors = e.target.checked;
        });
        
        document.getElementById('show-grid').addEventListener('change', (e) => {
            this.renderer.showGrid = e.target.checked;
        });
        
        document.getElementById('relativistic-effects').addEventListener('change', (e) => {
            this.physicsEngine.relativistic = e.target.checked;
        });
        
        // Botones de objetos
        const objectButtons = document.querySelectorAll('.object-btn');
        objectButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Desactivar otros botones
                objectButtons.forEach(b => b.classList.remove('active'));
                
                if (this.placingObject === btn.dataset.type) {
                    this.placingObject = null;
                    btn.classList.remove('active');
                } else {
                    this.placingObject = btn.dataset.type;
                    btn.classList.add('active');
                }
            });
        });
        
        // Controles de simulación
        const playPauseBtn = document.getElementById('play-pause');
        playPauseBtn.addEventListener('click', () => {
            if (window.simulationRunning) {
                window.simulationRunning = false;
                playPauseBtn.textContent = '▶️ Iniciar';
            } else {
                window.simulationRunning = true;
                playPauseBtn.textContent = '⏸️ Pausar';
            }
        });
        
        document.getElementById('reset').addEventListener('click', () => {
            this.resetSimulation();
        });
        
        document.getElementById('clear').addEventListener('click', () => {
            this.physicsEngine.clear();
            this.updateObjectCount();
        });
        
        // Control de velocidad
        const speedSlider = document.getElementById('simulation-speed');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const speed = Math.pow(10, value);
            speedValue.textContent = speed.toFixed(1) + 'x';
            this.physicsEngine.timeStep = 1000 * speed;
        });
        
        // Precisión física
        document.getElementById('physics-accuracy').addEventListener('change', (e) => {
            this.physicsEngine.accuracy = e.target.value;
        });
        
        // Controles de zoom
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.renderer.zoomIn();
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.renderer.zoomOut();
        });
        
        document.getElementById('zoom-reset').addEventListener('click', () => {
            this.renderer.resetZoom();
        });
    }

    initializeMouseControls() {
        const canvas = this.renderer.canvas;
        const tooltip = document.getElementById('tooltip');
        
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (this.placingObject) {
                this.placeObject(x, y);
            } else {
                this.isDragging = true;
                this.dragStart = { x: e.clientX, y: e.clientY };
                this.dragOffset = { ...this.renderer.offset };
                canvas.style.cursor = 'grabbing';
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.lastMousePos = { x, y };
            
            if (this.isDragging && !this.placingObject) {
                const dx = e.clientX - this.dragStart.x;
                const dy = e.clientY - this.dragStart.y;
                this.renderer.offset.x = this.dragOffset.x + dx;
                this.renderer.offset.y = this.dragOffset.y + dy;
            } else if (this.placingObject) {
                // Mostrar preview del objeto
                this.showObjectPreview(x, y);
            } else {
                // Detectar objeto bajo el cursor
                const worldPos = this.renderer.screenToWorld(x, y);
                const hoveredObject = this.findObjectAt(worldPos);
                
                if (hoveredObject) {
                    canvas.style.cursor = 'pointer';
                    this.showTooltip(hoveredObject, x, y);
                } else {
                    canvas.style.cursor = 'crosshair';
                    this.hideTooltip();
                }
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            this.isDragging = false;
            canvas.style.cursor = 'crosshair';
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.hideTooltip();
        });
        
        canvas.addEventListener('click', (e) => {
            if (!this.placingObject && !this.isDragging) {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const worldPos = this.renderer.screenToWorld(x, y);
                const clickedObject = this.findObjectAt(worldPos);
                
                if (clickedObject) {
                    this.selectObject(clickedObject);
                } else {
                    this.selectObject(null);
                }
            }
        });
        
        // Zoom con rueda del ratón
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.renderer.zoom *= delta;
            this.renderer.zoom = Math.max(0.1, Math.min(10, this.renderer.zoom));
        });
    }

    initializeKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    document.getElementById('play-pause').click();
                    break;
                case 'r':
                case 'R':
                    this.resetSimulation();
                    break;
                case 'Delete':
                    if (this.selectedObject) {
                        this.physicsEngine.removeObject(this.selectedObject);
                        this.selectObject(null);
                        this.updateObjectCount();
                    }
                    break;
                case '+':
                case '=':
                    this.renderer.zoomIn();
                    break;
                case '-':
                case '_':
                    this.renderer.zoomOut();
                    break;
                case '0':
                    this.renderer.resetZoom();
                    break;
            }
        });
    }

    placeObject(screenX, screenY) {
        const worldPos = this.renderer.screenToWorld(screenX, screenY);
        const velocityMode = document.getElementById('initial-velocity').value;
        
        // Calcular velocidad según el modo seleccionado
        const r = Math.sqrt(worldPos.x ** 2 + worldPos.y ** 2);
        let velocity = { x: 0, y: 0 };
        
        if (this.physicsEngine.blackHole && r > 0) {
            switch (velocityMode) {
                case 'orbital':
                    const v_orbital = this.physicsEngine.calculateOrbitalVelocity(r);
                    const angle = Math.atan2(worldPos.y, worldPos.x) + Math.PI / 2;
                    velocity = {
                        x: v_orbital * Math.cos(angle),
                        y: v_orbital * Math.sin(angle)
                    };
                    break;
                case 'escape':
                    const v_escape = this.physicsEngine.calculateEscapeVelocity(r);
                    const escapeAngle = Math.atan2(worldPos.y, worldPos.x);
                    velocity = {
                        x: v_escape * Math.cos(escapeAngle),
                        y: v_escape * Math.sin(escapeAngle)
                    };
                    break;
                case 'slow':
                    velocity = { x: 1000, y: 0 };
                    break;
                case 'fast':
                    velocity = { x: 50000, y: 0 };
                    break;
                case 'custom':
                    // Permitir al usuario arrastrar para definir velocidad
                    this.startVelocityDrag(worldPos);
                    return;
            }
        }
        
        // Determinar masa según el tipo
        let mass;
        switch (this.placingObject) {
            case 'planet':
                mass = 1 + Math.random() * 4; // 1-5 masas terrestres
                break;
            case 'star':
                mass = 0.5 + Math.random() * 2; // 0.5-2.5 masas solares
                break;
            case 'asteroid':
                mass = 1e-12; // Muy pequeño
                break;
            case 'neutron':
                mass = 1.4; // Típica estrella de neutrones
                break;
        }
        
        const object = this.physicsEngine.addObject(this.placingObject, worldPos, velocity, mass);
        this.updateObjectCount();
        
        // Resetear el modo de colocación
        this.placingObject = null;
        document.querySelectorAll('.object-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    startVelocityDrag(startPos) {
        // Implementar arrastre para definir velocidad personalizada
        const canvas = this.renderer.canvas;
        const originalCursor = canvas.style.cursor;
        canvas.style.cursor = 'crosshair';
        
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const endPos = this.renderer.screenToWorld(x, y);
            
            // Dibujar línea de velocidad (temporal)
            // TODO: Implementar visualización temporal
        };
        
        const handleMouseUp = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const endPos = this.renderer.screenToWorld(x, y);
            
            const velocity = {
                x: (endPos.x - startPos.x) * 100,
                y: (endPos.y - startPos.y) * 100
            };
            
            const mass = this.placingObject === 'star' ? 1 : 
                        this.placingObject === 'neutron' ? 1.4 : 
                        this.placingObject === 'asteroid' ? 1e-12 : 1;
            
            this.physicsEngine.addObject(this.placingObject, startPos, velocity, mass);
            this.updateObjectCount();
            
            // Limpiar
            canvas.style.cursor = originalCursor;
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            
            this.placingObject = null;
            document.querySelectorAll('.object-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        };
        
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
    }

    findObjectAt(worldPos) {
        for (const object of this.physicsEngine.objects) {
            const dx = object.position.x - worldPos.x;
            const dy = object.position.y - worldPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < object.radius * 3) {
                return object;
            }
        }
        return null;
    }

    selectObject(object) {
        this.selectedObject = object;
        const infoDiv = document.getElementById('object-info');
        
        if (object) {
            const info = object.getInfo();
            let html = '';
            for (const [key, value] of Object.entries(info)) {
                html += `<div class="info-item"><span>${key}:</span><span>${value}</span></div>`;
            }
            infoDiv.innerHTML = html;
        } else {
            infoDiv.innerHTML = '<p>Haz clic en un objeto para ver sus propiedades</p>';
        }
    }

    showTooltip(object, x, y) {
        const tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = `
            <strong>${object.name}</strong><br>
            Masa: ${object.type === 'star' || object.type === 'neutron' ? 
                    object.mass.toFixed(2) + ' M☉' : 
                    object.mass.toFixed(2) + ' M⊕'}<br>
            Velocidad: ${(Math.sqrt(object.velocity.x ** 2 + object.velocity.y ** 2) / 1000).toFixed(1)} km/s
        `;
        tooltip.style.left = x + 10 + 'px';
        tooltip.style.top = y - 40 + 'px';
        tooltip.classList.add('visible');
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.classList.remove('visible');
    }

    showObjectPreview(x, y) {
        // TODO: Implementar preview visual del objeto a colocar
    }

    resetSimulation() {
        this.physicsEngine.clear();
        this.physicsEngine.createBlackHole(4.3e6, { x: 0, y: 0 });
        this.renderer.resetZoom();
        this.selectObject(null);
        this.updateObjectCount();
        
        // Resetear controles
        document.getElementById('play-pause').textContent = '▶️ Iniciar';
        window.simulationRunning = false;
    }

    updateObjectCount() {
        const count = this.physicsEngine.objects.filter(obj => !obj.absorbed).length;
        document.getElementById('objects-count').textContent = `Objetos: ${count}`;
    }

    formatMass(mass) {
        if (mass >= 1e9) {
            return (mass / 1e9).toFixed(1) + 'B';
        } else if (mass >= 1e6) {
            return (mass / 1e6).toFixed(1) + 'M';
        } else if (mass >= 1e3) {
            return (mass / 1e3).toFixed(1) + 'K';
        } else {
            return mass.toFixed(1);
        }
    }
}
