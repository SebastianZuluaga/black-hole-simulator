class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Configuración de visualización
        this.zoom = 1;
        this.offset = { x: 0, y: 0 };
        this.scale = 1e-9; // Escala de conversión metros a píxeles
        
        // Opciones de renderizado
        this.showEventHorizon = true;
        this.showAccretionDisk = true;
        this.showJets = false;
        this.showOrbits = true;
        this.showVectors = false;
        this.showGrid = false;
        this.gravitationalLensing = false;
        
        // Caché de gradientes
        this.gradientCache = new Map();
        
        // Estrellas de fondo
        this.stars = this.generateStars(500);
        
        // Configurar canvas
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.offset = { x: this.width / 2, y: this.height / 2 };
    }

    render(physicsEngine) {
        // Limpiar canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Guardar estado del contexto
        this.ctx.save();
        
        // Aplicar transformaciones
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Renderizar componentes en orden
        this.renderStars();
        
        if (this.showGrid) {
            this.renderGrid();
        }
        
        if (physicsEngine.blackHole) {
            this.renderBlackHole(physicsEngine.blackHole);
        }
        
        // Renderizar objetos
        physicsEngine.objects.forEach(object => {
            if (this.showOrbits && object.trail.length > 1) {
                this.renderOrbit(object);
            }
            this.renderSpaceObject(object);
            if (this.showVectors) {
                this.renderVelocityVector(object);
            }
        });
        
        // Restaurar estado del contexto
        this.ctx.restore();
    }

    renderStars() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        
        this.stars.forEach(star => {
            // Aplicar efecto de paralaje
            const parallaxFactor = star.z;
            const x = (star.x - this.offset.x) * parallaxFactor + this.offset.x - this.offset.x;
            const y = (star.y - this.offset.y) * parallaxFactor + this.offset.y - this.offset.y;
            
            this.ctx.fillStyle = star.color;
            this.ctx.beginPath();
            this.ctx.arc(x / this.zoom, y / this.zoom, star.size / this.zoom, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }

    renderGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1 / this.zoom;
        
        const gridSize = 100 / this.scale; // 100 metros en unidades de pantalla
        const gridCount = 20;
        
        for (let i = -gridCount; i <= gridCount; i++) {
            const pos = i * gridSize;
            
            // Líneas verticales
            this.ctx.beginPath();
            this.ctx.moveTo(pos, -gridCount * gridSize);
            this.ctx.lineTo(pos, gridCount * gridSize);
            this.ctx.stroke();
            
            // Líneas horizontales
            this.ctx.beginPath();
            this.ctx.moveTo(-gridCount * gridSize, pos);
            this.ctx.lineTo(gridCount * gridSize, pos);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    renderBlackHole(blackHole) {
        const x = blackHole.position.x * this.scale;
        const y = blackHole.position.y * this.scale;
        const rs = blackHole.schwarzschildRadius * this.scale;
        
        // Disco de acreción
        if (this.showAccretionDisk) {
            this.renderAccretionDisk(x, y, blackHole);
        }
        
        // Jets relativistas
        if (this.showJets) {
            this.renderJets(x, y, blackHole);
        }
        
        // Efecto de lente gravitacional
        if (this.gravitationalLensing) {
            this.renderGravitationalLensing(x, y, blackHole);
        }
        
        // Horizonte de eventos
        if (this.showEventHorizon) {
            this.renderEventHorizon(x, y, rs);
        }
        
        // Singularidad (punto central)
        this.ctx.save();
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(x, y, Math.max(2 / this.zoom, rs * 0.1), 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    renderEventHorizon(x, y, radius) {
        this.ctx.save();
        
        // Borde brillante del horizonte de eventos
        const gradient = this.ctx.createRadialGradient(x, y, radius * 0.9, x, y, radius * 1.2);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.7, 'rgba(100, 0, 150, 0.8)');
        gradient.addColorStop(0.9, 'rgba(200, 100, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 1.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Horizonte de eventos (círculo negro)
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Efecto de distorsión
        this.ctx.strokeStyle = 'rgba(150, 100, 255, 0.3)';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    renderAccretionDisk(x, y, blackHole) {
        const innerRadius = blackHole.iscoRadius * this.scale;
        const outerRadius = blackHole.accretionDiskRadius * this.scale;
        
        this.ctx.save();
        
        // Crear gradiente para el disco
        const gradient = this.ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0.9)');
        gradient.addColorStop(0.3, 'rgba(255, 150, 50, 0.7)');
        gradient.addColorStop(0.6, 'rgba(255, 100, 50, 0.5)');
        gradient.addColorStop(0.9, 'rgba(150, 50, 50, 0.3)');
        gradient.addColorStop(1, 'rgba(50, 0, 0, 0)');
        
        // Dibujar disco con rotación
        const time = Date.now() * 0.0001;
        const segments = 50;
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const nextAngle = ((i + 1) / segments) * Math.PI * 2;
            
            // Añadir variación de brillo para simular estructura espiral
            const brightness = 0.7 + 0.3 * Math.sin(angle * 3 + time * 10);
            
            this.ctx.save();
            this.ctx.globalAlpha = brightness;
            this.ctx.fillStyle = gradient;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.arc(x, y, outerRadius, angle, nextAngle);
            this.ctx.lineTo(x + Math.cos(nextAngle) * innerRadius, y + Math.sin(nextAngle) * innerRadius);
            this.ctx.arc(x, y, innerRadius, nextAngle, angle, true);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        }
        
        // Añadir brillo adicional cerca del borde interno
        const innerGlow = this.ctx.createRadialGradient(x, y, innerRadius * 0.8, x, y, innerRadius * 1.5);
        innerGlow.addColorStop(0, 'rgba(255, 255, 200, 0)');
        innerGlow.addColorStop(0.5, 'rgba(255, 255, 150, 0.6)');
        innerGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
        
        this.ctx.fillStyle = innerGlow;
        this.ctx.beginPath();
        this.ctx.arc(x, y, innerRadius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    renderJets(x, y, blackHole) {
        const jetLength = blackHole.schwarzschildRadius * this.scale * 20;
        const jetWidth = blackHole.schwarzschildRadius * this.scale * 2;
        
        this.ctx.save();
        
        // Jets superior e inferior
        [-1, 1].forEach(direction => {
            const gradient = this.ctx.createLinearGradient(
                x, y,
                x, y + direction * jetLength
            );
            gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(50, 150, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            
            // Forma cónica del jet
            this.ctx.beginPath();
            this.ctx.moveTo(x - jetWidth / 4, y);
            this.ctx.lineTo(x - jetWidth, y + direction * jetLength);
            this.ctx.lineTo(x + jetWidth, y + direction * jetLength);
            this.ctx.lineTo(x + jetWidth / 4, y);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Partículas del jet
            const particles = 20;
            for (let i = 0; i < particles; i++) {
                const t = i / particles;
                const px = x + (Math.random() - 0.5) * jetWidth * t;
                const py = y + direction * jetLength * t;
                const size = (1 - t) * 3 / this.zoom;
                
                this.ctx.fillStyle = `rgba(150, 200, 255, ${1 - t})`;
                this.ctx.beginPath();
                this.ctx.arc(px, py, size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.restore();
    }

    renderGravitationalLensing(x, y, blackHole) {
        // Efecto simplificado de lente gravitacional
        this.ctx.save();
        
        const lensRadius = blackHole.schwarzschildRadius * this.scale * 5;
        
        // Crear efecto de distorsión circular
        const gradient = this.ctx.createRadialGradient(x, y, lensRadius * 0.5, x, y, lensRadius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.5, 'rgba(200, 200, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(150, 150, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, lensRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Anillo de Einstein
        this.ctx.strokeStyle = 'rgba(200, 200, 255, 0.3)';
        this.ctx.lineWidth = 2 / this.zoom;
        this.ctx.beginPath();
        this.ctx.arc(x, y, blackHole.schwarzschildRadius * this.scale * 2.6, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    renderSpaceObject(object) {
        const x = object.position.x * this.scale;
        const y = object.position.y * this.scale;
        const radius = Math.max(3 / this.zoom, object.radius * this.scale);
        
        this.ctx.save();
        
        if (object.absorbed) {
            // Efecto de absorción
            this.ctx.globalAlpha = object.absorptionTime;
            object.absorptionTime -= 0.02;
            
            // Estiramiento por fuerzas de marea
            const stretchFactor = 1 + (1 - object.absorptionTime) * 5;
            this.ctx.scale(1, stretchFactor);
        }
        
        // Resplandor del objeto
        const glow = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        glow.addColorStop(0, object.color);
        glow.addColorStop(0.5, object.color + '80');
        glow.addColorStop(1, object.color + '00');
        
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Núcleo del objeto
        this.ctx.fillStyle = object.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Efectos adicionales según el tipo
        if (object.type === 'star') {
            // Corona estelar
            const corona = this.ctx.createRadialGradient(x, y, radius, x, y, radius * 1.5);
            corona.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
            corona.addColorStop(1, 'rgba(255, 200, 100, 0)');
            this.ctx.fillStyle = corona;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (object.type === 'neutron') {
            // Pulsos de la estrella de neutrones
            const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            this.ctx.strokeStyle = `rgba(200, 200, 255, ${pulse})`;
            this.ctx.lineWidth = 2 / this.zoom;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    renderOrbit(object) {
        if (object.trail.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = object.color + '40';
        this.ctx.lineWidth = 2 / this.zoom;
        
        this.ctx.beginPath();
        object.trail.forEach((point, index) => {
            const x = point.x * this.scale;
            const y = point.y * this.scale;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    renderVelocityVector(object) {
        const x = object.position.x * this.scale;
        const y = object.position.y * this.scale;
        const scale = 0.1; // Escala para visualización del vector
        const vx = object.velocity.x * this.scale * scale;
        const vy = object.velocity.y * this.scale * scale;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2 / this.zoom;
        
        // Línea del vector
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + vx, y + vy);
        this.ctx.stroke();
        
        // Punta de flecha
        const angle = Math.atan2(vy, vx);
        const arrowLength = 10 / this.zoom;
        const arrowAngle = Math.PI / 6;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + vx, y + vy);
        this.ctx.lineTo(
            x + vx - arrowLength * Math.cos(angle - arrowAngle),
            y + vy - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.ctx.moveTo(x + vx, y + vy);
        this.ctx.lineTo(
            x + vx - arrowLength * Math.cos(angle + arrowAngle),
            y + vy - arrowLength * Math.sin(angle + arrowAngle)
        );
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                z: 0.5 + Math.random() * 0.5, // Profundidad para paralaje
                size: Math.random() * 2,
                color: this.getStarColor()
            });
        }
        return stars;
    }

    getStarColor() {
        const colors = [
            '#FFFFFF', // Blanco
            '#FFDDC1', // Amarillo claro
            '#FFE6CC', // Naranja claro
            '#D6E6FF', // Azul claro
            '#FFB6C1'  // Rosa claro
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    screenToWorld(screenX, screenY) {
        const x = (screenX - this.offset.x) / this.zoom / this.scale;
        const y = (screenY - this.offset.y) / this.zoom / this.scale;
        return { x, y };
    }

    worldToScreen(worldX, worldY) {
        const x = worldX * this.scale * this.zoom + this.offset.x;
        const y = worldY * this.scale * this.zoom + this.offset.y;
        return { x, y };
    }

    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 10);
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.1);
    }

    resetZoom() {
        this.zoom = 1;
        this.offset = { x: this.width / 2, y: this.height / 2 };
    }
}
