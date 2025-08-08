<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

    let container: HTMLDivElement;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let controls: PointerLockControls;
    let animationId = 0;

    // movimiento FPS
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const move = { forward: false, backward: false, left: false, right: false };
    let canJump = false;

    // proyectiles y targets
    const projectiles: Array<{ mesh: THREE.Mesh; vel: THREE.Vector3 }> = [];
    const breakableTargets: THREE.Mesh[] = []; // jarrón + cubos tech
    const ragdollPieces: Array<{ mesh: THREE.Mesh; vel: THREE.Vector3 }> = [];

    // "física" simple para cajas que caen
    type Body = { mesh: THREE.Mesh; vel: THREE.Vector3; asleep: boolean };
    const fallingCrates: Body[] = [];

    // Sonido
    let shootSound: THREE.Audio;
    let hitSound: THREE.Audio;

    // Parámetros de la habitación
    const ROOM_SIZE = 20; // ancho/largo
    const HALF = ROOM_SIZE / 2;

    const clock = new THREE.Clock();

    // --- MÓVIL / JOYSTICK ---
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    let HUD: HTMLDivElement;
    let joyBase: HTMLDivElement;
    let joyKnob: HTMLDivElement;
    let fireBtn: HTMLButtonElement;
    let lookArea: HTMLDivElement;

    const joyState = {
        active: false,
        startX: 0, startY: 0,
        dx: 0, dy: 0, // desplazamiento (px)
        normX: 0, normY: 0 // vector normalizado [-1,1]
    };
    const JOY_RADIUS = 60; // px
    const LOOK_SENS = 0.18; // sensibilidad drag mirar (grados por px approx)

    // acumulado de mirada móvil
    let yaw = 0;   // rotación Y
    let pitch = 0; // rotación X (clamp [-89, 89])

    onMount(() => {
        init();
        animate();
        return cleanup;
    });

    function cleanup() {
        cancelAnimationFrame(animationId);
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("keyup", onKeyUp);
        document.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("resize", onWindowResize);
        if (renderer) renderer.dispose();
    }

    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1f1f1f);

        camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.shadowMap.enabled = true;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Controles FPS (solo desktop)
        controls = new PointerLockControls(camera, document.body);
        scene.add(controls.getObject());
        if (!isTouch) {
            container.addEventListener("click", () => controls.lock());
        }

        // Luces
        scene.add(new THREE.AmbientLight(0xffffff, 0.35));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(6, 12, 4);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.set(2048, 2048);
        scene.add(dirLight);

        // Suelo
        const planeGeo = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
        const planeMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
        const floor = new THREE.Mesh(planeGeo, planeMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        floor.position.y = 0;
        scene.add(floor);

        // Techo
        const ceil = new THREE.Mesh(
            new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, side: THREE.DoubleSide })
        );
        ceil.rotation.x = Math.PI / 2;
        ceil.position.y = 6;
        scene.add(ceil);

        // Paredes (4)
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, side: THREE.DoubleSide });
        const wallGeo = new THREE.PlaneGeometry(ROOM_SIZE, 6);

        const wallN = new THREE.Mesh(wallGeo, wallMat); wallN.position.set(0, 3, -HALF); scene.add(wallN);
        const wallS = new THREE.Mesh(wallGeo, wallMat); wallS.rotation.y = Math.PI; wallS.position.set(0, 3, HALF); scene.add(wallS);
        const wallE = new THREE.Mesh(wallGeo, wallMat); wallE.rotation.y = -Math.PI / 2; wallE.position.set(HALF, 3, 0); scene.add(wallE);
        const wallW = new THREE.Mesh(wallGeo, wallMat); wallW.rotation.y =  Math.PI / 2; wallW.position.set(-HALF, 3, 0); scene.add(wallW);

        // Muebles
        const tableTop = addFurniture();

        // Cubos tech en la mesa
        addTechCubesOnTable(tableTop);

        // Arma (dummy en cámara)
        const gun = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.2, 1),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        gun.position.set(0.5, -0.4, -1.2);
        camera.add(gun);

        // Posición inicial
        controls.getObject().position.set(0, 1.6, 4);

        // Sonido
        const listener = new THREE.AudioListener();
        camera.add(listener);
        shootSound = new THREE.Audio(listener);
        hitSound = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load("/assets/sounds/shoot.mp3", (b) => shootSound.setBuffer(b));
        audioLoader.load("/assets/sounds/hit.mp3",  (b) => hitSound.setBuffer(b));

        // Eventos teclado/ratón
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        document.addEventListener("mousedown", onMouseDown);
        window.addEventListener("resize", onWindowResize);
        onWindowResize();

        // Si es móvil, preparar HUD táctil
        if (isTouch) setupMobileHUD();
    }

    function addFurniture() {
        // Mesa
        const tableTop = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.2, 1.6),
            new THREE.MeshStandardMaterial({ color: 0x7a5a3a })
        );
        tableTop.position.set(0, 1, 0);
        tableTop.castShadow = tableTop.receiveShadow = true;
        scene.add(tableTop);

        const legGeo = new THREE.BoxGeometry(0.15, 1, 0.15);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x5c4129 });
        const legs = [0,1,2,3].map(() => new THREE.Mesh(legGeo, legMat));
        const ox = 1.3, oz = 0.65;
        legs[0].position.set( ox, 0.5,  oz);
        legs[1].position.set(-ox, 0.5,  oz);
        legs[2].position.set( ox, 0.5, -oz);
        legs[3].position.set(-ox, 0.5, -oz);
        legs.forEach(l => { l.castShadow = l.receiveShadow = true; scene.add(l); });

        // Sofá
        const sofa = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 1, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x3a6a7a })
        ); sofa.position.set(-5, 0.5, -3); sofa.castShadow = sofa.receiveShadow = true; scene.add(sofa);

        // Estantería
        const shelf = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 2.4, 2.5),
            new THREE.MeshStandardMaterial({ color: 0x553333 })
        ); shelf.position.set(8, 1.2, 0); shelf.castShadow = shelf.receiveShadow = true; scene.add(shelf);

        // Lámpara
        const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
        lampBase.position.set(5, 0.6, -6); lampBase.castShadow = lampBase.receiveShadow = true; scene.add(lampBase);
        const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
        lampShade.position.set(5, 1.5, -6); lampShade.castShadow = lampShade.receiveShadow = true; scene.add(lampShade);

        // Jarrón (rompible)
        const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.15, 0.5, 24), new THREE.MeshStandardMaterial({ color: 0xbfd8f5 }));
        vase.position.set(0, 1.25, 0); vase.castShadow = vase.receiveShadow = true; scene.add(vase);
        breakableTargets.push(vase);

        return tableTop;
    }

    function addTechCubesOnTable(tableTop: THREE.Mesh) {
        const loader = new THREE.TextureLoader();
        const mats = [
            new THREE.MeshStandardMaterial({ map: loader.load("/assets/img/tech/svelte.png") }),
            new THREE.MeshStandardMaterial({ map: loader.load("/assets/img/tech/type.png") }),
            new THREE.MeshStandardMaterial({ map: loader.load("/assets/img/tech/vercel.webp") }),
        ];
        const size = 0.7;
        const cubeGeo = new THREE.BoxGeometry(size, size, size);
        const y = tableTop.position.y + 0.2 + size / 2 + 0.02;
        const positions: Array<[number, number, number]> = [[-0.9, y, 0],[0, y, 0],[0.9, y, 0]];
        positions.forEach((p,i) => {
            const cube = new THREE.Mesh(cubeGeo, mats[i % mats.length]);
            cube.position.set(...p);
            cube.castShadow = cube.receiveShadow = true;
            scene.add(cube);
            breakableTargets.push(cube);
        });
    }

    // Entrada desktop
    function onKeyDown(e: KeyboardEvent) {
        if (isTouch) return;
        switch (e.code) {
            case "KeyW": move.forward = true; break;
            case "KeyA": move.left = true; break;
            case "KeyS": move.backward = true; break;
            case "KeyD": move.right = true; break;
            case "Space": if (canJump) velocity.y += 5; canJump = false; break;
        }
    }
    function onKeyUp(e: KeyboardEvent) {
        if (isTouch) return;
        switch (e.code) {
            case "KeyW": move.forward = false; break;
            case "KeyA": move.left = false; break;
            case "KeyS": move.backward = false; break;
            case "KeyD": move.right = false; break;
        }
    }
    function onMouseDown(e: MouseEvent) {
        if (isTouch) return;
        if (e.button === 0) shoot();
    }

    // Disparo
    function shoot() {
        const geom = new THREE.SphereGeometry(0.12, 16, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
        const sphere = new THREE.Mesh(geom, mat);
        sphere.castShadow = true;

        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir).normalize();
        const start = camera.position.clone().add(dir.clone().multiplyScalar(1));
        sphere.position.copy(start);

        const speed = 28;
        const vel = dir.clone().multiplyScalar(speed);

        scene.add(sphere);
        projectiles.push({ mesh: sphere, vel });

        if ((shootSound as any).isBuffer) shootSound.play();
    }

    function spawnRagdollPieces(position: THREE.Vector3) {
        for (let i = 0; i < 14; i++) {
            const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
            const mat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
            const piece = new THREE.Mesh(geo, mat);
            piece.position.copy(position);
            const vel = new THREE.Vector3((Math.random()-0.5)*2, Math.random()*2, (Math.random()-0.5)*2);
            ragdollPieces.push({ mesh: piece, vel });
            piece.castShadow = true;
            scene.add(piece);
        }
    }

    function dropCrateFromSky(x = 0, z = 0) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x9b6b3d }));
        crate.position.set(x, 10, z);
        crate.castShadow = crate.receiveShadow = true;
        scene.add(crate);
        const body: Body = { mesh: crate, vel: new THREE.Vector3(0, 0, 0), asleep: false };
        fallingCrates.push(body);
    }

    // --- Controles móviles (joystick + drag look + botón fire) ---
    function setupMobileHUD() {
        // mostrar HUD
        HUD?.classList.add("show");

        // JOYSTICK (touchstart en base)
        const onStart = (e: TouchEvent) => {
            e.preventDefault();
            const t = e.changedTouches[0];
            joyState.active = true;
            const rect = joyBase.getBoundingClientRect();
            joyState.startX = rect.left + rect.width / 2;
            joyState.startY = rect.top + rect.height / 2;
            updateJoy(t.clientX, t.clientY);
        };
        const onMove = (e: TouchEvent) => {
            if (!joyState.active) return;
            const t = e.changedTouches[0];
            updateJoy(t.clientX, t.clientY);
        };
        const onEnd = (e: TouchEvent) => {
            joyState.active = false;
            joyState.dx = joyState.dy = 0;
            joyState.normX = joyState.normY = 0;
            joyKnob.style.transform = `translate(0px,0px)`;
        };

        joyBase.addEventListener("touchstart", onStart, { passive: false });
        joyBase.addEventListener("touchmove",  onMove,  { passive: false });
        joyBase.addEventListener("touchend",   onEnd,   { passive: false });
        joyBase.addEventListener("touchcancel",onEnd,   { passive: false });

        // MIRADA (arrastre en lookArea)
        let lookActive = false;
        let lastX = 0, lastY = 0;
        const lookStart = (e: TouchEvent) => {
            e.preventDefault();
            lookActive = true;
            const t = e.changedTouches[0];
            lastX = t.clientX; lastY = t.clientY;
        };
        const lookMove = (e: TouchEvent) => {
            if (!lookActive) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - lastX;
            const dy = t.clientY - lastY;
            lastX = t.clientX; lastY = t.clientY;

            yaw   -= dx * (LOOK_SENS * Math.PI/180); // rad
            pitch -= dy * (LOOK_SENS * Math.PI/180);
            const maxPitch = THREE.MathUtils.degToRad(89);
            pitch = THREE.MathUtils.clamp(pitch, -maxPitch, maxPitch);
        };
        const lookEnd = () => { lookActive = false; };

        lookArea.addEventListener("touchstart", lookStart, { passive: false });
        lookArea.addEventListener("touchmove",  lookMove,  { passive: false });
        lookArea.addEventListener("touchend",   lookEnd,   { passive: false });
        lookArea.addEventListener("touchcancel",lookEnd,   { passive: false });

        // DISPARO
        fireBtn.addEventListener("touchstart", (e) => { e.preventDefault(); shoot(); }, { passive: false });
    }

    function updateJoy(x: number, y: number) {
        const dx = x - joyState.startX;
        const dy = y - joyState.startY;
        const dist = Math.min(Math.hypot(dx, dy), JOY_RADIUS);
        const angle = Math.atan2(dy, dx);
        const nx = Math.cos(angle) * (dist / JOY_RADIUS);
        const ny = Math.sin(angle) * (dist / JOY_RADIUS);
        joyState.dx = dx; joyState.dy = dy;
        joyState.normX = nx; joyState.normY = ny;
        joyKnob.style.transform = `translate(${nx*JOY_RADIUS}px, ${ny*JOY_RADIUS}px)`;
    }

    // Animación
    function animate() {
        animationId = requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.05);

        // --- Input de movimiento ---
        if (!isTouch) {
            // teclado
            direction.set(0,0,0);
            direction.z = Number(move.forward) - Number(move.backward);
            direction.x = Number(move.right) - Number(move.left);
        } else {
            // joystick: joyState.normX (derecha+), normY (abajo+)
            // Queremos: adelante = -normY, derecha = +normX
            direction.set(joyState.normX, 0, -joyState.normY);
        }
        direction.normalize();

        // amortiguación + gravedad
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 3.0 * delta;

        const speed = 10.0;
        if (direction.lengthSq() > 0) {
            velocity.z -= direction.z * speed * delta;
            velocity.x -= direction.x * speed * delta;
        }

        // movimiento jugador
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        controls.getObject().position.y += velocity.y * delta;

        // Suelo
        if (controls.getObject().position.y < 1.6) {
            velocity.y = 0;
            controls.getObject().position.y = 1.6;
            canJump = true;
        }

        // Mirar (móvil: aplicamos yaw/pitch manual; desktop: lo hace PointerLock)
        if (isTouch) {
            // rotamos el objeto del control (y cámara para pitch)
            controls.getObject().rotation.y = yaw;
            camera.rotation.x = pitch;
        }

        // Limitar a habitación
        const pos = controls.getObject().position;
        const margin = 1.0;
        pos.x = THREE.MathUtils.clamp(pos.x, -HALF + margin, HALF - margin);
        pos.z = THREE.MathUtils.clamp(pos.z, -HALF + margin, HALF - margin);

        // Proyectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.mesh.position.addScaledVector(p.vel, delta);
            if (Math.abs(p.mesh.position.x) > HALF - 0.3 || Math.abs(p.mesh.position.z) > HALF - 0.3) {
                scene.remove(p.mesh); projectiles.splice(i, 1); continue;
            }
            for (let j = breakableTargets.length - 1; j >= 0; j--) {
                const t = breakableTargets[j];
                const threshold = t.geometry instanceof THREE.BoxGeometry ? 0.6 : 0.5;
                if (p.mesh.position.distanceTo(t.position) < threshold) {
                    if ((hitSound as any).isBuffer) hitSound.play();
                    spawnRagdollPieces(t.position.clone());
                    scene.remove(t); breakableTargets.splice(j,1);
                    scene.remove(p.mesh); projectiles.splice(i,1);
                    const rx = THREE.MathUtils.randFloatSpread(ROOM_SIZE - 4);
                    const rz = THREE.MathUtils.randFloatSpread(ROOM_SIZE - 4);
                    dropCrateFromSky(rx, rz);
                    break;
                }
            }
        }

        // Ragdoll pieces
        for (let i = ragdollPieces.length - 1; i >= 0; i--) {
            const part = ragdollPieces[i];
            part.vel.y -= 9.8 * delta;
            part.vel.multiplyScalar(0.98);
            part.mesh.position.addScaledVector(part.vel, delta);
            if (part.mesh.position.y < 0.02) {
                scene.remove(part.mesh);
                ragdollPieces.splice(i, 1);
            }
        }

        // Física simple de cajas
        const restitution = 0.35, friction = 0.85;
        for (let i = fallingCrates.length - 1; i >= 0; i--) {
            const c = fallingCrates[i];
            if (c.asleep) continue;
            c.vel.y -= 9.8 * 2.2 * delta;
            c.mesh.position.addScaledVector(c.vel, delta);

            const halfH = 0.4;
            if (c.mesh.position.y - halfH < 0) {
                c.mesh.position.y = halfH;
                c.vel.y = -c.vel.y * restitution;
                c.vel.x *= friction; c.vel.z *= friction;
                if (Math.abs(c.vel.y) < 0.5 && Math.hypot(c.vel.x, c.vel.z) < 0.2) {
                    c.vel.set(0,0,0); c.asleep = true;
                }
            }

            const half = 0.4;
            if (c.mesh.position.x > HALF - half) { c.mesh.position.x = HALF - half; c.vel.x = -c.vel.x * restitution; }
            else if (c.mesh.position.x < -HALF + half) { c.mesh.position.x = -HALF + half; c.vel.x = -c.vel.x * restitution; }
            if (c.mesh.position.z > HALF - half) { c.mesh.position.z = HALF - half; c.vel.z = -c.vel.z * restitution; }
            else if (c.mesh.position.z < -HALF + half) { c.mesh.position.z = -HALF + half; c.vel.z = -c.vel.z * restitution; }

            c.mesh.rotation.x += 0.6 * delta;
            c.mesh.rotation.z += 0.4 * delta;
        }

        renderer.render(scene, camera);
    }

    function onWindowResize() {
        if (!container || !camera || !renderer) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || Math.max(200, window.innerHeight * 0.8);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
</script>

<style>
    .sandbox {
        width: 100%;
        height: 80vh;
        border: 2px solid #000;
        border-radius: 8px;
        overflow: hidden;
        cursor: crosshair;
        background: #111;
        position: relative;
    }
    h1 {
        color: #eee;
        margin: 12px 0;
        font-size: 1.2rem;
        text-align: center;
        font-weight: 600;
    }

    /* HUD móvil (oculto por defecto) */
    .hud {
        position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .2s;
    }
    .hud.show { opacity: 1; }

    /* Joystick */
    .joy-base {
        position: absolute; left: 18px; bottom: 18px; width: 140px; height: 140px;
        border-radius: 50%; background: rgba(255,255,255,.06); border: 2px solid rgba(255,255,255,.2);
        pointer-events: auto; touch-action: none;
        display:flex; align-items:center; justify-content:center;
    }
    .joy-knob {
        width: 56px; height: 56px; border-radius: 50%;
        background: rgba(255,255,255,.24); border: 2px solid rgba(255,255,255,.4);
        transform: translate(0,0);
    }

    /* Área de mirada (drag) + botón de disparo */
    .look-area {
        position: absolute; right: 0; bottom: 0; top: 0; width: 55%;
        pointer-events: auto; touch-action: none;
    }
    .fire-btn {
        position: absolute; right: 24px; bottom: 28px;
        width: 84px; height: 84px; border-radius: 50%;
        background: rgba(255,80,80,.35); border: 2px solid rgba(255,120,120,.6);
        pointer-events: auto; touch-action: manipulation; color: #fff;
        font-weight: 700;
    }
</style>

<h1>FPS: Habitación con muebles · Rompe el jarrón o los cubos · Móvil con joystick</h1>
<div bind:this={container} class="sandbox">
    <!-- HUD móvil -->
    <div class="hud" bind:this={HUD}>
        <div class="joy-base" bind:this={joyBase}>
            <div class="joy-knob" bind:this={joyKnob}></div>
        </div>
        <div class="look-area" bind:this={lookArea}></div>
        <button class="fire-btn" bind:this={fireBtn}>FIRE</button>
    </div>
</div>