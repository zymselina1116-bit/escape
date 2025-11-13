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
    keysCollected: {
        main: false,
        pool: false,
        hallway: false,
        garden: false
    },
    victoryShown: false,
    mouse: {
        down: false,
        x: 0,
        y: 0,
        lastX: 0,
        lastY: 0
    },
    cameraRotation: { yaw: 0, pitch: 0 },
    raycaster: new THREE.Raycaster(),
    mouseVector: new THREE.Vector2(),
    webcam: {
        video: null,
        canvas: null,
        context: null,
        enabled: false,
        motionX: 0,
        motionY: 0,
        motionStrength: 0,
        handX: 0,
        handY: 0,
        handZ: 0,
        isPinching: false,
        pinchStrength: 0
    },
    virtualHand: null,
    grabbedOrb: null,
    handTrail: [],
    firstPersonHands: null,
    firstPersonBody: null,
    leftHand: null,
    rightHand: null,
    grabbedKey: null,
    nearestDoorHandle: null,
    handleRotation: 0
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
    garden: 'Garden',
    star: 'Star Space'
};

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    setupRenderer();
    setupCamera();
    createFirstPersonView();
    setupScenes();
    setupControls();
    setupAudio();
    setupWebcam();
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
// FIRST-PERSON VIEW (Hands + Body)
// ============================================================================

function createFirstPersonView() {
    const fpGroup = new THREE.Group();
    fpGroup.name = 'firstPersonView';

    // Cartoon hand material - soft glowing
    const handMaterial = new THREE.MeshToonMaterial({
        color: 0xffdbac,
        emissive: 0xffd699,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.95
    });

    // Left Hand
    STATE.leftHand = createCartoonHand('left', handMaterial);
    STATE.leftHand.position.set(-0.3, -0.4, -0.6);
    fpGroup.add(STATE.leftHand);

    // Right Hand
    STATE.rightHand = createCartoonHand('right', handMaterial);
    STATE.rightHand.position.set(0.3, -0.4, -0.6);
    fpGroup.add(STATE.rightHand);

    // Lower body (torso bottom)
    const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.35, 0.6, 16);
    const bodyMaterial = new THREE.MeshToonMaterial({
        color: 0x88aacc,
        emissive: 0x6688aa,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.9
    });
    STATE.firstPersonBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    STATE.firstPersonBody.position.set(0, -0.9, -0.3);
    fpGroup.add(STATE.firstPersonBody);

    // Attach to camera
    STATE.camera.add(fpGroup);
    STATE.firstPersonHands = fpGroup;
}

function createCartoonHand(side, material) {
    const hand = new THREE.Group();

    // Palm
    const palmGeometry = new THREE.SphereGeometry(0.08, 12, 12);
    const palm = new THREE.Mesh(palmGeometry, material.clone());
    palm.scale.set(1, 0.8, 1.2);
    hand.add(palm);

    // Arm (short forearm)
    const armGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.3, 12);
    const arm = new THREE.Mesh(armGeometry, material.clone());
    arm.position.set(0, 0.15, -0.05);
    arm.rotation.x = Math.PI / 6;
    hand.add(arm);

    // Fingers (simplified)
    const fingers = [];
    const fingerPositions = [
        { x: -0.05, y: 0, z: 0.08 },  // Index
        { x: 0, y: 0, z: 0.09 },      // Middle
        { x: 0.05, y: 0, z: 0.08 },   // Ring
        { x: side === 'left' ? 0.07 : -0.07, y: 0, z: 0.02 }  // Thumb
    ];

    fingerPositions.forEach((pos, i) => {
        const fingerGroup = new THREE.Group();

        // Finger segments
        for (let j = 0; j < 2; j++) {
            const segment = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8),
                material.clone()
            );
            segment.position.y = j * 0.04;
            segment.rotation.x = Math.PI / 2;
            fingerGroup.add(segment);
        }

        fingerGroup.position.set(pos.x, pos.y, pos.z);
        fingers.push(fingerGroup);
        hand.add(fingerGroup);
    });

    hand.userData = {
        palm: palm,
        arm: arm,
        fingers: fingers,
        closedAmount: 0,
        side: side
    };

    return hand;
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
    STATE.sceneGroups.star = createStarSpace();

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

    // Window portal to Star Space
    const starWindow = createPortal({
        type: 'window',
        position: [8, 2.5, 7],
        size: [1.5, 3, 0.12],
        color: 0x6688cc,
        emissive: 0x99ddff,
        emissiveIntensity: 0.6,
        target: 'star',
        transparent: true,
        opacity: 0.7
    });
    group.add(starWindow);

    // Collectible key on desk
    const mainKey = createKey({
        position: [-2, 1, -3],
        scene: 'main'
    });
    group.add(mainKey);

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

    // Collectible key floating above water
    const poolKey = createKey({
        position: [0, 1, -15],
        scene: 'pool'
    });
    group.add(poolKey);

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

    // Collectible key between arches
    const hallwayKey = createKey({
        position: [0, 2, -25],
        scene: 'hallway'
    });
    group.add(hallwayKey);

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

    // Collectible key near center of grass
    const gardenKey = createKey({
        position: [0, 1, 0],
        scene: 'garden'
    });
    group.add(gardenKey);

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
// STAR SPACE - Quiet Galaxy Field
// ============================================================================

function createStarSpace() {
    const group = new THREE.Group();
    group.name = 'star';

    // Lighting - cool blue ambient
    const ambientLight = new THREE.AmbientLight(0x8ac7ff, 0.5);
    group.add(ambientLight);

    // Directional rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, 10, 10);
    group.add(rimLight);

    // Add some additional point lights for atmosphere
    const colors = [0x99ddff, 0x88ccff, 0xaaeeff];
    for (let i = 0; i < 5; i++) {
        const light = new THREE.PointLight(colors[i % colors.length], 0.3, 30);
        light.position.set(
            Math.random() * 40 - 20,
            Math.random() * 20 - 10,
            Math.random() * 40 - 20
        );
        group.add(light);
    }

    // Floating glowing particles (100 total)
    const particles = [];
    for (let i = 0; i < 100; i++) {
        const size = Math.random() * 0.15 + 0.05;
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(size, 8, 8),
            new THREE.MeshStandardMaterial({
                color: 0x99ddff,
                emissive: 0x99ddff,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.8
            })
        );

        particle.position.set(
            Math.random() * 40 - 20,
            Math.random() * 40 - 20,
            Math.random() * 40 - 20
        );

        // Store original position and random phase
        particle.userData.originalPos = particle.position.clone();
        particle.userData.phase = Math.random() * Math.PI * 2;
        particle.userData.speed = Math.random() * 0.3 + 0.1;
        particle.userData.radius = Math.random() * 2 + 1;

        particles.push(particle);
        group.add(particle);
    }

    // Central glowing key
    const centralKey = createKey({
        position: [0, 0, 0],
        scene: 'star',
        color: 0xffd700,
        emissive: 0xffe38a,
        isCentral: true
    });
    group.add(centralKey);

    // Return portal (glowing door back to main)
    const returnPortal = createPortal({
        type: 'circular',
        position: [0, 0, 15],
        size: [3, 3, 0.2],
        color: 0x6688cc,
        emissive: 0x99ddff,
        emissiveIntensity: 0.7,
        target: 'main'
    });
    group.add(returnPortal);

    // Create virtual hand
    const virtualHand = createVirtualHand();
    virtualHand.visible = false; // Initially hidden until webcam detects motion
    group.add(virtualHand);

    group.userData = {
        properties: {
            fog: new THREE.FogExp2(0x0c0e26, 0.015),
            background: new THREE.Color(0x0c0e26)
        },
        particles: particles,
        centralKey: centralKey,
        virtualHand: virtualHand,
        startPosition: new THREE.Vector3(0, CONFIG.cameraHeight, 12),
        startRotation: { yaw: Math.PI, pitch: 0 }
    };

    return group;
}

// ============================================================================
// VIRTUAL HAND CREATION
// ============================================================================

function createVirtualHand() {
    const handGroup = new THREE.Group();
    handGroup.name = 'virtualHand';

    // Hand material - glowing semi-transparent
    const handMaterial = new THREE.MeshStandardMaterial({
        color: 0x99ddff,
        emissive: 0x99ddff,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
        roughness: 0.3,
        metalness: 0.2
    });

    // Palm (slightly larger sphere)
    const palm = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        handMaterial
    );
    handGroup.add(palm);

    // Glow around palm
    const palmGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 16),
        new THREE.MeshBasicMaterial({
            color: 0x99ddff,
            transparent: true,
            opacity: 0.2
        })
    );
    handGroup.add(palmGlow);

    // Create 5 fingers
    const fingers = [];
    const fingerConfigs = [
        // Thumb
        { angle: -0.6, length: 0.5, joints: 2 },
        // Index
        { angle: -0.3, length: 0.7, joints: 3 },
        // Middle
        { angle: 0, length: 0.8, joints: 3 },
        // Ring
        { angle: 0.3, length: 0.7, joints: 3 },
        // Pinky
        { angle: 0.6, length: 0.6, joints: 3 }
    ];

    fingerConfigs.forEach((config, fingerIndex) => {
        const finger = [];

        for (let i = 0; i < config.joints; i++) {
            const jointSize = 0.08 - (i * 0.015);
            const joint = new THREE.Mesh(
                new THREE.SphereGeometry(jointSize, 12, 12),
                handMaterial.clone()
            );

            // Position joints along finger
            const distance = 0.15 + (i * 0.22);
            const x = Math.sin(config.angle) * distance;
            const y = Math.cos(config.angle) * distance;

            joint.position.set(x, y, 0);

            // Store original position for animation
            joint.userData.originalPos = joint.position.clone();
            joint.userData.fingerIndex = fingerIndex;
            joint.userData.jointIndex = i;

            handGroup.add(joint);
            finger.push(joint);
        }

        fingers.push(finger);
    });

    handGroup.userData = {
        palm: palm,
        palmGlow: palmGlow,
        fingers: fingers,
        isPinching: false,
        pinchAmount: 0
    };

    return handGroup;
}

// ============================================================================
// KEY CREATION HELPER
// ============================================================================

function createKey(options) {
    const {
        position,
        scene,
        color = 0xffd700,
        emissive = 0xffe38a,
        isCentral = false
    } = options;

    const group = new THREE.Group();
    group.name = 'key_' + scene;

    // Key body (simple cylinder for handle)
    const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
        new THREE.MeshStandardMaterial({
            color: color,
            emissive: emissive,
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    handle.rotation.z = Math.PI / 2;
    group.add(handle);

    // Key head (torus)
    const head = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.02, 8, 16),
        new THREE.MeshStandardMaterial({
            color: color,
            emissive: emissive,
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    head.position.x = -0.15;
    head.rotation.y = Math.PI / 2;
    group.add(head);

    // Key teeth (small boxes)
    for (let i = 0; i < 3; i++) {
        const tooth = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.04, 0.02),
            new THREE.MeshStandardMaterial({
                color: color,
                emissive: emissive,
                emissiveIntensity: 0.6,
                metalness: 0.8,
                roughness: 0.2
            })
        );
        tooth.position.set(0.05 + i * 0.03, -0.035, 0);
        group.add(tooth);
    }

    // Glow sphere around key
    const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        new THREE.MeshBasicMaterial({
            color: emissive,
            transparent: true,
            opacity: 0.2
        })
    );
    group.add(glow);

    group.position.set(...position);
    group.userData = {
        scene: scene,
        isKey: true,
        collected: false,
        glow: glow,
        baseY: position[1],
        isCentral: isCentral
    };

    return group;
}

// ============================================================================
// DOOR HANDLE CREATION HELPER
// ============================================================================

function createDoorHandle(portalType, size) {
    const handleGroup = new THREE.Group();
    handleGroup.name = 'doorHandle';

    // Handle material - metallic and slightly glowing
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0xc9b583,
        emissive: 0xffd699,
        emissiveIntensity: 0.15,
        metalness: 0.9,
        roughness: 0.2
    });

    if (portalType === 'circular') {
        // Central handle for circular portals
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16),
            handleMaterial
        );
        handle.rotation.z = Math.PI / 2;
        handleGroup.add(handle);

        // End caps
        const cap1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 12, 12),
            handleMaterial
        );
        cap1.position.x = -0.2;
        handleGroup.add(cap1);

        const cap2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 12, 12),
            handleMaterial
        );
        cap2.position.x = 0.2;
        handleGroup.add(cap2);

        // Position at center
        handleGroup.position.set(0, 0, 0.15);

    } else {
        // Side lever handle for rectangular portals
        const leverBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12),
            handleMaterial
        );
        leverBase.rotation.x = Math.PI / 2;
        handleGroup.add(leverBase);

        const leverHandle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.25, 12),
            handleMaterial
        );
        leverHandle.position.set(0, -0.12, 0);
        leverHandle.rotation.z = Math.PI / 2;
        handleGroup.add(leverHandle);

        const leverEnd = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 12, 12),
            handleMaterial
        );
        leverEnd.position.set(0.125, -0.12, 0);
        handleGroup.add(leverEnd);

        // Position on right side of door at handle height
        const handleHeight = size[1] * 0.45; // Slightly below middle
        const handleX = size[0] * 0.35; // Right side
        handleGroup.position.set(handleX, handleHeight, size[2] / 2 + 0.08);
    }

    handleGroup.userData = {
        isHandle: true,
        rotation: 0,
        baseRotation: 0,
        canGrab: true
    };

    return handleGroup;
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

    // Add door handle
    const doorHandle = createDoorHandle(type, size);
    group.add(doorHandle);

    group.position.set(...position);
    group.userData = {
        target: target,
        portalMesh: portalMesh,
        glow: glow,
        doorHandle: doorHandle,
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

    // Find all interactive objects in current scene
    const interactiveObjects = [];
    const currentGroup = STATE.sceneGroups[STATE.currentScene];

    currentGroup.traverse((obj) => {
        // Check for portals
        if (obj.parent && obj.parent.userData.interactive) {
            interactiveObjects.push(obj);
        }
        // Check for keys
        if (obj.parent && obj.parent.userData.isKey && !obj.parent.userData.collected) {
            interactiveObjects.push(obj);
        }
    });

    const intersects = STATE.raycaster.intersectObjects(interactiveObjects, false);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const parent = clickedObject.parent;

        // Check if it's a portal
        if (parent.userData.target) {
            transitionToScene(parent.userData.target);
        }
        // Check if it's a key
        else if (parent.userData.isKey && !parent.userData.collected) {
            collectKey(parent);
        }
    }
}

// ============================================================================
// KEY COLLECTION
// ============================================================================

function collectKey(keyObject) {
    const sceneName = keyObject.userData.scene;

    // Mark as collected
    keyObject.userData.collected = true;
    STATE.keysCollected[sceneName] = true;

    // Flash effect
    const glow = keyObject.userData.glow;
    if (glow) {
        glow.material.opacity = 1.0;
        setTimeout(() => {
            if (glow.material) glow.material.opacity = 0.2;
        }, 200);
    }

    // Make key invisible after collection
    setTimeout(() => {
        keyObject.visible = false;
    }, 300);

    // Update UI
    updateKeyUI(sceneName);

    // Check victory condition
    checkVictoryCondition();

    console.log(`Collected key from ${sceneName}`);
}

function updateKeyUI(sceneName) {
    const keyElement = document.getElementById(`key-${sceneName}`);
    if (keyElement) {
        keyElement.textContent = '✓';
        keyElement.className = 'key-collected';
    }
}

function checkVictoryCondition() {
    const allKeysCollected = Object.values(STATE.keysCollected).every(collected => collected);

    if (allKeysCollected && !STATE.victoryShown) {
        STATE.victoryShown = true;
        const victoryMessage = document.getElementById('victoryMessage');
        if (victoryMessage) {
            setTimeout(() => {
                victoryMessage.classList.add('show');
            }, 500);

            setTimeout(() => {
                victoryMessage.classList.remove('show');
            }, 5000);
        }
        console.log('All keys collected! Victory!');
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
            garden: 'assets/audio/garden.mp3',
            star: 'assets/audio/star.mp3'
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
// WEBCAM SETUP & MOTION DETECTION
// ============================================================================

function setupWebcam() {
    STATE.webcam.video = document.getElementById('webcamVideo');
    STATE.webcam.canvas = document.getElementById('webcamCanvas');
    STATE.webcam.context = STATE.webcam.canvas.getContext('2d');

    // Request webcam access (optional - won't break if denied)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: { width: 160, height: 120, facingMode: 'user' }
        })
        .then(stream => {
            STATE.webcam.video.srcObject = stream;
            STATE.webcam.enabled = true;
            STATE.webcam.canvas.width = 160;
            STATE.webcam.canvas.height = 120;

            // Start motion detection loop
            requestAnimationFrame(detectMotion);

            console.log('Webcam enabled for hand interaction');
        })
        .catch(err => {
            console.log('Webcam not available or denied:', err.message);
            STATE.webcam.enabled = false;
        });
    } else {
        console.log('getUserMedia not supported');
        STATE.webcam.enabled = false;
    }
}

let previousFrameData = null;

function detectMotion() {
    if (!STATE.webcam.enabled || !STATE.webcam.video.readyState === 4) {
        requestAnimationFrame(detectMotion);
        return;
    }

    const ctx = STATE.webcam.context;
    const canvas = STATE.webcam.canvas;
    const video = STATE.webcam.video;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const currentData = currentFrame.data;

    if (previousFrameData) {
        let totalMotion = 0;
        let motionXSum = 0;
        let motionYSum = 0;
        let motionCount = 0;
        let brightSpots = 0;
        let darkSpots = 0;

        // Motion detection with brightness tracking
        for (let y = 0; y < canvas.height; y += 4) {
            for (let x = 0; x < canvas.width; x += 4) {
                const i = (y * canvas.width + x) * 4;

                // Calculate brightness
                const currentBrightness = (currentData[i] + currentData[i + 1] + currentData[i + 2]) / 3;
                const previousBrightness = (previousFrameData[i] + previousFrameData[i + 1] + previousFrameData[i + 2]) / 3;

                const diff = Math.abs(currentBrightness - previousBrightness);

                if (diff > 20) { // Threshold for motion
                    totalMotion += diff;
                    motionXSum += (x / canvas.width - 0.5) * diff;
                    motionYSum += (y / canvas.height - 0.5) * diff;
                    motionCount++;

                    // Track brightness for pinch detection
                    if (currentBrightness > 150) brightSpots++;
                    if (currentBrightness < 100) darkSpots++;
                }
            }
        }

        if (motionCount > 0) {
            // Overall hand position
            STATE.webcam.motionX = motionXSum / totalMotion;
            STATE.webcam.motionY = motionYSum / totalMotion;
            STATE.webcam.motionStrength = Math.min(totalMotion / 10000, 1.0);

            // Smooth hand position for virtual hand
            const targetX = STATE.webcam.motionX * 8;
            const targetY = -STATE.webcam.motionY * 6;
            const targetZ = STATE.webcam.motionStrength * -5;

            STATE.webcam.handX += (targetX - STATE.webcam.handX) * 0.15;
            STATE.webcam.handY += (targetY - STATE.webcam.handY) * 0.15;
            STATE.webcam.handZ += (targetZ - STATE.webcam.handZ) * 0.15;

            // Pinch detection: high motion density in small area = pinch
            const motionDensity = motionCount / ((canvas.width * canvas.height) / 16);
            const brightnessFocus = brightSpots / Math.max(1, motionCount);

            // Pinch occurs when motion is concentrated and has brightness variation
            const pinchThreshold = 0.15;
            const newPinchState = motionDensity > pinchThreshold && brightnessFocus > 0.3;

            if (newPinchState && !STATE.webcam.isPinching) {
                STATE.webcam.isPinching = true;
                STATE.webcam.pinchStrength = 1.0;
            } else if (!newPinchState && STATE.webcam.isPinching) {
                STATE.webcam.isPinching = false;
            }

            // Smooth pinch strength
            if (STATE.webcam.isPinching) {
                STATE.webcam.pinchStrength = Math.min(1.0, STATE.webcam.pinchStrength + 0.1);
            } else {
                STATE.webcam.pinchStrength = Math.max(0.0, STATE.webcam.pinchStrength - 0.1);
            }
        } else {
            STATE.webcam.motionX *= 0.9;
            STATE.webcam.motionY *= 0.9;
            STATE.webcam.motionStrength *= 0.9;
            STATE.webcam.pinchStrength *= 0.95;
        }
    }

    previousFrameData = new Uint8ClampedArray(currentData);

    requestAnimationFrame(detectMotion);
}

function applyHandInteraction() {
    // Only apply in Star Space
    if (STATE.currentScene !== 'star' || !STATE.webcam.enabled) return;

    const sceneData = STATE.sceneGroups.star.userData;
    if (!sceneData.particles || !sceneData.virtualHand) return;

    const virtualHand = sceneData.virtualHand;
    const motionStrength = STATE.webcam.motionStrength;

    // Show/hide virtual hand based on motion
    if (motionStrength > 0.05) {
        virtualHand.visible = true;
        STATE.webcam.video.classList.add('active');

        // Update hand position in world space
        const handWorldPos = new THREE.Vector3(
            STATE.camera.position.x + STATE.webcam.handX,
            STATE.camera.position.y + STATE.webcam.handY,
            STATE.camera.position.z + STATE.webcam.handZ - 3
        );

        virtualHand.position.lerp(handWorldPos, 0.2);

        // Make hand face camera
        virtualHand.lookAt(STATE.camera.position);

        // Animate fingers for pinch
        animateHandPinch(virtualHand, STATE.webcam.pinchStrength);

        // Update palm glow based on motion
        if (virtualHand.userData.palmGlow) {
            const pulse = Math.sin(STATE.time * 4) * 0.1 + 0.3;
            virtualHand.userData.palmGlow.material.opacity = pulse * motionStrength;
        }

        // Create light trail
        createHandTrail(virtualHand.position.clone());

        // Handle orb grabbing
        if (STATE.webcam.isPinching && !STATE.grabbedOrb) {
            // Try to grab nearest orb
            const nearestOrb = findNearestOrb(virtualHand.position, sceneData.particles);
            if (nearestOrb && nearestOrb.distance < 2.0) {
                STATE.grabbedOrb = nearestOrb.orb;
                STATE.grabbedOrb.userData.grabbed = true;
            }
        } else if (!STATE.webcam.isPinching && STATE.grabbedOrb) {
            // Release orb
            STATE.grabbedOrb.userData.grabbed = false;
            STATE.grabbedOrb.userData.releaseVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            STATE.grabbedOrb = null;
        }

        // Update grabbed orb position
        if (STATE.grabbedOrb) {
            const targetPos = virtualHand.position.clone();
            targetPos.x += Math.sin(STATE.time * 3) * 0.1;
            targetPos.y += Math.cos(STATE.time * 3) * 0.1;
            STATE.grabbedOrb.position.lerp(targetPos, 0.3);
        }

    } else {
        virtualHand.visible = false;
        STATE.webcam.video.classList.remove('active');

        // Release any grabbed orb
        if (STATE.grabbedOrb) {
            STATE.grabbedOrb.userData.grabbed = false;
            STATE.grabbedOrb = null;
        }
    }

    // Update trail particles
    updateHandTrail();
}

function animateHandPinch(handGroup, pinchAmount) {
    const fingers = handGroup.userData.fingers;
    if (!fingers) return;

    fingers.forEach((finger, fingerIndex) => {
        finger.forEach((joint, jointIndex) => {
            const originalPos = joint.userData.originalPos;

            // Curl fingers inward when pinching
            const curlAmount = pinchAmount * (jointIndex + 1) * 0.15;
            const targetX = originalPos.x * (1 - curlAmount);
            const targetY = originalPos.y * (1 - curlAmount * 0.5);

            joint.position.x = THREE.MathUtils.lerp(joint.position.x, targetX, 0.2);
            joint.position.y = THREE.MathUtils.lerp(joint.position.y, targetY, 0.2);

            // Enhance glow when pinching
            if (joint.material) {
                joint.material.emissiveIntensity = 0.6 + pinchAmount * 0.4;
                joint.material.opacity = 0.7 + pinchAmount * 0.2;
            }
        });
    });
}

function findNearestOrb(position, particles) {
    let nearest = null;
    let minDistance = Infinity;

    particles.forEach(particle => {
        if (particle.userData.grabbed) return;

        const dist = particle.position.distanceTo(position);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = particle;
        }
    });

    return nearest ? { orb: nearest, distance: minDistance } : null;
}

function createHandTrail(position) {
    // Add new trail point
    STATE.handTrail.push({
        position: position.clone(),
        life: 1.0,
        mesh: null
    });

    // Limit trail length
    if (STATE.handTrail.length > 20) {
        const old = STATE.handTrail.shift();
        if (old.mesh && old.mesh.parent) {
            old.mesh.parent.remove(old.mesh);
        }
    }

    // Create trail meshes in Star Space scene
    if (STATE.currentScene === 'star' && STATE.sceneGroups.star) {
        const lastPoint = STATE.handTrail[STATE.handTrail.length - 1];
        if (!lastPoint.mesh) {
            const trailSphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: 0x99ddff,
                    transparent: true,
                    opacity: 0.6
                })
            );
            trailSphere.position.copy(position);
            STATE.sceneGroups.star.add(trailSphere);
            lastPoint.mesh = trailSphere;
        }
    }
}

function updateHandTrail() {
    // Fade out and remove old trail points
    STATE.handTrail.forEach((point, index) => {
        point.life -= 0.05;

        if (point.mesh) {
            point.mesh.material.opacity = point.life * 0.6;
            point.mesh.scale.setScalar(point.life);

            if (point.life <= 0 && point.mesh.parent) {
                point.mesh.parent.remove(point.mesh);
                point.mesh = null;
            }
        }
    });

    // Remove dead trail points
    STATE.handTrail = STATE.handTrail.filter(point => point.life > 0);
}

// ============================================================================
// FIRST-PERSON HAND TRACKING
// ============================================================================

function updateFirstPersonHands() {
    if (!STATE.leftHand || !STATE.rightHand || !STATE.webcam.enabled) return;

    // Map webcam motion to hand offset from base position
    const handOffsetX = STATE.webcam.handX * 0.15; // Scaled for screen space
    const handOffsetY = STATE.webcam.handY * 0.1;
    const handOffsetZ = STATE.webcam.handZ * 0.05;

    // Update left hand position (smoothly interpolate)
    const leftBasePos = { x: -0.3, y: -0.4, z: -0.6 };
    const leftTargetX = leftBasePos.x + handOffsetX;
    const leftTargetY = leftBasePos.y + handOffsetY;
    const leftTargetZ = leftBasePos.z + handOffsetZ;

    STATE.leftHand.position.x += (leftTargetX - STATE.leftHand.position.x) * 0.15;
    STATE.leftHand.position.y += (leftTargetY - STATE.leftHand.position.y) * 0.15;
    STATE.leftHand.position.z += (leftTargetZ - STATE.leftHand.position.z) * 0.15;

    // Update right hand position (mirrored)
    const rightBasePos = { x: 0.3, y: -0.4, z: -0.6 };
    const rightTargetX = rightBasePos.x + handOffsetX;
    const rightTargetY = rightBasePos.y + handOffsetY;
    const rightTargetZ = rightBasePos.z + handOffsetZ;

    STATE.rightHand.position.x += (rightTargetX - STATE.rightHand.position.x) * 0.15;
    STATE.rightHand.position.y += (rightTargetY - STATE.rightHand.position.y) * 0.15;
    STATE.rightHand.position.z += (rightTargetZ - STATE.rightHand.position.z) * 0.15;

    // Animate hand closing based on pinch strength
    animateFirstPersonHandClosing(STATE.leftHand, STATE.webcam.pinchStrength);
    animateFirstPersonHandClosing(STATE.rightHand, STATE.webcam.pinchStrength);

    // Check for hand-based key pickup
    checkHandKeyPickup();

    // Check for door handle interaction
    checkHandDoorHandleInteraction();

    // Add subtle idle animation when not moving
    if (STATE.webcam.motionStrength < 0.05) {
        const idleOffset = Math.sin(STATE.time * 1.2) * 0.02;
        STATE.leftHand.position.y += idleOffset;
        STATE.rightHand.position.y -= idleOffset; // Opposite phase
    }
}

function animateFirstPersonHandClosing(hand, closingAmount) {
    if (!hand || !hand.userData.fingers) return;

    const fingers = hand.userData.fingers;

    // Store target closing amount
    hand.userData.closedAmount += (closingAmount - hand.userData.closedAmount) * 0.2;
    const currentClosed = hand.userData.closedAmount;

    // Curl fingers
    fingers.forEach((fingerGroup, fingerIndex) => {
        const children = fingerGroup.children;

        children.forEach((segment, segmentIndex) => {
            // More curl for outer segments
            const curlMultiplier = (segmentIndex + 1) * 0.3;
            const targetRotation = currentClosed * curlMultiplier;

            // Rotate around X axis to curl fingers inward
            segment.rotation.x = Math.PI / 2 + targetRotation;
        });

        // Move finger group slightly inward when closing
        if (fingerIndex < 3) { // Not thumb
            const originalZ = 0.08 + (fingerIndex === 1 ? 0.01 : 0);
            fingerGroup.position.z = originalZ - (currentClosed * 0.02);
        }
    });

    // Enhance glow when closing
    if (hand.userData.palm && hand.userData.palm.material) {
        hand.userData.palm.material.emissiveIntensity = 0.2 + currentClosed * 0.3;
        hand.userData.palm.material.opacity = 0.95 + currentClosed * 0.05;
    }
}

// ============================================================================
// HAND-BASED KEY PICKUP SYSTEM
// ============================================================================

function checkHandKeyPickup() {
    if (!STATE.rightHand || !STATE.webcam.enabled) return;

    const currentGroup = STATE.sceneGroups[STATE.currentScene];
    if (!currentGroup) return;

    // Get right hand's world position
    const handWorldPos = new THREE.Vector3();
    STATE.rightHand.getWorldPosition(handWorldPos);

    // Find all uncollected keys in current scene
    let nearestKey = null;
    let minDistance = Infinity;

    currentGroup.traverse((obj) => {
        if (obj.userData.isKey && !obj.userData.collected) {
            const distance = obj.position.distanceTo(handWorldPos);
            if (distance < minDistance) {
                minDistance = distance;
                nearestKey = obj;
            }
        }
    });

    // Check if hand is near a key and pinching
    const reachDistance = 2.5; // Units within which hand can grab key

    if (nearestKey && minDistance < reachDistance) {
        // Highlight nearest key when in range
        if (nearestKey.userData.glow) {
            const pulse = Math.sin(STATE.time * 8) * 0.3 + 0.5;
            nearestKey.userData.glow.material.opacity = pulse;
        }

        // If pinching and not already grabbing a key
        if (STATE.webcam.isPinching && !STATE.grabbedKey) {
            STATE.grabbedKey = nearestKey;
            nearestKey.userData.beingGrabbed = true;
        }
    }

    // Animate grabbed key toward hand
    if (STATE.grabbedKey && STATE.grabbedKey.userData.beingGrabbed) {
        const key = STATE.grabbedKey;

        // Move key toward hand palm
        const targetPos = handWorldPos.clone();
        targetPos.y -= 0.1; // Offset to palm center

        key.position.lerp(targetPos, 0.2);

        // Scale down key as it approaches
        const distanceToHand = key.position.distanceTo(targetPos);
        const scaleAmount = Math.max(0.3, 1 - (1 / Math.max(distanceToHand, 0.5)));
        key.scale.setScalar(scaleAmount);

        // When key reaches hand, collect it
        if (distanceToHand < 0.3) {
            collectKey(key);
            STATE.grabbedKey = null;
        }

        // Release if hand opens
        if (!STATE.webcam.isPinching) {
            key.userData.beingGrabbed = false;
            key.scale.setScalar(1.0);
            STATE.grabbedKey = null;
        }
    }
}

// ============================================================================
// DOOR HANDLE ROTATION MECHANICS
// ============================================================================

function checkHandDoorHandleInteraction() {
    if (!STATE.rightHand || !STATE.webcam.enabled) return;

    const currentGroup = STATE.sceneGroups[STATE.currentScene];
    if (!currentGroup) return;

    // Get right hand's world position
    const handWorldPos = new THREE.Vector3();
    STATE.rightHand.getWorldPosition(handWorldPos);

    // Find all door handles in current scene
    let nearestHandle = null;
    let minDistance = Infinity;

    currentGroup.traverse((obj) => {
        if (obj.userData.isHandle && obj.parent && obj.parent.userData.target) {
            // Get handle's world position
            const handleWorldPos = new THREE.Vector3();
            obj.getWorldPosition(handleWorldPos);

            const distance = handleWorldPos.distanceTo(handWorldPos);
            if (distance < minDistance) {
                minDistance = distance;
                nearestHandle = obj;
            }
        }
    });

    const reachDistance = 2.0; // Units within which hand can grab handle

    // Store previous nearest handle for releasing
    if (STATE.nearestDoorHandle && STATE.nearestDoorHandle !== nearestHandle) {
        // Reset previous handle if we moved away
        STATE.nearestDoorHandle.userData.rotation = 0;
        STATE.nearestDoorHandle = null;
    }

    if (nearestHandle && minDistance < reachDistance) {
        STATE.nearestDoorHandle = nearestHandle;

        // Highlight handle when in range (subtle glow pulse)
        nearestHandle.traverse((mesh) => {
            if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
                const pulse = Math.sin(STATE.time * 6) * 0.1 + 0.25;
                mesh.material.emissiveIntensity = pulse;
            }
        });

        // If pinching, start rotating handle
        if (STATE.webcam.isPinching) {
            // Track hand movement for rotation
            const handMovement = STATE.webcam.handY; // Vertical movement for rotation

            // Update handle rotation based on hand movement
            const rotationSpeed = 2.0;
            nearestHandle.userData.rotation += handMovement * rotationSpeed * 0.016;

            // Clamp rotation between -45° and +45°
            nearestHandle.userData.rotation = Math.max(
                -Math.PI / 4,
                Math.min(Math.PI / 4, nearestHandle.userData.rotation)
            );

            // Apply rotation to handle (rotate around Z axis for side handles)
            nearestHandle.rotation.z = nearestHandle.userData.rotation;

            // Check if rotation threshold reached for door opening
            const openThreshold = Math.PI / 4; // 45 degrees
            if (Math.abs(nearestHandle.userData.rotation) >= openThreshold * 0.9) {
                // Trigger door opening
                const portalGroup = nearestHandle.parent;
                if (portalGroup && portalGroup.userData.target && !STATE.transitioning) {
                    // Animate door opening before transition
                    animateDoorOpening(portalGroup, nearestHandle);
                }
            }
        } else {
            // Slowly return handle to neutral position when not grabbing
            nearestHandle.userData.rotation *= 0.9;
            nearestHandle.rotation.z = nearestHandle.userData.rotation;

            // Reset if very close to zero
            if (Math.abs(nearestHandle.userData.rotation) < 0.01) {
                nearestHandle.userData.rotation = 0;
                nearestHandle.rotation.z = 0;
            }
        }
    } else {
        // Reset nearest handle reference if out of range
        if (STATE.nearestDoorHandle) {
            STATE.nearestDoorHandle.userData.rotation = 0;
            STATE.nearestDoorHandle.rotation.z = 0;
            STATE.nearestDoorHandle = null;
        }
    }
}

// ============================================================================
// DOOR OPENING ANIMATION
// ============================================================================

function animateDoorOpening(portalGroup, handleObj) {
    if (!portalGroup || STATE.transitioning) return;

    STATE.transitioning = true; // Prevent multiple activations

    const portalMesh = portalGroup.userData.portalMesh;
    const targetScene = portalGroup.userData.target;

    if (!portalMesh) {
        // Fallback if no portal mesh - just transition
        transitionToScene(targetScene);
        return;
    }

    // Store original rotation
    const originalRotation = portalMesh.rotation.clone();

    // Determine swing direction based on portal type
    const isCircular = portalMesh.geometry.type === 'TorusGeometry';
    const swingAxis = isCircular ? 'x' : 'y'; // Circular portals swing on X, doors on Y
    const swingAmount = Math.PI / 3; // 60 degrees swing

    // Animate door swing over 400ms
    const swingDuration = 400;
    const startTime = Date.now();

    function swingStep() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / swingDuration, 1);

        // Easing function (easeOutCubic for smooth deceleration)
        const eased = 1 - Math.pow(1 - progress, 3);

        // Apply swing rotation
        if (swingAxis === 'y') {
            portalMesh.rotation.y = originalRotation.y + (swingAmount * eased);
        } else {
            portalMesh.rotation.x = originalRotation.x + (swingAmount * eased);
        }

        // Fade portal opacity while opening
        if (portalMesh.material.opacity !== undefined) {
            portalMesh.material.opacity = 1 - (eased * 0.5);
        }

        if (progress < 1) {
            requestAnimationFrame(swingStep);
        } else {
            // Door fully opened - trigger scene transition
            transitionToScene(targetScene);

            // Reset door after transition completes
            setTimeout(() => {
                portalMesh.rotation.copy(originalRotation);
                if (portalMesh.material.opacity !== undefined) {
                    portalMesh.material.opacity = 1;
                }

                // Reset handle
                if (handleObj && handleObj.userData) {
                    handleObj.userData.rotation = 0;
                    handleObj.rotation.z = 0;
                }
            }, CONFIG.transitionDuration);
        }
    }

    // Play door opening sound (placeholder)
    console.log('Door opening sound: soft creak');

    // Start swing animation
    requestAnimationFrame(swingStep);
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

function animate() {
    requestAnimationFrame(animate);

    STATE.time += 0.016; // ~60fps

    updateControls();
    updateFirstPersonHands(); // Update first-person hands with webcam tracking
    updateSceneAnimations();
    applyHandInteraction();

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

    // Star Space - floating particles with orbital motion
    if (STATE.currentScene === 'star' && userData.particles) {
        userData.particles.forEach((particle, index) => {
            // Skip grabbed orbs - they're controlled by hand
            if (particle.userData.grabbed) {
                // Make grabbed orb glow brighter
                particle.material.emissiveIntensity = 1.2;
                particle.material.opacity = 1.0;
                return;
            }

            // Handle released orbs with velocity
            if (particle.userData.releaseVelocity) {
                particle.position.add(particle.userData.releaseVelocity);
                particle.userData.releaseVelocity.multiplyScalar(0.95); // Decay

                // Remove velocity when nearly stopped
                if (particle.userData.releaseVelocity.length() < 0.01) {
                    delete particle.userData.releaseVelocity;
                    // Set new original position
                    particle.userData.originalPos = particle.position.clone();
                }

                // Restore normal appearance
                particle.material.emissiveIntensity = 0.8;
                particle.material.opacity = 0.8;
                return;
            }

            const originalPos = particle.userData.originalPos;
            const phase = particle.userData.phase;
            const speed = particle.userData.speed;
            const radius = particle.userData.radius;

            // Orbital motion around original position
            const angle = STATE.time * speed + phase;
            const orbitX = Math.cos(angle) * radius;
            const orbitY = Math.sin(angle * 0.7) * radius * 0.5;
            const orbitZ = Math.sin(angle) * radius;

            particle.position.x = originalPos.x + orbitX;
            particle.position.y = originalPos.y + orbitY;
            particle.position.z = originalPos.z + orbitZ;

            // Gentle pulsing
            const pulse = Math.sin(STATE.time * 2 + phase) * 0.2 + 0.8;
            particle.material.emissiveIntensity = 0.8 * pulse;
            particle.material.opacity = 0.8;
        });

        // Animate central key (if not collected)
        if (userData.centralKey && !userData.centralKey.userData.collected) {
            userData.centralKey.rotation.y = STATE.time * 0.5;
            const floatY = Math.sin(STATE.time * 1.5) * 0.15;
            userData.centralKey.position.y = floatY;
        }
    }

    // Animate all keys (floating and rotating)
    currentGroup.traverse((obj) => {
        if (obj.userData.isKey && !obj.userData.collected) {
            obj.rotation.y = STATE.time * 0.8;
            const baseY = obj.userData.baseY || 1;
            const floatOffset = Math.sin(STATE.time * 2 + obj.position.x) * 0.1;
            obj.position.y = baseY + floatOffset;

            // Pulsing glow
            if (obj.userData.glow) {
                const pulse = Math.sin(STATE.time * 3) * 0.1 + 0.2;
                obj.userData.glow.material.opacity = pulse;
            }
        }
    });

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
