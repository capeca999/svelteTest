<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    let dosInstance: any; // para guardar la instancia y matarla al salir

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
        await loadScript("/lib/js-dos.js"); // expone window.Dos
        // @ts-ignore
        const Dos = window.Dos;

        const container = document.getElementById("jsdos");
        dosInstance = Dos(container, { wdosboxUrl: "/wdosbox.js" });

        dosInstance.ready(async (fs: any, main: any) => {
            await fs.extract("/doom.zip"); // si quieres extraer todos los archivos
            main(["doom/DOOM.EXE", "-file", "doom/doom.wad"]);
        });
    });

    onDestroy(() => {
        if (dosInstance && typeof dosInstance.exit === "function") {
            dosInstance.exit(); // apaga DOOM y libera recursos
        }
    });
</script>

<style>
    #jsdos {
        width: 800px;
        height: 600px;
        border: 3px solid #000;
        margin: 0 auto;
        display: block;
    }
</style>

<h1>DOOM en el navegador (js-dos)</h1>
<div id="jsdos"></div>