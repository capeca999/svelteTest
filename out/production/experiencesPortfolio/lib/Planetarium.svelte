<script lang="ts">
    import {
        Canvas,
        PerspectiveCamera,
        AmbientLight,
        PointLight,
        Mesh,
    } from 'svelte-cubed';
    import * as THREE from 'three';
    import { onMount } from 'svelte';

    const textureLoader = new THREE.TextureLoader();

    const planets = [
        { name: 'Mercurio', texture: '/assets/textures/mercury.jpg', distance: 3, radius: 0.3, info: 'Es el planeta más cercano al Sol.', speed: 0.02 },
        { name: 'Venus', texture: '/assets/textures/venus.jpg', distance: 5, radius: 0.5, info: 'Tiene una atmósfera densa y ácida.', speed: 0.015 },
        { name: 'Tierra', texture: '/assets/textures/earth.jpg', distance: 7, radius: 0.55, info: '¡Nuestro hogar!', speed: 0.01 },
        { name: 'Marte', texture: '/assets/textures/mars.jpg', distance: 9, radius: 0.4, info: 'El planeta rojo.', speed: 0.008 }
    ];

    let selected: typeof planets[number] | null = null;
    let camera: THREE.Camera;
    let scene: THREE.Scene;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    const angles = planets.map(() => Math.random() * Math.PI * 2);
    let meshes: (THREE.Mesh | null)[] = [];
    let canvasEl: HTMLCanvasElement;

    onMount(() => {
        canvasEl.addEventListener('pointerdown', handleClick);
    });

    function handleClick(event: PointerEvent) {
        const rect = canvasEl.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        if (!camera || !scene) return;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        const hit = intersects.find(i => i.object.userData?.planet);
        selected = hit ? hit.object.userData.planet : null;
    }
</script>

<style>
    .info-box {
        position: absolute;
        top: 10%;
        left: 10%;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 1rem;
        border-radius: 1rem;
        max-width: 300px;
        z-index: 100;
        animation: fadein 0.4s ease;
    }

    @keyframes fadein {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>

{#if selected}
    <div class="info-box">
        <h4>{selected.name}</h4>
        <p>{selected.info}</p>
        <button class="btn btn-light btn-sm" on:click={() => (selected = null)}>Cerrar</button>
    </div>
{/if}

<!-- Planetario 3D -->
<div style="height: 100vh;">
    <Canvas
            on:create={(e) => {
		scene = e.detail.scene;
		canvasEl = e.detail.gl.domElement;
	}}
    >        <PerspectiveCamera position={[0, 5, 20]} on:create={(e) => (camera = e.detail.camera)} />
        <AmbientLight intensity={0.3} />
        <PointLight position={[0, 0, 0]} intensity={1.5} />

        <!-- Sol -->
        <Mesh
                geometry={new THREE.SphereGeometry(1.2, 32, 32)}
                material={new THREE.MeshStandardMaterial({
				map: textureLoader.load('/assets/textures/sun.jpg'),
				emissive: new THREE.Color('orange')
			})}
        />

        {#each planets as planet, i}
            <Mesh
                    bind:this={(el) => (meshes[i] = el as THREE.Mesh)}
                    geometry={new THREE.SphereGeometry(planet.radius, 32, 32)}
                    material={new THREE.MeshStandardMaterial({
					map: textureLoader.load(planet.texture)
				})}
                    tick={() => {
					const mesh = meshes[i];
					if (mesh) {
						const angle = (angles[i] += planet.speed);
						mesh.position.set(Math.cos(angle) * planet.distance, 0, Math.sin(angle) * planet.distance);
						mesh.rotation.y += 0.01;
						mesh.userData.planet = planet;
					}
				}}
            />
        {/each}
    </Canvas>
</div>