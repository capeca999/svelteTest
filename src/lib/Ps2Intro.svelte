<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    const KEY = "ps2IntroSeen";
    const dispatch = createEventDispatcher();

    const CUT_AT = 10; // ⏱️ segundos: corta la intro al segundo 10

    let show = false;        // muestra/oculta overlay
    let started = false;     // evita doble inicio
    let audioEl: HTMLAudioElement;
    let onTick: (() => void) | null = null;
    let endTimer: number | null = null;

    onMount(() => {
        try {
            if (localStorage.getItem(KEY) === "1") {
                dispatch("done");
                return;
            }
        } catch {}

        requestAnimationFrame(() => { show = true; });
    });

    function cleanupAudioWatchers() {
        if (onTick && audioEl) audioEl.removeEventListener("timeupdate", onTick as EventListener);
        onTick = null;
        if (endTimer) { clearTimeout(endTimer); endTimer = null; }
    }

    function finish() {
        cleanupAudioWatchers();
        try { localStorage.setItem(KEY, "1"); } catch {}
        show = false;
        setTimeout(() => dispatch("done"), 300);
    }

    async function start() {
        if (started || !audioEl) return;
        started = true;

        // Espera a que pueda reproducir con fluidez (mejora iOS/Chrome)
        if (audioEl.readyState < 3) {
            await new Promise((res) => {
                const r = () => res(true);
                audioEl.addEventListener("canplaythrough", r, { once: true });
                setTimeout(r, 1500);
            });
        }

        try {
            audioEl.currentTime = 0;
            audioEl.volume = 1;
            await audioEl.play();
        } catch (err) {
            // Si play() falla, deja reintentar con otro tap
            started = false;
            return;
        }

        // 🔪 Corte duro a los 10s
        onTick = () => {
            if (audioEl.currentTime >= CUT_AT) {
                audioEl.pause();
                finish();
            }
        };
        audioEl.addEventListener("timeupdate", onTick as EventListener);

        // Fallback: por si 'timeupdate' no saltara lo suficiente en algún navegador
        endTimer = window.setTimeout(() => {
            if (!audioEl.paused) audioEl.pause();
            finish();
        }, (CUT_AT * 1000) + 200);

        // Si el audio real termina antes de 10s, también cerramos
        audioEl.addEventListener("ended", () => { finish(); }, { once: true });
    }

    function skip(e: MouseEvent) {
        e.stopPropagation();
        if (audioEl) audioEl.pause();
        finish();
    }
</script>

{#if show}
    <div class="ps2-intro ps2-scanlines show" role="dialog" aria-label="PlayStation 2 intro"
         on:click|once={start} on:touchstart|passive={start}>
        <div class="ps2-orb" aria-hidden="true"></div>
        <div class="ps2-logo ps2-glow">Welcome To My CV</div>
        <div class="ps2-sub">Hope you like it</div>
        <div class="ps2-press">Loading</div>
        <button class="ps2-btn" type="button" on:click={skip}>Skip</button>
        <audio bind:this={audioEl} preload="auto" src="/assets/sounds/ps2.mp3" playsinline
               on:error={() => finish()} />
    </div>
{/if}

<style>
    .ps2-intro {
        position: fixed; inset: 0; z-index: 99999;
        background: radial-gradient(1200px 700px at 50% 60%, rgba(0,120,255,0.25), rgba(0,0,30,0.95) 60%), #000818;
        display: flex; align-items: center; justify-content: center; flex-direction: column;
        overflow: hidden; color: #bfe2ff; letter-spacing: 0.02em;
        opacity: 0; pointer-events: none; transition: opacity .3s ease;
    }
    .ps2-intro.show { opacity: 1; pointer-events: auto; }

    .ps2-scanlines::before {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        background: repeating-linear-gradient(0deg, rgba(255,255,255,.04), rgba(255,255,255,.04) 1px, transparent 2px, transparent 3px);
        mix-blend-mode: overlay; opacity: .35; animation: scan 6s linear infinite;
    }
    @keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(3px); } }

    .ps2-glow { text-shadow: 0 0 12px rgba(0,160,255,.8), 0 0 28px rgba(0,160,255,.35); }
    .ps2-logo {
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        font-weight: 700; font-size: clamp(28px, 4.8vw, 64px);
        letter-spacing: .08em; color: #7dd3ff; opacity: 0; transform: translateY(12px) scale(1.02);
        animation: ps2-in 1.2s ease forwards 0.1s, ps2-pulse 2.6s ease-in-out infinite 1.4s;
    }
    .ps2-sub {
        margin-top: .6rem; font-size: clamp(12px, 1.8vw, 16px); opacity: 0;
        color: #c8eaff; letter-spacing: .2em;
        animation: fade-in .9s ease forwards 0.9s;
    }
    @keyframes ps2-in { 0% { opacity:0; transform: translateY(18px) scale(1.04); filter: blur(3px); }
        60% { opacity:1; transform: translateY(0) scale(1); filter: blur(0); }
        100% { opacity:1; } }
    @keyframes ps2-pulse { 0%,100% { filter: none; } 50% { filter: drop-shadow(0 0 14px rgba(0,150,255,.4)); } }
    @keyframes fade-in { to { opacity:1 } }

    .ps2-orb {
        position: absolute; width: 120vmax; height: 120vmax; border-radius: 50%;
        background: radial-gradient(closest-side, rgba(0,140,255,.27), rgba(0,60,130,.08) 60%, transparent 70%);
        filter: blur(8px); opacity: 0.35; animation: orb-move 7s ease-in-out infinite;
    }
    @keyframes orb-move { 0% { transform: translate(-15%, -10%) scale(1); }
        50% { transform: translate(10%, 6%) scale(1.06); }
        100% { transform: translate(-15%, -10%) scale(1); } }

    .ps2-press {
        position: absolute; bottom: 12vh; left: 0; right: 0; text-align: center; color: #a7d8ff;
        font-size: 14px; letter-spacing: .15em; opacity: 0; animation: fade-in .8s ease forwards .9s, blink 1.6s ease-in-out infinite 2.2s;
    }
    @keyframes blink { 0%,100% { opacity:.8 } 50% { opacity:.3 } }

    .ps2-btn {
        position: absolute; bottom: 32px; right: 28px;
        background: rgba(255,255,255,.06); color: #e6f6ff; border: 1px solid rgba(255,255,255,.18);
        padding: 8px 14px; border-radius: 8px; cursor: pointer; backdrop-filter: blur(6px);
        transition: background .2s, transform .08s;
    }
    .ps2-btn:hover { background: rgba(255,255,255,.12); }
    .ps2-btn:active { transform: translateY(1px) scale(.99); }

    @media (prefers-reduced-motion: reduce) {
        .ps2-intro, .ps2-scanlines::before, .ps2-logo, .ps2-orb { animation: none !important; }
    }
</style>
