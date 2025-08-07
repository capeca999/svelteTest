<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    let dosInstance: any;
    let canvasEl: HTMLCanvasElement | null = null;

    function loadScript(src: string) {
        return new Promise<void>((res, rej) => {
            const s = document.createElement("script");
            s.src = src;
            s.onload = () => res();
            s.onerror = rej;
            document.head.appendChild(s);
        });
    }

    onMount(async () => {
        await loadScript("https://js-dos.com/6.22/current/js-dos.js");
        const Dos = (window as any).Dos;
        if (!Dos) throw new Error("No se ha cargado js-dos 6.22");

        dosInstance = Dos(canvasEl, {
            wdosboxUrl: "https://js-dos.com/6.22/current/wdosbox.js",
        });

        dosInstance.ready(async (fs: any, main: any) => {
            await fs.extract("/doom.zip");

            // Tweaks de rendimiento: baja cycles y sube frameskip
            // Si necesitas aún más, descomenta las líneas de audio
            main([
                "-c", "cd doom",
                "-c", "config -set cycles=20000",     // 12k suele ir fluido; prueba 8000 o 20000 según tu equipo
                "-c", "config -set frameskip=0",      // salta frames para aligerar
                // "-c", "config -set sblaster=false", // desactiva SoundBlaster
                // "-c", "config -set gus=false",      // desactiva Gravis Ultrasound
                // "-c", "config -set speaker=false",  // desactiva PC speaker
                "-c", "DOOM.EXE"
            ]);
        });
    });

    function salir() {
        try { dosInstance?.exit?.(); } catch {}
        // Limpia el canvas y referencias
        if (canvasEl) {
            const ctx = canvasEl.getContext("2d");
            ctx?.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }
        dosInstance = null;
    }

    onDestroy(() => salir());
</script>

<svelte:head>
    <link rel="stylesheet" href="https://js-dos.com/6.22/current/js-dos.css" />
</svelte:head>

<style>
    /* Más pequeño = menos coste de pintado; pixels nítidos */
    #jsdos {
        width: 640px;   /* prueba 640x400 o incluso 480x360 si va justo */
        height: 400px;
        border: 3px solid #000;
        margin: 0 auto;
        display: block;
        image-rendering: pixelated; /* mantiene el look retro al escalar */
    }
    .controls { text-align:center; margin: 8px 0; }
</style>

<h1>DOOM en el navegador (js-dos)</h1>
<canvas id="jsdos" bind:this={canvasEl}></canvas>
<div class="controls">
    <button on:click={salir}>Salir</button>
</div>
