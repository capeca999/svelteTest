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
        if (renderer) {
            renderer.dispose();
        }
    }

    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1f1f1f);

        camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.shadowMap.enabled = true;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Controles FPS
        controls = new PointerLockControls(camera, document.body);
        scene.add(controls.getObject());
        container.addEventListener("click", () => controls.lock());

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
        ceil.receiveShadow = false;
        scene.add(ceil);

        // Paredes (4)
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, side: THREE.DoubleSide });
        const wallGeo = new THREE.PlaneGeometry(ROOM_SIZE, 6);

        const wallN = new THREE.Mesh(wallGeo, wallMat);
        wallN.position.set(0, 3, -HALF);
        wallN.receiveShadow = true;
        scene.add(wallN);

        const wallS = new THREE.Mesh(wallGeo, wallMat);
        wallS.rotation.y = Math.PI;
        wallS.position.set(0, 3, HALF);
        wallS.receiveShadow = true;
        scene.add(wallS);

        const wallE = new THREE.Mesh(wallGeo, wallMat);
        wallE.rotation.y = -Math.PI / 2;
        wallE.position.set(HALF, 3, 0);
        wallE.receiveShadow = true;
        scene.add(wallE);

        const wallW = new THREE.Mesh(wallGeo, wallMat);
        wallW.rotation.y = Math.PI / 2;
        wallW.position.set(-HALF, 3, 0);
        wallW.receiveShadow = true;
        scene.add(wallW);

        // Muebles (sencillos)
        const tableTop = addFurniture();

        // Cubos de tecnologías encima de la mesa (rompibles)
        addTechCubesOnTable(tableTop);

        // Arma (dummy en cámara)
        const gun = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.2, 1),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        gun.position.set(0.5, -0.4, -1.2);
        camera.add(gun);

        // Cámara/posición inicial
        controls.getObject().position.set(0, 1.6, 4);

        // Sonido
        const listener = new THREE.AudioListener();
        camera.add(listener);
        shootSound = new THREE.Audio(listener);
        hitSound = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load("/assets/sounds/shoot.mp3", (b) => shootSound.setBuffer(b));
        audioLoader.load("/assets/sounds/hit.mp3", (b) => hitSound.setBuffer(b));

        // Eventos
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);
        document.addEventListener("mousedown", onMouseDown);
        window.addEventListener("resize", onWindowResize);
        onWindowResize();
    }

    function addFurniture() {
        // Mesa en el centro
        const tableTop = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.2, 1.6),
            new THREE.MeshStandardMaterial({ color: 0x7a5a3a })
        );
        tableTop.position.set(0, 1, 0);
        tableTop.castShadow = true;
        tableTop.receiveShadow = true;
        scene.add(tableTop);

        const legGeo = new THREE.BoxGeometry(0.15, 1, 0.15);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x5c4129 });
        const legs = [
            new THREE.Mesh(legGeo, legMat),
            new THREE.Mesh(legGeo, legMat),
            new THREE.Mesh(legGeo, legMat),
            new THREE.Mesh(legGeo, legMat)
        ];
        const legOffsetX = 1.3, legOffsetZ = 0.65;
        legs[0].position.set( legOffsetX, 0.5,  legOffsetZ);
        legs[1].position.set(-legOffsetX, 0.5,  legOffsetZ);
        legs[2].position.set( legOffsetX, 0.5, -legOffsetZ);
        legs[3].position.set(-legOffsetX, 0.5, -legOffsetZ);
        legs.forEach(l => { l.castShadow = true; l.receiveShadow = true; scene.add(l); });

        // Sofá
        const sofa = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 1, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x3a6a7a })
        );
        sofa.position.set(-5, 0.5, -3);
        sofa.castShadow = true;
        sofa.receiveShadow = true;
        scene.add(sofa);

        // Estantería
        const shelf = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 2.4, 2.5),
            new THREE.MeshStandardMaterial({ color: 0x553333 })
        );
        shelf.position.set(8, 1.2, 0);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        scene.add(shelf);

        // Lámpara de pie
        const lampBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 1.2, 16),
            new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
        );
        lampBase.position.set(5, 0.6, -6);
        lampBase.castShadow = true;
        lampBase.receiveShadow = true;
        scene.add(lampBase);
        const lampShade = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 0.6, 24),
            new THREE.MeshStandardMaterial({ color: 0xdddddd })
        );
        lampShade.position.set(5, 1.5, -6);
        lampShade.castShadow = true;
        lampShade.receiveShadow = true;
        scene.add(lampShade);

        // Jarrón sobre la mesa (target rompible)
        const vase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.15, 0.5, 24),
            new THREE.MeshStandardMaterial({ color: 0xbfd8f5 })
        );
        vase.position.set(0, 1.25, 0);
        vase.castShadow = true;
        vase.receiveShadow = true;
        scene.add(vase);
        breakableTargets.push(vase);

        return tableTop;
    }

    // Cubos tech (Svelte, TypeScript, Vercel) sobre la mesa
    function addTechCubesOnTable(tableTop: THREE.Mesh) {
        const loader = new THREE.TextureLoader();
        const texPaths = [
            "/assets/img/tech/svelte.png",
            "/assets/img/tech/type.png",
            "/assets/img/tech/vercel.webp"
        ];
        const mats = texPaths.map(p => new THREE.MeshStandardMaterial({ map: loader.load(p) }));

        const size = 0.7; // tamaño del cubo
        const cubeGeo = new THREE.BoxGeometry(size, size, size);
        const y = tableTop.position.y + 0.2 + size / 2 + 0.02; // justo encima del tablero

        // posiciones sobre la mesa (tres cubos)
        const positions: Array<[number, number, number]> = [
            [-0.9, y,  0.0], // izquierda
            [ 0.0, y,  0.0], // centro
            [ 0.9, y,  0.0], // derecha
        ];

        positions.forEach((pos, i) => {
            const cube = new THREE.Mesh(cubeGeo, mats[i % mats.length]);
            cube.position.set(pos[0], pos[1], pos[2]);
            cube.castShadow = true;
            cube.receiveShadow = true;
            scene.add(cube);
            breakableTargets.push(cube);
        });
    }

    // Entrada
    function onKeyDown(e: KeyboardEvent) {
        switch (e.code) {
            case "KeyW": move.forward = true; break;
            case "KeyA": move.left = true; break;
            case "KeyS": move.backward = true; break;
            case "KeyD": move.right = true; break;
            case "Space":
                if (canJump) velocity.y += 5;
                canJump = false;
                break;
        }
    }
    function onKeyUp(e: KeyboardEvent) {
        switch (e.code) {
            case "KeyW": move.forward = false; break;
            case "KeyA": move.left = false; break;
            case "KeyS": move.backward = false; break;
            case "KeyD": move.right = false; break;
        }
    }
    function onMouseDown(e: MouseEvent) {
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

        const speed = 28; // más rápido para una sensación FPS
        const vel = dir.clone().multiplyScalar(speed);

        scene.add(sphere);
        projectiles.push({ mesh: sphere, vel });

        if ((shootSound as any).isBuffer) shootSound.play();
    }

    // Ragdoll "chispas"
    function spawnRagdollPieces(position: THREE.Vector3) {
        for (let i = 0; i < 14; i++) {
            const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
            const mat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
            const piece = new THREE.Mesh(geo, mat);
            piece.position.copy(position);
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
            ragdollPieces.push({ mesh: piece, vel });
            piece.castShadow = true;
            scene.add(piece);
        }
    }

    // Al romper, cae una caja del cielo
    function dropCrateFromSky(x = 0, z = 0) {
        const crate = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x9b6b3d })
        );
        crate.position.set(x, 10, z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        scene.add(crate);

        const body: Body = { mesh: crate, vel: new THREE.Vector3(0, 0, 0), asleep: false };
        fallingCrates.push(body);
    }

    // Animación
    function animate() {
        animationId = requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.05); // cap por estabilidad

        // amortiguación
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 3.0 * delta; // gravedad jugador

        direction.z = Number(move.forward) - Number(move.backward);
        direction.x = Number(move.right) - Number(move.left);
        direction.normalize();

        const speed = 10.0;
        if (move.forward || move.backward) velocity.z -= direction.z * speed * delta;
        if (move.left || move.right) velocity.x -= direction.x * speed * delta;

        // movimiento jugador
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        controls.getObject().position.y += velocity.y * delta;

        // Suelo para jugador
        if (controls.getObject().position.y < 1.6) {
            velocity.y = 0;
            controls.getObject().position.y = 1.6;
            canJump = true;
        }

        // Limitar a la habitación
        const pos = controls.getObject().position;
        const margin = 1.0;
        pos.x = THREE.MathUtils.clamp(pos.x, -HALF + margin, HALF - margin);
        pos.z = THREE.MathUtils.clamp(pos.z, -HALF + margin, HALF - margin);

        // Proyectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.mesh.position.addScaledVector(p.vel, delta);

            // colisión con paredes: destruir bala
            if (Math.abs(p.mesh.position.x) > HALF - 0.3 || Math.abs(p.mesh.position.z) > HALF - 0.3) {
                scene.remove(p.mesh);
                projectiles.splice(i, 1);
                continue;
            }

            // hit con targets rompibles (jarrón + cubos tech)
            for (let j = breakableTargets.length - 1; j >= 0; j--) {
                const t = breakableTargets[j];

                // Umbral de impacto un poco mayor para cubos
                const threshold = t.geometry instanceof THREE.BoxGeometry ? 0.6 : 0.5;

                if (p.mesh.position.distanceTo(t.position) < threshold) {
                    if ((hitSound as any).isBuffer) hitSound.play();
                    spawnRagdollPieces(t.position.clone());

                    // eliminar target
                    scene.remove(t);
                    breakableTargets.splice(j, 1);
                    // eliminar proyectil
                    scene.remove(p.mesh);
                    projectiles.splice(i, 1);

                    // lanzar caja desde el cielo, caída dentro de la habitación
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

        // Física simple de cajas que caen
        const restitution = 0.35; // rebote
        const friction = 0.85;    // fricción horizontal al tocar suelo
        for (let i = fallingCrates.length - 1; i >= 0; i--) {
            const c = fallingCrates[i];
            if (c.asleep) continue;

            // gravedad
            c.vel.y -= 9.8 * 2.2 * delta;
            // integrar
            c.mesh.position.addScaledVector(c.vel, delta);

            // colisión con suelo (y=0.4 por la mitad de la caja ~0.4)
            const halfH = 0.4;
            if (c.mesh.position.y - halfH < 0) {
                c.mesh.position.y = halfH;
                // rebote vertical
                c.vel.y = -c.vel.y * restitution;
                // fricción
                c.vel.x *= friction;
                c.vel.z *= friction;

                // dormir si velocidad muy baja
                if (Math.abs(c.vel.y) < 0.5 && Math.hypot(c.vel.x, c.vel.z) < 0.2) {
                    c.vel.set(0, 0, 0);
                    c.asleep = true;
                }
            }

            // colisión con paredes (simple clamp con rebote)
            const half = 0.4;
            if (c.mesh.position.x > HALF - half) {
                c.mesh.position.x = HALF - half;
                c.vel.x = -c.vel.x * restitution;
            } else if (c.mesh.position.x < -HALF + half) {
                c.mesh.position.x = -HALF + half;
                c.vel.x = -c.vel.x * restitution;
            }
            if (c.mesh.position.z > HALF - half) {
                c.mesh.position.z = HALF - half;
                c.vel.z = -c.vel.z * restitution;
            } else if (c.mesh.position.z < -HALF + half) {
                c.mesh.position.z = -HALF + half;
                c.vel.z = -c.vel.z * restitution;
            }

            // ligera rotación para que no caiga totalmente rígida
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
    }
    h1 {
        color: #eee;
        margin: 12px 0;
        font-size: 1.2rem;
        text-align: center;
        font-weight: 600;
    }
</style>

<h1>FPS: Habitación con muebles · Rompe el jarrón o los cubos para que caiga una caja</h1>
<div bind:this={container} class="sandbox" />