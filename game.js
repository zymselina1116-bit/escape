// ============================================================================
// THE BRIGHT ESCAPE - DREAMCORE 3D EXPLORATION
// A calm, surreal journey through luminous architectural spaces
// ============================================================================

// ============================================================================
// GLOBAL STATE
// ============================================================================

const STATE = {
    currentScene: 'main',
    transitioning: false,
    time: 0,
    camera: null,
    renderer: null,
    sceneGroups: {},
    activeScene: null,
    audioContext: null,
    audioBuffers: {},
    audioSources: {},
    currentAudioSource: null,
    keys: {},
    mouse: {
        down: false,
        x: 0,
        y: 0,
        lastX: 0,
        lastY: 0
    },
    cameraRotation: { yaw: 0, pitch: 0 },
    raycaster: new THREE.Raycaster(),
    mouseVector: new THREE.Vector2()
};

const CONFIG = {
    moveSpeed: 0.08,
    lookSpeed: 0.003,
    cameraHeight: 1.6,
    floatAmplitude: 0.05,
    floatSpeed: 0.2,
    transitionDuration: 800
};

// Scene labels for UI
const SCENE_LABELS = {
    main: 'Main Room',
    pool: 'Pool Tunnel',
    hallway: 'Hallway',
    garden: 'Garden'
};

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    setupRenderer();
    setupCamera();
    setupScenes();
    setupControls();
    setupAudio();
    animate();
}

function setupRenderer() {
    const container = document.getElementById('gameContainer');
    STATE.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
    });
    STATE.renderer.setSize(window.innerWidth, window.innerHeight);
    STATE.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    STATE.renderer.shadowMap.enabled = true;
    STATE.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    STATE.renderer.outputEncoding = THREE.sRGBEncoding;
    STATE.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    STATE.renderer.toneMappingExposure = 1.1;
    STATE.renderer.physicallyCorrectLights = true;
    container.appendChild(STATE.renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    STATE.camera.aspect = window.innerWidth / window.innerHeight;
    STATE.camera.updateProjectionMatrix();
    STATE.renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupCamera() {
    STATE.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    );
    STATE.camera.position.set(0, CONFIG.cameraHeight, 10);
    STATE.camera.lookAt(0, 1.5, 0);
}

// ============================================================================
// SCENE SETUP
// ============================================================================

function setupScenes() {
    // Create main scene container
    STATE.activeScene = new THREE.Scene();

    // Create scene groups
    STATE.sceneGroups.main = createMainRoom();
    STATE.sceneGroups.pool = createPoolTunnel();
    STATE.sceneGroups.hallway = createHallway();
    STATE.sceneGroups.garden = createGarden();

    // Add main room to scene initially
    STATE.activeScene.add(STATE.sceneGroups.main);

    // Set initial scene properties
    applySceneProperties('main');
}

function applySceneProperties(sceneName) {
    const sceneGroup = STATE.sceneGroups[sceneName];
    if (!sceneGroup || !sceneGroup.userData.properties) return;

    const props = sceneGroup.userData.properties;

    // Apply fog
    if (props.fog) {
        STATE.activeScene.fog = props.fog;
    }

    // Apply background
    if (props.background) {
        STATE.activeScene.background = props.background;
    }
}

// ============================================================================
// MAIN ROOM - European Dream Hub
// ============================================================================

function createMainRoom() {
    const group = new THREE.Group();
    group.name = 'main';

    // Lighting
    const sunlight = new THREE.DirectionalLight(0xfff4d6, 1.2);
    sunlight.position.set(30, 40, 20);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.width = 2048;
    sunlight.shadow.mapSize.height = 2048;
    sunlight.shadow.camera.left = -30;
    sunlight.shadow.camera.right = 30;
    sunlight.shadow.camera.top = 30;
    sunlight.shadow.camera.bottom = -30;
    sunlight.shadow.camera.far = 100;
    group.add(sunlight);

    const hemisphereLight = new THREE.HemisphereLight(0xfff6d8, 0xd8c6a8, 0.9);
    group.add(hemisphereLight);

    // Floor - Polished wood with high reflectivity
    const floorGeometry = new THREE.PlaneGeometry(24, 24);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xb58a64,
        roughness: 0.3,
        metalness: 0.4,
        envMapIntensity: 1.0
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(24, 24);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1.0,
        side: THREE.DoubleSide
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 14;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.receiveShadow = true;
    group.add(ceiling);

    // Walls - Soft cream with slight reflectivity
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xf3ede0,
        roughness: 0.8,
        metalness: 0.2
    });

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(24, 14, 0.3),
        wallMaterial
    );
    backWall.position.set(0, 7, -12);
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    group.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 14, 24),
        wallMaterial
    );
    leftWall.position.set(-12, 7, 0);
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 14, 24),
        wallMaterial
    );
    rightWall.position.set(12, 7, 0);
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    group.add(rightWall);

    // Front walls (with gap)
    const frontWallLeft = new THREE.Mesh(
        new THREE.BoxGeometry(9, 14, 0.3),
        wallMaterial
    );
    frontWallLeft.position.set(-7.5, 7, 12);
    frontWallLeft.receiveShadow = true;
    group.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(
        new THREE.BoxGeometry(9, 14, 0.3),
        wallMaterial
    );
    frontWallRight.position.set(7.5, 7, 12);
    frontWallRight.receiveShadow = true;
    group.add(frontWallRight);

    // Dust particles
    const dustParticles = [];
    for (let i = 0; i < 60; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.015, 6, 6),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.4
            })
        );
        particle.position.set(
            Math.random() * 20 - 10,
            Math.random() * 12 + 1,
            Math.random() * 20 - 10
        );
        particle.userData.velocity = {
            x: (Math.random() - 0.5) * 0.003,
            y: (Math.random() - 0.3) * 0.002,
            z: (Math.random() - 0.5) * 0.003
        };
        dustParticles.push(particle);
        group.add(particle);
    }

    // Portal A - Wooden double door to Hallway
    const portalA = createPortal({
        type: 'door',
        position: [0, 0, -10],
        size: [2.5, 4.5, 0.25],
        color: 0x9b6f4a,
        emissive: 0xffd6a1,
        emissiveIntensity: 0.4,
        target: 'hallway'
    });
    group.add(portalA);

    // Portal B - Glass door to Pool
    const portalB = createPortal({
        type: 'glass',
        position: [8, 0, -6],
        size: [2, 4, 0.15],
        color: 0x88ccee,
        emissive: 0xaef7ff,
        emissiveIntensity: 0.5,
        target: 'pool',
        transparent: true,
        opacity: 0.6
    });
    group.add(portalB);

    // Window portal to Garden
    const windowPortal = createPortal({
        type: 'window',
        position: [-8, 2, -6],
        size: [1.8, 3.5, 0.12],
        color: 0x99ddaa,
        emissive: 0xb9ffd0,
        emissiveIntensity: 0.45,
        target: 'garden',
        transparent: true,
        opacity: 0.65
    });
    group.add(windowPortal);

    // Store scene properties
    group.userData = {
        properties: {
            fog: new THREE.FogExp2(0xf6eed9, 0.008),
            background: new THREE.Color(0xf6eed9)
        },
        dustParticles: dustParticles,
        startPosition: new THREE.Vector3(0, CONFIG.cameraHeight, 10),
        startRotation: { yaw: 0, pitch: 0 }
    };

    return group;
}

// ============================================================================
// POOL TUNNEL
// ============================================================================

function createPoolTunnel() {
    const group = new THREE.Group();
    group.name = 'pool';

    // Lighting
    const mainLight = new THREE.DirectionalLight(0xb6faff, 1.3);
    mainLight.position.set(0, 15, -10);
    mainLight.castShadow = true;
    group.add(mainLight);

    const ambientLight = new THREE.AmbientLight(0xa0e5e0, 0.6);
    group.add(ambientLight);

    // Water floor with vertex displacement
    const waterGeometry = new THREE.PlaneGeometry(16, 60, 80, 240);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0xa5e2c8,
        roughness: 0.15,
        metalness: 0.5,
        transparent: true,
        opacity: 0.85,
        envMapIntensity: 1.2
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.05, -30);
    water.receiveShadow = true;

    // Store original positions for wave animation
    const positions = waterGeometry.attributes.position;
    const originalPositions = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
        originalPositions[i * 3] = positions.getX(i);
        originalPositions[i * 3 + 1] = positions.getY(i);
        originalPositions[i * 3 + 2] = positions.getZ(i);
    }
    water.userData.originalPositions = originalPositions;

    group.add(water);

    // Circular tunnel walls with arches
    const radius = 8;
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xa5e2c8,
        roughness: 0.3,
        metalness: 0.2
    });

    for (let z = 0; z < 60; z += 10) {
        // Create circular arch
        const segments = 24;
        for (let i = 0; i <= segments / 2; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (y > 0) { // Only upper half
                const tile = new THREE.Mesh(
                    new THREE.BoxGeometry(1.2, 1.2, 9.5),
                    wallMaterial
                );
                tile.position.set(x, y, -z);
                const lookAngle = Math.atan2(x, y);
                tile.rotation.z = -lookAngle;
                tile.receiveShadow = true;
                tile.castShadow = true;
                group.add(tile);
            }
        }

        // Floor sides
        for (let side = -1; side <= 1; side += 2) {
            const sideTile = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 2, 9.5),
                wallMaterial
            );
            sideTile.position.set(radius * side, 1, -z);
            sideTile.receiveShadow = true;
            group.add(sideTile);
        }
    }

    // Return portal
    const returnPortal = createPortal({
        type: 'circular',
        position: [0, 2, 25],
        size: [3, 3, 0.2],
        color: 0xeeffff,
        emissive: 0xf7fff5,
        emissiveIntensity: 0.6,
        target: 'main'
    });
    group.add(returnPortal);

    group.userData = {
        properties: {
            fog: new THREE.FogExp2(0xe0faf2, 0.015),
            background: new THREE.Color(0xe0faf2)
        },
        water: water,
        waterGeometry: waterGeometry,
        startPosition: new THREE.Vector3(0, CONFIG.cameraHeight, 20),
        startRotation: { yaw: Math.PI, pitch: 0 }
    };

    return group;
}

// ============================================================================
// HALLWAY
// ============================================================================

function createHallway() {
    const group = new THREE.Group();
    group.name = 'hallway';

    // Ambient lighting
    const ambientLight = new THREE.AmbientLight(0x442211, 0.3);
    group.add(ambientLight);

    // Floor - Dark reflective stone
    const floorGeometry = new THREE.PlaneGeometry(10, 80);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2b2926,
        roughness: 0.4,
        metalness: 0.3,
        envMapIntensity: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -40;
    floor.receiveShadow = true;
    group.add(floor);

    // Ceiling
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1816,
        roughness: 0.9
    });
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 80),
        ceilingMaterial
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 8, -40);
    group.add(ceiling);

    // Walls and arches
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3430,
        roughness: 0.7,
        metalness: 0.1
    });

    const lamps = [];

    for (let z = 0; z < 80; z += 6) {
        // Left wall segment
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 8, 5.5),
            wallMaterial
        );
        leftWall.position.set(-5, 4, -z);
        leftWall.receiveShadow = true;
        leftWall.castShadow = true;
        group.add(leftWall);

        // Right wall segment
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 8, 5.5),
            wallMaterial
        );
        rightWall.position.set(5, 4, -z);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        group.add(rightWall);

        // Arch top
        const archTop = new THREE.Mesh(
            new THREE.BoxGeometry(10, 0.5, 0.5),
            wallMaterial
        );
        archTop.position.set(0, 8, -z);
        archTop.receiveShadow = true;
        group.add(archTop);

        // Point lights every 8 units
        if (z % 8 === 0) {
            const lampLight = new THREE.PointLight(0xffcc85, 1.2, 15, 2);
            lampLight.position.set(-3.5, 5, -z);
            lampLight.castShadow = true;
            lampLight.shadow.mapSize.width = 512;
            lampLight.shadow.mapSize.height = 512;
            group.add(lampLight);
            lamps.push(lampLight);

            const lampLight2 = new THREE.PointLight(0xffcc85, 1.2, 15, 2);
            lampLight2.position.set(3.5, 5, -z);
            lampLight2.castShadow = true;
            group.add(lampLight2);
            lamps.push(lampLight2);

            // Visual lamp glow
            const lampGlow = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0xffcc85,
                    transparent: true,
                    opacity: 0.8
                })
            );
            lampGlow.position.copy(lampLight.position);
            group.add(lampGlow);

            const lampGlow2 = lampGlow.clone();
            lampGlow2.position.copy(lampLight2.position);
            group.add(lampGlow2);
        }
    }

    // Return portal
    const returnPortal = createPortal({
        type: 'door',
        position: [0, 0, 35],
        size: [2.5, 4.5, 0.25],
        color: 0x9b6f4a,
        emissive: 0xffdd99,
        emissiveIntensity: 0.5,
        target: 'main'
    });
    group.add(returnPortal);

    group.userData = {
        properties: {
            fog: new THREE.FogExp2(0x1a1a1a, 0.03),
            background: new THREE.Color(0x1a1a1a)
        },
        lamps: lamps,
        startPosition: new THREE.Vector3(0, CONFIG.cameraHeight, 30),
        startRotation: { yaw: Math.PI, pitch: 0 }
    };

    return group;
}

// ============================================================================
// GARDEN ROOM
// ============================================================================

function createGarden() {
    const group = new THREE.Group();
    group.name = 'garden';

    // Lighting
    const sunlight = new THREE.DirectionalLight(0xfff5cc, 1.1);
    sunlight.position.set(20, 25, -10);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.width = 2048;
    sunlight.shadow.mapSize.height = 2048;
    group.add(sunlight);

    const hemisphereLight = new THREE.HemisphereLight(0xfff6d8, 0xc9f1a8, 0.85);
    group.add(hemisphereLight);

    // Grass floor
    const grassGeometry = new THREE.PlaneGeometry(25, 25, 50, 50);
    const grassMaterial = new THREE.MeshStandardMaterial({
        color: 0xa7d19c,
        roughness: 0.8,
        metalness: 0.0
    });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;

    // Store original positions for grass wave
    const grassPositions = grassGeometry.attributes.position;
    const grassOriginal = new Float32Array(grassPositions.count * 3);
    for (let i = 0; i < grassPositions.count; i++) {
        grassOriginal[i * 3] = grassPositions.getX(i);
        grassOriginal[i * 3 + 1] = grassPositions.getY(i);
        grassOriginal[i * 3 + 2] = grassPositions.getZ(i);
    }
    grass.userData.originalPositions = grassOriginal;

    group.add(grass);

    // Glass roof panels
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        metalness: 0.5,
        side: THREE.DoubleSide
    });

    const roofHeight = 10;
    const panelCount = 5;
    for (let i = 0; i < panelCount; i++) {
        const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 25),
            glassMaterial
        );
        panel.position.set((i - panelCount / 2) * 5 + 2.5, roofHeight, 0);
        panel.rotation.x = -Math.PI / 6;
        group.add(panel);
    }

    // Glass walls
    const wallHeight = 10;
    const glassWalls = [
        { pos: [0, wallHeight / 2, -12.5], size: [25, wallHeight, 0.1] },
        { pos: [-12.5, wallHeight / 2, 0], size: [0.1, wallHeight, 25] },
        { pos: [12.5, wallHeight / 2, 0], size: [0.1, wallHeight, 25] }
    ];

    glassWalls.forEach(wall => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(...wall.size),
            glassMaterial
        );
        mesh.position.set(...wall.pos);
        group.add(mesh);
    });

    // Plants and flowers
    const plants = [];
    const flowers = [];

    for (let i = 0; i < 20; i++) {
        // Pot
        const pot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.2, 0.4, 8),
            new THREE.MeshStandardMaterial({
                color: 0x8b6f47,
                roughness: 0.8
            })
        );
        pot.position.set(
            Math.random() * 20 - 10,
            Math.random() * 1.5 + 2,
            Math.random() * 20 - 10
        );
        pot.castShadow = true;
        group.add(pot);
        plants.push(pot);

        // Flower
        const flowerColors = [0xff6b9d, 0xffd93d, 0xff8c42, 0xa8e6cf, 0xc77dff];
        const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshStandardMaterial({
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                roughness: 0.5,
                emissive: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                emissiveIntensity: 0.1
            })
        );
        flower.position.copy(pot.position);
        flower.position.y += 0.35;
        flower.castShadow = true;
        flower.userData.baseY = flower.position.y;
        flower.userData.offset = Math.random() * Math.PI * 2;
        flowers.push(flower);
        group.add(flower);
    }

    // Floating particles (pollen/light)
    const particles = [];
    for (let i = 0; i < 40; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 6, 6),
            new THREE.MeshBasicMaterial({
                color: 0xfffacd,
                transparent: true,
                opacity: 0.7
            })
        );
        particle.position.set(
            Math.random() * 20 - 10,
            Math.random() * 8 + 1,
            Math.random() * 20 - 10
        );
        particle.userData.velocity = {
            x: (Math.random() - 0.5) * 0.004,
            y: (Math.random() - 0.3) * 0.003,
            z: (Math.random() - 0.5) * 0.004
        };
        particles.push(particle);
        group.add(particle);
    }

    // Return portal
    const returnPortal = createPortal({
        type: 'glass',
        position: [0, 0, -10],
        size: [2, 4, 0.15],
        color: 0xeeffdd,
        emissive: 0xfffbe1,
        emissiveIntensity: 0.55,
        target: 'main',
        transparent: true,
        opacity: 0.65
    });
    group.add(returnPortal);

    group.userData = {
        properties: {
            fog: new THREE.FogExp2(0xe7f8e9, 0.012),
            background: new THREE.Color(0xe7f8e9)
        },
        grass: grass,
        grassGeometry: grassGeometry,
        flowers: flowers,
        particles: particles,
        startPosition: new THREE.Vector3(0, CONFIG.cameraHeight, -5),
        startRotation: { yaw: 0, pitch: 0 }
    };

    return group;
}

// ============================================================================
// PORTAL CREATION HELPER
// ============================================================================

function createPortal(options) {
    const {
        type,
        position,
        size,
        color,
        emissive,
        emissiveIntensity,
        target,
        transparent = false,
        opacity = 1.0
    } = options;

    const group = new THREE.Group();
    group.name = 'portal_' + target;

    // Portal frame material
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: emissiveIntensity,
        roughness: 0.4,
        metalness: 0.3,
        transparent: transparent,
        opacity: opacity
    });

    let portalMesh;

    if (type === 'circular') {
        // Circular portal frame
        portalMesh = new THREE.Mesh(
            new THREE.TorusGeometry(size[0] / 2, 0.2, 16, 32),
            frameMaterial
        );
        portalMesh.position.y = size[1];
    } else {
        // Rectangular portal
        portalMesh = new THREE.Mesh(
            new THREE.BoxGeometry(...size),
            frameMaterial
        );
        portalMesh.position.y = size[1] / 2;
    }

    portalMesh.castShadow = true;
    portalMesh.receiveShadow = true;
    group.add(portalMesh);

    // Glow halo
    const glowSize = type === 'circular'
        ? [size[0] + 0.3, size[1] + 0.3, size[2] + 0.1]
        : [size[0] + 0.3, size[1] + 0.3, size[2] + 0.1];

    const glowMaterial = new THREE.MeshBasicMaterial({
        color: emissive,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
    });

    let glow;
    if (type === 'circular') {
        glow = new THREE.Mesh(
            new THREE.TorusGeometry(glowSize[0] / 2, 0.25, 16, 32),
            glowMaterial
        );
        glow.position.y = size[1];
    } else {
        glow = new THREE.Mesh(
            new THREE.BoxGeometry(...glowSize),
            glowMaterial
        );
        glow.position.y = size[1] / 2;
    }

    group.add(glow);

    group.position.set(...position);
    group.userData = {
        target: target,
        portalMesh: portalMesh,
        glow: glow,
        baseEmissive: emissiveIntensity,
        interactive: true
    };

    return group;
}

// ============================================================================
// CONTROLS
// ============================================================================

function setupControls() {
    const canvas = STATE.renderer.domElement;

    // Keyboard
    window.addEventListener('keydown', (e) => {
        STATE.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
        STATE.keys[e.key.toLowerCase()] = false;
    });

    // Mouse drag for camera rotation
    canvas.addEventListener('mousedown', (e) => {
        STATE.mouse.down = true;
        STATE.mouse.lastX = e.clientX;
        STATE.mouse.lastY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        STATE.mouse.down = false;
    });

    window.addEventListener('mousemove', (e) => {
        if (STATE.mouse.down) {
            const deltaX = e.clientX - STATE.mouse.lastX;
            const deltaY = e.clientY - STATE.mouse.lastY;

            STATE.cameraRotation.yaw -= deltaX * CONFIG.lookSpeed;
            STATE.cameraRotation.pitch -= deltaY * CONFIG.lookSpeed;

            // Clamp pitch
            STATE.cameraRotation.pitch = Math.max(
                -Math.PI / 2.5,
                Math.min(Math.PI / 2.5, STATE.cameraRotation.pitch)
            );

            STATE.mouse.lastX = e.clientX;
            STATE.mouse.lastY = e.clientY;
        }

        // Update mouse vector for raycasting (normalized device coordinates)
        STATE.mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
        STATE.mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Click for portal interaction
    canvas.addEventListener('click', (e) => {
        if (!STATE.mouse.down) {
            checkPortalClick(e);
        }
    });

    // Scroll zoom (reversed)
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY * 0.001;
        STATE.camera.fov = Math.max(30, Math.min(90, STATE.camera.fov + zoomDelta * 10));
        STATE.camera.updateProjectionMatrix();
    }, { passive: false });
}

function updateControls() {
    // WASD movement
    const moveVector = new THREE.Vector3();

    if (STATE.keys['w']) moveVector.z -= 1;
    if (STATE.keys['s']) moveVector.z += 1;
    if (STATE.keys['a']) moveVector.x -= 1;
    if (STATE.keys['d']) moveVector.x += 1;

    if (moveVector.length() > 0) {
        moveVector.normalize().multiplyScalar(CONFIG.moveSpeed);

        // Rotate by camera yaw
        const rotated = moveVector.applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            STATE.cameraRotation.yaw
        );

        STATE.camera.position.x += rotated.x;
        STATE.camera.position.z += rotated.z;
    }

    // Floating camera animation
    const floatOffset = Math.sin(STATE.time * CONFIG.floatSpeed) * CONFIG.floatAmplitude;
    STATE.camera.position.y = CONFIG.cameraHeight + floatOffset;

    // Update camera orientation
    const direction = new THREE.Vector3(
        Math.sin(STATE.cameraRotation.yaw) * Math.cos(STATE.cameraRotation.pitch),
        Math.sin(STATE.cameraRotation.pitch),
        -Math.cos(STATE.cameraRotation.yaw) * Math.cos(STATE.cameraRotation.pitch)
    );

    const lookTarget = new THREE.Vector3().addVectors(STATE.camera.position, direction);
    STATE.camera.lookAt(lookTarget);
}

function checkPortalClick(event) {
    if (STATE.transitioning) return;

    // Update raycaster
    STATE.mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
    STATE.mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;

    STATE.raycaster.setFromCamera(STATE.mouseVector, STATE.camera);

    // Find all portal meshes in current scene
    const portals = [];
    const currentGroup = STATE.sceneGroups[STATE.currentScene];

    currentGroup.traverse((obj) => {
        if (obj.parent && obj.parent.userData.interactive) {
            portals.push(obj);
        }
    });

    const intersects = STATE.raycaster.intersectObjects(portals, false);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const portal = clickedObject.parent;

        if (portal.userData.target) {
            transitionToScene(portal.userData.target);
        }
    }
}

// ============================================================================
// SCENE TRANSITIONS
// ============================================================================

function transitionToScene(targetScene) {
    if (STATE.transitioning || !STATE.sceneGroups[targetScene]) return;
    if (targetScene === STATE.currentScene) return;

    STATE.transitioning = true;

    const overlay = document.getElementById('fadeOverlay');
    const sceneLabel = document.getElementById('sceneLabel');

    // Fade to white
    overlay.style.opacity = '1';

    setTimeout(() => {
        // Remove old scene
        STATE.activeScene.remove(STATE.sceneGroups[STATE.currentScene]);

        // Add new scene
        STATE.currentScene = targetScene;
        STATE.activeScene.add(STATE.sceneGroups[targetScene]);

        // Apply scene properties
        applySceneProperties(targetScene);

        // Reset camera
        const sceneData = STATE.sceneGroups[targetScene].userData;
        if (sceneData.startPosition) {
            STATE.camera.position.copy(sceneData.startPosition);
        }
        if (sceneData.startRotation) {
            STATE.cameraRotation.yaw = sceneData.startRotation.yaw;
            STATE.cameraRotation.pitch = sceneData.startRotation.pitch;
        }

        // Update UI
        sceneLabel.textContent = SCENE_LABELS[targetScene] || targetScene;

        // Audio transition
        playSceneAudio(targetScene);

        // Fade back in
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                STATE.transitioning = false;
            }, 500);
        }, 100);

    }, CONFIG.transitionDuration / 2);
}

// ============================================================================
// AUDIO SYSTEM
// ============================================================================

function setupAudio() {
    try {
        STATE.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Placeholder audio paths
        STATE.audioBuffers = {
            main: 'assets/audio/main.mp3',
            pool: 'assets/audio/pool.mp3',
            hallway: 'assets/audio/hallway.mp3',
            garden: 'assets/audio/garden.mp3'
        };

        // Note: In production, you would load actual audio buffers here
        console.log('Audio system initialized (placeholder mode)');
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function playSceneAudio(sceneName) {
    // Placeholder for audio cross-fade
    // In production, this would:
    // 1. Fade out current audio source over 0.5s
    // 2. Start new audio source at volume 0
    // 3. Fade in new audio source over 0.5s
    // 4. Loop audio indefinitely at low volume (0.3-0.4)

    console.log(`Audio transition: ${sceneName} (${STATE.audioBuffers[sceneName]})`);
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

function animate() {
    requestAnimationFrame(animate);

    STATE.time += 0.016; // ~60fps

    updateControls();
    updateSceneAnimations();

    STATE.renderer.render(STATE.activeScene, STATE.camera);
}

function updateSceneAnimations() {
    const currentGroup = STATE.sceneGroups[STATE.currentScene];
    if (!currentGroup) return;

    const userData = currentGroup.userData;

    // Main room - dust particles
    if (STATE.currentScene === 'main' && userData.dustParticles) {
        userData.dustParticles.forEach(particle => {
            particle.position.x += particle.userData.velocity.x;
            particle.position.y += particle.userData.velocity.y;
            particle.position.z += particle.userData.velocity.z;

            // Boundaries
            if (Math.abs(particle.position.x) > 11) particle.userData.velocity.x *= -1;
            if (particle.position.y < 0.5 || particle.position.y > 13) particle.userData.velocity.y *= -1;
            if (Math.abs(particle.position.z) > 11) particle.userData.velocity.z *= -1;
        });
    }

    // Pool - water ripples
    if (STATE.currentScene === 'pool' && userData.water) {
        const positions = userData.waterGeometry.attributes.position;
        const original = userData.water.userData.originalPositions;

        for (let i = 0; i < positions.count; i++) {
            const x = original[i * 3];
            const y = original[i * 3 + 1];

            const wave1 = Math.sin(x * 0.5 + STATE.time * 0.8) * 0.06;
            const wave2 = Math.sin(y * 0.3 + STATE.time * 0.6) * 0.05;
            const wave3 = Math.sin((x + y) * 0.2 + STATE.time) * 0.04;

            positions.setZ(i, wave1 + wave2 + wave3);
        }
        positions.needsUpdate = true;
    }

    // Hallway - flickering lamps
    if (STATE.currentScene === 'hallway' && userData.lamps) {
        userData.lamps.forEach((lamp, index) => {
            const flicker = Math.sin(STATE.time * 8 + index * 0.5) * 0.15 + 0.85;
            lamp.intensity = 1.2 * flicker;
        });
    }

    // Garden - swaying flowers and grass
    if (STATE.currentScene === 'garden') {
        if (userData.flowers) {
            userData.flowers.forEach(flower => {
                const sway = Math.sin(STATE.time * 1.5 + flower.userData.offset) * 0.06;
                flower.position.y = flower.userData.baseY + sway;
                flower.rotation.x = sway * 0.3;
            });
        }

        if (userData.grass) {
            const positions = userData.grassGeometry.attributes.position;
            const original = userData.grass.userData.originalPositions;

            for (let i = 0; i < positions.count; i++) {
                const x = original[i * 3];
                const y = original[i * 3 + 1];

                const wave = Math.sin(x * 0.3 + STATE.time * 0.5) * 0.02 +
                            Math.sin(y * 0.4 + STATE.time * 0.7) * 0.02;

                positions.setZ(i, wave);
            }
            positions.needsUpdate = true;
        }

        if (userData.particles) {
            userData.particles.forEach(particle => {
                particle.position.x += particle.userData.velocity.x;
                particle.position.y += particle.userData.velocity.y;
                particle.position.z += particle.userData.velocity.z;

                if (Math.abs(particle.position.x) > 12) particle.userData.velocity.x *= -1;
                if (particle.position.y < 0.5 || particle.position.y > 9) particle.userData.velocity.y *= -1;
                if (Math.abs(particle.position.z) > 12) particle.userData.velocity.z *= -1;
            });
        }
    }

    // Animate all portal glows (pulsing effect)
    currentGroup.traverse((obj) => {
        if (obj.parent && obj.parent.userData.glow) {
            const portal = obj.parent;
            const pulse = Math.sin(STATE.time * 1.5) * 0.3 + 0.7;

            if (portal.userData.glow) {
                portal.userData.glow.material.opacity = 0.25 * pulse;
            }

            if (portal.userData.portalMesh && portal.userData.baseEmissive) {
                portal.userData.portalMesh.material.emissiveIntensity =
                    portal.userData.baseEmissive * pulse;
            }
        }
    });
}

// ============================================================================
// START
// ============================================================================

window.addEventListener('DOMContentLoaded', init);
