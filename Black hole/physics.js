// Constantes físicas
const CONSTANTS = {
    G: 6.67430e-11,        // Constante gravitacional (m³/kg·s²)
    c: 299792458,          // Velocidad de la luz (m/s)
    SOLAR_MASS: 1.989e30,  // Masa solar (kg)
    EARTH_MASS: 5.972e24,  // Masa terrestre (kg)
    AU: 1.496e11,          // Unidad astronómica (m)
    PARSEC: 3.086e16,      // Parsec (m)
    SCALE: 1e-9,           // Factor de escala para visualización
};

// Presets de agujeros negros famosos
const BLACK_HOLE_PRESETS = {
    stellar: {
        name: 'Agujero Negro Estelar',
        mass: 10,
        description: 'Formado por el colapso de una estrella masiva'
    },
    intermediate: {
        name: 'Agujero Negro Intermedio',
        mass: 1000,
        description: 'Masa entre estelar y supermasivo'
    },
    sagittariusA: {
        name: 'Sagitario A*',
        mass: 4.3e6,
        description: 'Centro de la Vía Láctea'
    },
    m87: {
        name: 'M87*',
        mass: 6.5e9,
        description: 'Centro de la galaxia M87'
    }
};

class PhysicsEngine {
    constructor() {
        this.blackHole = null;
        this.objects = [];
        this.timeStep = 1000; // segundos
        this.accuracy = 'medium';
        this.relativistic = true;
        this.maxTrailLength = 500;
    }

    createBlackHole(mass, position = { x: 0, y: 0 }) {
        this.blackHole = new BlackHole(mass, position);
        return this.blackHole;
    }

    addObject(type, position, velocity, mass) {
        const object = new SpaceObject(type, position, velocity, mass);
        this.objects.push(object);
        return object;
    }

    removeObject(object) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
    }

    update(deltaTime) {
        if (!this.blackHole) return;

        const dt = deltaTime * this.timeStep;
        const steps = this.accuracy === 'high' ? 10 : (this.accuracy === 'medium' ? 5 : 1);
        const subDt = dt / steps;

        for (let step = 0; step < steps; step++) {
            this.objects.forEach(object => {
                if (!object.absorbed) {
                    this.updateObject(object, subDt);
                }
            });
        }

        // Limpiar objetos absorbidos
        this.objects = this.objects.filter(obj => !obj.absorbed || obj.absorptionTime > 0);
    }

    updateObject(object, dt) {
        const r = this.getDistance(object.position, this.blackHole.position);
        
        // Verificar si está dentro del horizonte de eventos
        if (r < this.blackHole.schwarzschildRadius) {
            if (!object.absorbed) {
                object.absorbed = true;
                object.absorptionTime = 1.0;
                this.blackHole.mass += object.mass / CONSTANTS.SOLAR_MASS;
                this.blackHole.updateProperties();
            }
            return;
        }

        // Calcular aceleración gravitacional
        const acceleration = this.calculateAcceleration(object, r);
        
        // Actualizar velocidad y posición usando Runge-Kutta 4
        if (this.accuracy === 'high') {
            this.rungeKutta4(object, dt, acceleration);
        } else {
            // Método de Euler mejorado
            object.velocity.x += acceleration.x * dt;
            object.velocity.y += acceleration.y * dt;
            object.position.x += object.velocity.x * dt;
            object.position.y += object.velocity.y * dt;
        }

        // Efectos relativistas
        if (this.relativistic) {
            this.applyRelativisticEffects(object, r);
        }

        // Actualizar trail
        object.updateTrail(this.maxTrailLength);

        // Calcular propiedades orbitales
        this.updateOrbitalProperties(object);
    }

    calculateAcceleration(object, r) {
        const dx = this.blackHole.position.x - object.position.x;
        const dy = this.blackHole.position.y - object.position.y;
        
        // Fuerza gravitacional newtoniana
        let F = CONSTANTS.G * this.blackHole.massKg * object.massKg / (r * r);
        
        // Corrección relativista (aproximación de Schwarzschild)
        if (this.relativistic) {
            const rs = this.blackHole.schwarzschildRadius;
            const v2 = object.velocity.x ** 2 + object.velocity.y ** 2;
            const relativisticFactor = 1 + 3 * rs / r + v2 / (CONSTANTS.c * CONSTANTS.c);
            F *= relativisticFactor;
        }
        
        const acceleration = F / object.massKg;
        
        return {
            x: acceleration * dx / r,
            y: acceleration * dy / r
        };
    }

    rungeKutta4(object, dt, acceleration) {
        const pos = { ...object.position };
        const vel = { ...object.velocity };
        
        // k1
        const k1v = acceleration;
        const k1p = vel;
        
        // k2
        const pos2 = {
            x: pos.x + k1p.x * dt / 2,
            y: pos.y + k1p.y * dt / 2
        };
        const vel2 = {
            x: vel.x + k1v.x * dt / 2,
            y: vel.y + k1v.y * dt / 2
        };
        const r2 = this.getDistance(pos2, this.blackHole.position);
        const k2v = this.calculateAcceleration({ position: pos2, velocity: vel2, massKg: object.massKg }, r2);
        const k2p = vel2;
        
        // k3
        const pos3 = {
            x: pos.x + k2p.x * dt / 2,
            y: pos.y + k2p.y * dt / 2
        };
        const vel3 = {
            x: vel.x + k2v.x * dt / 2,
            y: vel.y + k2v.y * dt / 2
        };
        const r3 = this.getDistance(pos3, this.blackHole.position);
        const k3v = this.calculateAcceleration({ position: pos3, velocity: vel3, massKg: object.massKg }, r3);
        const k3p = vel3;
        
        // k4
        const pos4 = {
            x: pos.x + k3p.x * dt,
            y: pos.y + k3p.y * dt
        };
        const vel4 = {
            x: vel.x + k3v.x * dt,
            y: vel.y + k3v.y * dt
        };
        const r4 = this.getDistance(pos4, this.blackHole.position);
        const k4v = this.calculateAcceleration({ position: pos4, velocity: vel4, massKg: object.massKg }, r4);
        const k4p = vel4;
        
        // Actualizar posición y velocidad
        object.position.x += (k1p.x + 2 * k2p.x + 2 * k3p.x + k4p.x) * dt / 6;
        object.position.y += (k1p.y + 2 * k2p.y + 2 * k3p.y + k4p.y) * dt / 6;
        object.velocity.x += (k1v.x + 2 * k2v.x + 2 * k3v.x + k4v.x) * dt / 6;
        object.velocity.y += (k1v.y + 2 * k2v.y + 2 * k3v.y + k4v.y) * dt / 6;
    }

    applyRelativisticEffects(object, r) {
        // Dilatación temporal
        const rs = this.blackHole.schwarzschildRadius;
        const v = Math.sqrt(object.velocity.x ** 2 + object.velocity.y ** 2);
        const gamma = 1 / Math.sqrt(1 - v * v / (CONSTANTS.c * CONSTANTS.c));
        const gravitationalTimeDilation = Math.sqrt(1 - rs / r);
        
        object.timeDilation = gamma * gravitationalTimeDilation;
        
        // Corrimiento al rojo gravitacional
        object.redshift = 1 / gravitationalTimeDilation - 1;
        
        // Precesión del perihelio (aproximación)
        if (object.orbitalParameters) {
            const precessionRate = 3 * CONSTANTS.G * this.blackHole.massKg * rs / 
                                 (r * r * CONSTANTS.c * CONSTANTS.c);
            object.orbitalParameters.precession += precessionRate * this.timeStep;
        }
    }

    updateOrbitalProperties(object) {
        const r = this.getDistance(object.position, this.blackHole.position);
        const v = Math.sqrt(object.velocity.x ** 2 + object.velocity.y ** 2);
        
        // Energía específica
        const E = 0.5 * v * v - CONSTANTS.G * this.blackHole.massKg / r;
        
        // Momento angular específico
        const rx = object.position.x - this.blackHole.position.x;
        const ry = object.position.y - this.blackHole.position.y;
        const L = rx * object.velocity.y - ry * object.velocity.x;
        
        // Parámetros orbitales
        const a = -CONSTANTS.G * this.blackHole.massKg / (2 * E); // Semi-eje mayor
        const e = Math.sqrt(1 + 2 * E * L * L / (CONSTANTS.G * CONSTANTS.G * this.blackHole.massKg * this.blackHole.massKg)); // Excentricidad
        
        object.orbitalParameters = {
            semiMajorAxis: a,
            eccentricity: e,
            energy: E,
            angularMomentum: L,
            apoastro: a * (1 + e),
            periastro: a * (1 - e),
            period: 2 * Math.PI * Math.sqrt(a * a * a / (CONSTANTS.G * this.blackHole.massKg)),
            precession: object.orbitalParameters ? object.orbitalParameters.precession : 0
        };
    }

    calculateOrbitalVelocity(radius) {
        return Math.sqrt(CONSTANTS.G * this.blackHole.massKg / radius);
    }

    calculateEscapeVelocity(radius) {
        return Math.sqrt(2 * CONSTANTS.G * this.blackHole.massKg / radius);
    }

    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    calculateTidalForce(object, r) {
        // Fuerza de marea (diferencial gravitacional)
        const tidalGradient = 2 * CONSTANTS.G * this.blackHole.massKg / (r * r * r);
        return tidalGradient * object.radius;
    }

    // Lente gravitacional simplificada
    calculateLensingAngle(impactParameter) {
        // Ángulo de deflexión de Einstein
        return 4 * CONSTANTS.G * this.blackHole.massKg / (impactParameter * CONSTANTS.c * CONSTANTS.c);
    }

    clear() {
        this.objects = [];
    }
}

class BlackHole {
    constructor(solarMasses, position) {
        this.mass = solarMasses; // En masas solares
        this.massKg = solarMasses * CONSTANTS.SOLAR_MASS;
        this.position = position;
        this.updateProperties();
    }

    updateProperties() {
        // Radio de Schwarzschild
        this.schwarzschildRadius = 2 * CONSTANTS.G * this.massKg / (CONSTANTS.c * CONSTANTS.c);
        
        // Radio de la órbita circular estable más interna (ISCO)
        this.iscoRadius = 3 * this.schwarzschildRadius;
        
        // Radio del disco de acreción
        this.accretionDiskRadius = 10 * this.schwarzschildRadius;
        
        // Temperatura del disco de acreción (aproximación)
        this.diskTemperature = 6e7 / Math.pow(this.mass, 0.25); // Kelvin
        
        // Luminosidad de Eddington
        this.eddingtonLuminosity = 1.26e31 * this.mass; // Watts
    }
}

class SpaceObject {
    constructor(type, position, velocity, mass) {
        this.id = Date.now() + Math.random();
        this.type = type;
        this.position = { ...position };
        this.velocity = { ...velocity };
        this.trail = [];
        this.absorbed = false;
        this.absorptionTime = 0;
        
        // Propiedades según el tipo
        switch (type) {
            case 'planet':
                this.mass = mass || 1; // Masas terrestres
                this.massKg = this.mass * CONSTANTS.EARTH_MASS;
                this.radius = 6371000 * Math.pow(this.mass, 0.33); // metros
                this.color = '#4A90E2';
                this.name = 'Planeta';
                break;
            case 'star':
                this.mass = mass || 1; // Masas solares
                this.massKg = this.mass * CONSTANTS.SOLAR_MASS;
                this.radius = 696340000 * Math.pow(this.mass, 0.8); // metros
                this.color = '#FFD700';
                this.name = 'Estrella';
                break;
            case 'asteroid':
                this.mass = mass || 1e-12; // Masas terrestres
                this.massKg = this.mass * CONSTANTS.EARTH_MASS;
                this.radius = 100000; // metros
                this.color = '#8B7355';
                this.name = 'Asteroide';
                break;
            case 'neutron':
                this.mass = mass || 1.4; // Masas solares
                this.massKg = this.mass * CONSTANTS.SOLAR_MASS;
                this.radius = 10000; // metros (10 km)
                this.color = '#E0E0FF';
                this.name = 'Estrella de Neutrones';
                break;
        }
        
        this.timeDilation = 1;
        this.redshift = 0;
        this.orbitalParameters = null;
    }

    updateTrail(maxLength) {
        this.trail.push({ ...this.position });
        if (this.trail.length > maxLength) {
            this.trail.shift();
        }
    }

    getInfo() {
        const info = {
            'Tipo': this.name,
            'Masa': this.type === 'star' || this.type === 'neutron' ? 
                     `${this.mass.toFixed(2)} M☉` : 
                     `${this.mass.toFixed(2)} M⊕`,
            'Velocidad': `${(Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2) / 1000).toFixed(1)} km/s`,
            'Dilatación temporal': `${(1 / this.timeDilation).toFixed(6)}`,
            'Corrimiento al rojo': `${this.redshift.toFixed(6)}`
        };
        
        if (this.orbitalParameters && this.orbitalParameters.eccentricity < 1) {
            info['Período orbital'] = `${(this.orbitalParameters.period / (365.25 * 24 * 3600)).toFixed(2)} años`;
            info['Excentricidad'] = this.orbitalParameters.eccentricity.toFixed(4);
            info['Precesión'] = `${(this.orbitalParameters.precession * 180 / Math.PI).toFixed(2)}°`;
        }
        
        return info;
    }
}
