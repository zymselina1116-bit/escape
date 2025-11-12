// The Bright Escape - Dreamcore 3D Exploration
// A calm, atmospheric journey through interconnected surreal worlds

// ============================================================================
// GLOBAL STATE & CONFIGURATION
// ============================================================================

const STATE = {
    currentScene: 'main',
    transitioning: false,
    time: 0,
    camera: null,
    renderer: null,
    scenes: {},
    audioContext: null,
    audioTracks: {},
    currentAudio: null,
    keys: {},
    mouse: { x: 0, y: 0, dx: 0, dy: 0 },
    pointerLocked: false,
    velocity: { x: 0, y: 0, z: 0 },
    cameraRotation: { yaw: 0, pitch: 0 }
};

const CONFIG = {
    moveSpeed: 0.05,
    lookSpeed: 0.002,
    zoomSpeed: 0.005,
    cameraHeight: 1.6,
    floatAmplitude: 0.05,
    floatSpeed: 0.2
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
    STATE.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    STATE.renderer.setSize(window.innerWidth, window.innerHeight);
    STATE.renderer.shadowMap.enabled = true;
    STATE.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    STATE.renderer.outputEncoding = THREE.sRGBEncoding;
    STATE.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    STATE.renderer.toneMappingExposure = 1.0;
    container.appendChild(STATE.renderer.domElement);

    window.addEventListener('resize', () => {
        STATE.camera.aspect = window.innerWidth / window.innerHeight;
        STATE.camera.updateProjectionMatrix();
        STATE.renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function setupCamera() {
    STATE.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    STATE.camera.position.set(0, CONFIG.cameraHeight, 10);
    STATE.camera.lookAt(0, 1.5, 0);
}

// ============================================================================
// SCENE CREATION
// ============================================================================

function setupScenes() {
    STATE.scenes.main = createMainRoom();
    STATE.scenes.pool = createPoolTunnel();
    STATE.scenes.hallway = createHallway();
    STATE.scenes.garden = createGarden();
}

// ----------------------------------------------------------------------------
// MAIN ROOM - European Dream Hub
// ----------------------------------------------------------------------------

function createMainRoom() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf3e9da, 0.015);
    scene.background = new THREE.Color(0xf3e9da);

    // Lighting
    const sunlight = new THREE.DirectionalLight(0xfff6e0, 1.1);
    sunlight.position.set(20, 30, 15);
    sunlight.castShadow = true;
    sunlight.shadow.camera.left = -20;
    sunlight.shadow.camera.right = 20;
    sunlight.shadow.camera.top = 20;
    sunlight.shadow.camera.bottom = -20;
    scene.add(sunlight);

    const ambient = new THREE.HemisphereLight(0xfff3d8, 0xcbbf9e, 0.7);
    scene.add(ambient);

    // Floor - Polished wood
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xb48a64,
        roughness: 0.4,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(20, 20);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1.0,
        side: THREE.DoubleSide
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 12;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xf3e9da,
        roughness: 0.9
    });

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(20, 12, 0.2),
        wallMaterial
    );
    backWall.position.set(0, 6, -10);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 12, 20),
        wallMaterial
    );
    leftWall.position.set(-10, 6, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 12, 20),
        wallMaterial
    );
    rightWall.position.set(10, 6, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Front wall (with opening)
    const frontWallLeft = new THREE.Mesh(
        new THREE.BoxGeometry(8, 12, 0.2),
        wallMaterial
    );
    frontWallLeft.position.set(-6, 6, 10);
    scene.add(frontWallLeft);

    const frontWallRight = new THREE.Mesh(
        new THREE.BoxGeometry(8, 12, 0.2),
        wallMaterial
    );
    frontWallRight.position.set(6, 6, 10);
    scene.add(frontWallRight);

    // Wooden desk
    const deskGroup = new THREE.Group();
    const deskTop = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.1, 1),
        new THREE.MeshStandardMaterial({ color: 0x8b5a3c, roughness: 0.6 })
    );
    deskTop.position.y = 0.8;
    deskTop.castShadow = true;
    deskGroup.add(deskTop);

    const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7 });

    const positions = [[-0.9, 0.4, -0.4], [0.9, 0.4, -0.4], [-0.9, 0.4, 0.4], [0.9, 0.4, 0.4]];
    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        deskGroup.add(leg);
    });

    deskGroup.position.set(-2, 0, -3);
    scene.add(deskGroup);

    // Floating dust particles
    const dustParticles = [];
    for (let i = 0; i < 50; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 8, 8),
            new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3
            })
        );
        particle.position.set(
            Math.random() * 18 - 9,
            Math.random() * 10 + 1,
            Math.random() * 18 - 9
        );
        particle.userData.velocity = {
            x: (Math.random() - 0.5) * 0.002,
            y: (Math.random() - 0.5) * 0.002,
            z: (Math.random() - 0.5) * 0.002
        };
        dustParticles.push(particle);
        scene.add(particle);
    }

    // Portal A - Wooden double door to Hallway
    const doorA = createPortal({
        position: [0, 0, -9],
        width: 2.5,
        height: 4,
        depth: 0.2,
        color: 0x8b5a3c,
        emissiveColor: 0xffd8a8,
        emissiveIntensity: 0.3,
        destination: 'hallway'
    });
    scene.add(doorA);

    // Portal B - Glass door to Pool
    const doorB = createPortal({
        position: [7, 0, -5],
        width: 2,
        height: 3.5,
        depth: 0.1,
        color: 0x88ccdd,
        emissiveColor: 0xaef7ff,
        emissiveIntensity: 0.4,
        destination: 'pool',
        transparent: true,
        opacity: 0.5
    });
    scene.add(doorB);

    // Window portal to Garden
    const windowPortal = createPortal({
        position: [-7, 2, -5],
        width: 1.5,
        height: 3,
        depth: 0.1,
        color: 0xaaddaa,
        emissiveColor: 0xcaffd0,
        emissiveIntensity: 0.4,
        destination: 'garden',
        transparent: true,
        opacity: 0.6
    });
    scene.add(windowPortal);

    scene.userData = {
        dustParticles: dustParticles,
        startPosition: { x: 0, y: CONFIG.cameraHeight, z: 10 },
        startRotation: { yaw: 0, pitch: 0 }
    };

    return scene;
}

// ----------------------------------------------------------------------------
// POOL TUNNEL
// ----------------------------------------------------------------------------

function createPoolTunnel() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xdff8ee, 0.02);
    scene.background = new THREE.Color(0xdff8ee);

    // Lighting
    const directional = new THREE.DirectionalLight(0xd5fff8, 1.2);
    directional.position.set(0, 8, -10);
    scene.add(directional);

    const ambient = new THREE.HemisphereLight(0xd0fff0, 0xa0c5b0, 0.6);
    scene.add(ambient);

    // Water floor with ripple effect
    const waterGeometry = new THREE.PlaneGeometry(20, 60, 50, 150);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x9fe5c5,
        transparent: true,
        opacity: 0.8,
        roughness: 0.15,
        metalness: 0.2
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.z = -30;
    water.receiveShadow = true;
    scene.add(water);

    // Tiled walls
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.1
    });

    // Circular tunnel walls with arches
    const segments = 32;
    const radius = 10;
    const length = 60;

    for (let z = 0; z < length; z += 10) {
        // Create arch
        const archGroup = new THREE.Group();

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            const tile = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.8, 10),
                wallMaterial
            );
            tile.position.set(x, y, -z);
            tile.lookAt(0, y, -z);
            tile.receiveShadow = true;
            scene.add(tile);
        }
    }

    // Return portal
    const returnPortal = createPortal({
        position: [0, 1.5, 25],
        width: 2.5,
        height: 4,
        depth: 0.2,
        color: 0xffffff,
        emissiveColor: 0xf5fff8,
        emissiveIntensity: 0.5,
        destination: 'main',
        isCircular: true
    });
    scene.add(returnPortal);

    scene.userData = {
        water: water,
        waterGeometry: waterGeometry,
        startPosition: { x: 0, y: CONFIG.cameraHeight, z: 20 },
        startRotation: { yaw: Math.PI, pitch: 0 }
    };

    return scene;
}

// ----------------------------------------------------------------------------
// HALLWAY
// ----------------------------------------------------------------------------

function createHallway() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x181818, 0.04);
    scene.background = new THREE.Color(0x181818);

    // Ambient light
    const ambient = new THREE.AmbientLight(0x443322, 0.4);
    scene.add(ambient);

    // Floor - dark stone
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d2b29,
        roughness: 0.4,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 80),
        floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -40;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 80),
        new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: 0.9 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 8, -40);
    scene.add(ceiling);

    // Walls and arches
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3836,
        roughness: 0.6,
        metalness: 0.1
    });

    for (let z = 0; z < 80; z += 6) {
        // Left wall segment
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 8, 5),
            wallMaterial
        );
        leftWall.position.set(-5, 4, -z);
        leftWall.receiveShadow = true;
        scene.add(leftWall);

        // Right wall segment
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 8, 5),
            wallMaterial
        );
        rightWall.position.set(5, 4, -z);
        rightWall.receiveShadow = true;
        scene.add(rightWall);

        // Arch top
        if (z % 6 === 0) {
            const arch = new THREE.Mesh(
                new THREE.BoxGeometry(10, 0.5, 0.5),
                wallMaterial
            );
            arch.position.set(0, 7.5, -z);
            scene.add(arch);
        }
    }

    // Point lamps
    const lamps = [];
    for (let z = 0; z < 80; z += 8) {
        const lampLight = new THREE.PointLight(0xffcc85, 1.2, 12);
        lampLight.position.set(-4, 4, -z);
        lampLight.castShadow = true;
        scene.add(lampLight);

        const lampLight2 = new THREE.PointLight(0xffcc85, 1.2, 12);
        lampLight2.position.set(4, 4, -z);
        lampLight2.castShadow = true;
        scene.add(lampLight2);

        // Visual lamp
        const lampGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffcc85 })
        );
        lampGlow.position.set(-4, 4, -z);
        scene.add(lampGlow);

        const lampGlow2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffcc85 })
        );
        lampGlow2.position.set(4, 4, -z);
        scene.add(lampGlow2);

        lamps.push(lampLight, lampLight2);
    }

    // Return portal
    const returnPortal = createPortal({
        position: [0, 0, 30],
        width: 2.5,
        height: 4,
        depth: 0.2,
        color: 0x8b5a3c,
        emissiveColor: 0xffdd99,
        emissiveIntensity: 0.4,
        destination: 'main'
    });
    scene.add(returnPortal);

    scene.userData = {
        lamps: lamps,
        startPosition: { x: 0, y: CONFIG.cameraHeight, z: 25 },
        startRotation: { yaw: Math.PI, pitch: 0 }
    };

    return scene;
}

// ----------------------------------------------------------------------------
// GARDEN
// ----------------------------------------------------------------------------

function createGarden() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xd9f7e3, 0.015);
    scene.background = new THREE.Color(0xd9f7e3);

    // Lighting
    const sunlight = new THREE.DirectionalLight(0xfff5cc, 1.1);
    sunlight.position.set(15, 25, -10);
    sunlight.castShadow = true;
    scene.add(sunlight);

    const ambient = new THREE.HemisphereLight(0xfff6d8, 0xc9f1a8, 0.8);
    scene.add(ambient);

    // Grass floor
    const grassMaterial = new THREE.MeshStandardMaterial({
        color: 0xb4d197,
        roughness: 0.8
    });
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(25, 25),
        grassMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Glass roof panels
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.4
    });

    const roofSegments = 5;
    for (let i = 0; i < roofSegments; i++) {
        const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 25),
            glassMaterial
        );
        panel.rotation.x = -Math.PI / 4;
        panel.position.set((i - roofSegments / 2) * 5, 8, 0);
        scene.add(panel);
    }

    // Glass walls
    const wallHeight = 10;
    const walls = [
        { pos: [0, wallHeight / 2, -12.5], rot: [0, 0, 0], size: [25, wallHeight, 0.1] },
        { pos: [0, wallHeight / 2, 12.5], rot: [0, 0, 0], size: [25, wallHeight, 0.1] },
        { pos: [-12.5, wallHeight / 2, 0], rot: [0, Math.PI / 2, 0], size: [25, wallHeight, 0.1] },
        { pos: [12.5, wallHeight / 2, 0], rot: [0, Math.PI / 2, 0], size: [25, wallHeight, 0.1] }
    ];

    walls.forEach(wall => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(...wall.size),
            glassMaterial
        );
        mesh.position.set(...wall.pos);
        mesh.rotation.set(...wall.rot);
        scene.add(mesh);
    });

    // Hanging pots and flowers
    const plants = [];
    for (let i = 0; i < 15; i++) {
        const pot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.2, 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.8 })
        );
        pot.position.set(
            Math.random() * 20 - 10,
            Math.random() * 1 + 2,
            Math.random() * 20 - 10
        );
        pot.castShadow = true;
        scene.add(pot);

        // Flower on top
        const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshStandardMaterial({
                color: [0xff6b9d, 0xffd93d, 0xff8c42, 0xa8e6cf][Math.floor(Math.random() * 4)],
                roughness: 0.6
            })
        );
        flower.position.copy(pot.position);
        flower.position.y += 0.4;
        flower.userData.baseY = flower.position.y;
        flower.userData.offset = Math.random() * Math.PI * 2;
        plants.push(flower);
        scene.add(flower);
    }

    // Floating particles (pollen)
    const particles = [];
    for (let i = 0; i < 30; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 6, 6),
            new THREE.MeshBasicMaterial({
                color: 0xfffacd,
                transparent: true,
                opacity: 0.6
            })
        );
        particle.position.set(
            Math.random() * 20 - 10,
            Math.random() * 8 + 1,
            Math.random() * 20 - 10
        );
        particle.userData.velocity = {
            x: (Math.random() - 0.5) * 0.003,
            y: (Math.random() - 0.5) * 0.003,
            z: (Math.random() - 0.5) * 0.003
        };
        particles.push(particle);
        scene.add(particle);
    }

    // Return portal
    const returnPortal = createPortal({
        position: [0, 0, -10],
        width: 2,
        height: 3.5,
        depth: 0.1,
        color: 0xddffdd,
        emissiveColor: 0xfffdd8,
        emissiveIntensity: 0.5,
        destination: 'main',
        transparent: true,
        opacity: 0.6
    });
    scene.add(returnPortal);

    scene.userData = {
        plants: plants,
        particles: particles,
        startPosition: { x: 0, y: CONFIG.cameraHeight, z: -5 },
        startRotation: { yaw: 0, pitch: 0 }
    };

    return scene;
}

// ----------------------------------------------------------------------------
// PORTAL CREATION HELPER
// ----------------------------------------------------------------------------

function createPortal(options) {
    const {
        position,
        width,
        height,
        depth,
        color,
        emissiveColor,
        emissiveIntensity,
        destination,
        transparent = false,
        opacity = 1.0,
        isCircular = false
    } = options;

    const group = new THREE.Group();

    // Portal frame
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: color,
        emissive: emissiveColor,
        emissiveIntensity: emissiveIntensity,
        roughness: 0.5,
        metalness: 0.2
    });

    let portalMesh;
    if (isCircular) {
        portalMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(width / 2, width / 2, depth, 32),
            frameMaterial
        );
        portalMesh.rotation.z = Math.PI / 2;
    } else {
        portalMesh = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            frameMaterial
        );
    }

    portalMesh.position.y = height / 2;

    if (transparent) {
        portalMesh.material.transparent = true;
        portalMesh.material.opacity = opacity;
    }

    group.add(portalMesh);

    // Glow effect
    const glowGeometry = isCircular
        ? new THREE.CylinderGeometry(width / 2 + 0.2, width / 2 + 0.2, depth + 0.1, 32)
        : new THREE.BoxGeometry(width + 0.2, height + 0.2, depth + 0.1);

    const glowMaterial = new THREE.MeshBasicMaterial({
        color: emissiveColor,
        transparent: true,
        opacity: 0.3
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(portalMesh.position);
    if (isCircular) glow.rotation.z = Math.PI / 2;
    group.add(glow);

    group.position.set(...position);
    group.userData = {
        destination: destination,
        portalMesh: portalMesh,
        glow: glow,
        baseIntensity: emissiveIntensity
    };

    return group;
}

// ============================================================================
// CONTROLS
// ============================================================================

function setupControls() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        STATE.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
        STATE.keys[e.key.toLowerCase()] = false;
    });

    // Mouse
    const canvas = STATE.renderer.domElement;

    canvas.addEventListener('click', () => {
        if (!STATE.pointerLocked) {
            canvas.requestPointerLock();
        } else {
            checkPortalInteraction();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        STATE.pointerLocked = document.pointerLockElement === canvas;
    });

    document.addEventListener('mousemove', (e) => {
        if (STATE.pointerLocked) {
            STATE.mouse.dx = e.movementX;
            STATE.mouse.dy = e.movementY;
        }
    });

    // Scroll zoom
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = -e.deltaY * CONFIG.zoomSpeed;
        STATE.camera.fov = Math.max(30, Math.min(100, STATE.camera.fov - zoomDelta * 10));
        STATE.camera.updateProjectionMatrix();
    }, { passive: false });
}

function updateControls() {
    // Camera rotation from mouse
    if (STATE.pointerLocked) {
        STATE.cameraRotation.yaw -= STATE.mouse.dx * CONFIG.lookSpeed;
        STATE.cameraRotation.pitch -= STATE.mouse.dy * CONFIG.lookSpeed;
        STATE.cameraRotation.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, STATE.cameraRotation.pitch));
        STATE.mouse.dx = 0;
        STATE.mouse.dy = 0;
    }

    // Movement
    const moveVector = new THREE.Vector3();

    if (STATE.keys['w']) moveVector.z -= 1;
    if (STATE.keys['s']) moveVector.z += 1;
    if (STATE.keys['a']) moveVector.x -= 1;
    if (STATE.keys['d']) moveVector.x += 1;

    if (moveVector.length() > 0) {
        moveVector.normalize();

        // Rotate movement vector by camera yaw
        const rotatedVector = moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), STATE.cameraRotation.yaw);

        STATE.velocity.x = rotatedVector.x * CONFIG.moveSpeed;
        STATE.velocity.z = rotatedVector.z * CONFIG.moveSpeed;
    } else {
        STATE.velocity.x *= 0.9;
        STATE.velocity.z *= 0.9;
    }

    // Apply velocity to camera
    STATE.camera.position.x += STATE.velocity.x;
    STATE.camera.position.z += STATE.velocity.z;

    // Floating camera effect
    const floatOffset = Math.sin(STATE.time * CONFIG.floatSpeed) * CONFIG.floatAmplitude;
    STATE.camera.position.y = CONFIG.cameraHeight + floatOffset;

    // Update camera orientation
    const direction = new THREE.Vector3();
    direction.x = Math.sin(STATE.cameraRotation.yaw) * Math.cos(STATE.cameraRotation.pitch);
    direction.y = Math.sin(STATE.cameraRotation.pitch);
    direction.z = -Math.cos(STATE.cameraRotation.yaw) * Math.cos(STATE.cameraRotation.pitch);

    const lookAtPoint = new THREE.Vector3().addVectors(STATE.camera.position, direction);
    STATE.camera.lookAt(lookAtPoint);
}

function checkPortalInteraction() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), STATE.camera);

    const currentScene = STATE.scenes[STATE.currentScene];
    const portals = [];

    currentScene.traverse((object) => {
        if (object.userData.destination) {
            portals.push(object);
        }
    });

    const intersects = raycaster.intersectObjects(portals, true);

    if (intersects.length > 0) {
        const portal = intersects[0].object.parent;
        if (portal.userData.destination) {
            transitionToScene(portal.userData.destination);
        }
    }
}

// ============================================================================
// SCENE TRANSITIONS
// ============================================================================

function transitionToScene(sceneName) {
    if (STATE.transitioning || !STATE.scenes[sceneName]) return;

    STATE.transitioning = true;

    // Fade out
    const overlay = document.getElementById('fadeOverlay');
    overlay.style.opacity = '1';

    setTimeout(() => {
        // Switch scene
        STATE.currentScene = sceneName;
        const newScene = STATE.scenes[sceneName];

        // Reset camera position and rotation
        if (newScene.userData.startPosition) {
            STATE.camera.position.copy(newScene.userData.startPosition);
        }
        if (newScene.userData.startRotation) {
            STATE.cameraRotation.yaw = newScene.userData.startRotation.yaw;
            STATE.cameraRotation.pitch = newScene.userData.startRotation.pitch;
        }

        STATE.velocity = { x: 0, y: 0, z: 0 };

        // Audio transition
        playSceneAudio(sceneName);

        // Fade in
        overlay.style.opacity = '0';

        setTimeout(() => {
            STATE.transitioning = false;
        }, 500);
    }, 500);
}

// ============================================================================
// AUDIO SYSTEM
// ============================================================================

function setupAudio() {
    // Audio will be placeholder - create audio context
    try {
        STATE.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Note: Audio files are referenced but not loaded (placeholders)
        STATE.audioTracks = {
            main: 'assets/audio/main.mp3',
            pool: 'assets/audio/pool.mp3',
            hallway: 'assets/audio/hallway.mp3',
            garden: 'assets/audio/garden.mp3'
        };
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function playSceneAudio(sceneName) {
    // Placeholder - would cross-fade audio tracks
    // In a real implementation, this would load and play audio files
    console.log(`Playing audio for scene: ${sceneName}`);
}

// ============================================================================
// ANIMATION & UPDATE LOOP
// ============================================================================

function animate() {
    requestAnimationFrame(animate);

    STATE.time += 0.016;

    updateControls();
    updateScene();

    const currentScene = STATE.scenes[STATE.currentScene];
    STATE.renderer.render(currentScene, STATE.camera);
}

function updateScene() {
    const scene = STATE.scenes[STATE.currentScene];

    // Update scene-specific animations
    if (STATE.currentScene === 'main' && scene.userData.dustParticles) {
        scene.userData.dustParticles.forEach(particle => {
            particle.position.x += particle.userData.velocity.x;
            particle.position.y += particle.userData.velocity.y;
            particle.position.z += particle.userData.velocity.z;

            // Boundary check
            if (Math.abs(particle.position.x) > 9) particle.userData.velocity.x *= -1;
            if (particle.position.y < 1 || particle.position.y > 11) particle.userData.velocity.y *= -1;
            if (Math.abs(particle.position.z) > 9) particle.userData.velocity.z *= -1;
        });
    }

    if (STATE.currentScene === 'pool' && scene.userData.water) {
        // Water ripple effect
        const water = scene.userData.water;
        const positions = water.geometry.attributes.position;

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const wave = Math.sin(x * 0.5 + STATE.time) * 0.05 + Math.sin(y * 0.3 + STATE.time * 0.7) * 0.05;
            positions.setZ(i, wave);
        }
        positions.needsUpdate = true;
    }

    if (STATE.currentScene === 'hallway' && scene.userData.lamps) {
        // Flickering lamp effect
        scene.userData.lamps.forEach((lamp, index) => {
            const flicker = Math.sin(STATE.time * 10 + index) * 0.1 + 0.9;
            lamp.intensity = 1.2 * flicker;
        });
    }

    if (STATE.currentScene === 'garden') {
        // Swaying flowers
        if (scene.userData.plants) {
            scene.userData.plants.forEach(plant => {
                const sway = Math.sin(STATE.time + plant.userData.offset) * 0.05;
                plant.position.y = plant.userData.baseY + sway;
            });
        }

        // Moving particles
        if (scene.userData.particles) {
            scene.userData.particles.forEach(particle => {
                particle.position.x += particle.userData.velocity.x;
                particle.position.y += particle.userData.velocity.y;
                particle.position.z += particle.userData.velocity.z;

                if (Math.abs(particle.position.x) > 10) particle.userData.velocity.x *= -1;
                if (particle.position.y < 1 || particle.position.y > 9) particle.userData.velocity.y *= -1;
                if (Math.abs(particle.position.z) > 10) particle.userData.velocity.z *= -1;
            });
        }
    }

    // Animate portal glows
    scene.traverse((object) => {
        if (object.userData.glow) {
            const pulse = Math.sin(STATE.time * 2) * 0.2 + 0.8;
            object.userData.glow.material.opacity = 0.3 * pulse;

            if (object.userData.portalMesh) {
                const baseIntensity = object.userData.baseIntensity || 0.3;
                object.userData.portalMesh.material.emissiveIntensity = baseIntensity * pulse;
            }
        }
    });
}

// ============================================================================
// START THE EXPERIENCE
// ============================================================================

window.addEventListener('DOMContentLoaded', init);
