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
            // Calcular aceleraciones iniciales
            const accelerations = this.objects.map(() => ({ x: 0, y: 0 }));

            // Aceleración debida al agujero negro
            this.objects.forEach((object, i) => {
                if (object.absorbed) return;
                const acc = this.calculateBlackHoleAcceleration(object);
                accelerations[i].x += acc.x;
                accelerations[i].y += acc.y;
            });

            // Interacciones gravitacionales entre objetos
            for (let i = 0; i < this.objects.length; i++) {
                const obj1 = this.objects[i];
                if (obj1.absorbed) continue;
                for (let j = i + 1; j < this.objects.length; j++) {
                    const obj2 = this.objects[j];
                    if (obj2.absorbed) continue;

                    const dx = obj2.position.x - obj1.position.x;
                    const dy = obj2.position.y - obj1.position.y;
                    const r = Math.sqrt(dx * dx + dy * dy);
                    if (r === 0) continue;

                    const F = CONSTANTS.G * obj1.massKg * obj2.massKg / (r * r);
                    const ax = F * dx / r;
                    const ay = F * dy / r;

                    accelerations[i].x += ax / obj1.massKg;
                    accelerations[i].y += ay / obj1.massKg;
                    accelerations[j].x -= ax / obj2.massKg;
                    accelerations[j].y -= ay / obj2.massKg;
                }
            }

            // Actualizar velocidad y posición
            this.objects.forEach((object, i) => {
                if (object.absorbed) return;
                object.velocity.x += accelerations[i].x * subDt;
                object.velocity.y += accelerations[i].y * subDt;
                object.position.x += object.velocity.x * subDt;
                object.position.y += object.velocity.y * subDt;
            });

            // Verificar absorción por el agujero negro
            this.objects.forEach(object => {
                if (object.absorbed) return;
                const r = this.getDistance(object.position, this.blackHole.position);
                if (r < this.blackHole.schwarzschildRadius) {
                    object.absorbed = true;
                    object.absorptionTime = 1.0;
                    this.blackHole.mass += object.massKg / CONSTANTS.SOLAR_MASS;
                    this.blackHole.updateProperties();
                }
            });

            // Manejar colisiones entre objetos
            this.handleCollisions();

            // Actualizar efectos y propiedades
            this.objects.forEach(object => {
                if (object.absorbed) return;
                const r = this.getDistance(object.position, this.blackHole.position);
                if (this.relativistic) {
                    this.applyRelativisticEffects(object, r);
                }
                object.updateTrail(this.maxTrailLength);
                this.updateOrbitalProperties(object);
            });
        }

        // Limpiar objetos eliminados o absorbidos
        this.objects = this.objects.filter(obj => !obj.absorbed);
    }

    calculateBlackHoleAcceleration(object) {
        const dx = this.blackHole.position.x - object.position.x;
        const dy = this.blackHole.position.y - object.position.y;
        const r = Math.sqrt(dx * dx + dy * dy);

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

    handleCollisions() {
        const toRemove = new Set();

        for (let i = 0; i < this.objects.length; i++) {
            const obj1 = this.objects[i];
            if (obj1.absorbed || toRemove.has(obj1)) continue;

            for (let j = i + 1; j < this.objects.length; j++) {
                const obj2 = this.objects[j];
                if (obj2.absorbed || toRemove.has(obj2)) continue;

                const dist = this.getDistance(obj1.position, obj2.position);
                if (dist < obj1.radius + obj2.radius) {
                    // Combinar objetos conservando el momento
                    const primary = obj1.massKg >= obj2.massKg ? obj1 : obj2;
                    const secondary = primary === obj1 ? obj2 : obj1;
                    const totalMass = primary.massKg + secondary.massKg;

                    primary.velocity.x = (primary.velocity.x * primary.massKg + secondary.velocity.x * secondary.massKg) / totalMass;
                    primary.velocity.y = (primary.velocity.y * primary.massKg + secondary.velocity.y * secondary.massKg) / totalMass;
                    primary.updateMass(totalMass);

                    toRemove.add(secondary);
                }
            }
        }

        if (toRemove.size > 0) {
            this.objects = this.objects.filter(obj => !toRemove.has(obj));
        }
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

    updateMass(newMassKg) {
        this.massKg = newMassKg;
        switch (this.type) {
            case 'planet':
            case 'asteroid':
                this.mass = this.massKg / CONSTANTS.EARTH_MASS;
                this.radius = this.type === 'planet'
                    ? 6371000 * Math.pow(this.mass, 0.33)
                    : 100000;
                break;
            case 'star':
            case 'neutron':
                this.mass = this.massKg / CONSTANTS.SOLAR_MASS;
                this.radius = this.type === 'star'
                    ? 696340000 * Math.pow(this.mass, 0.8)
                    : 10000;
                break;
        }
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
