<!-- LandingIntro.svelte -->
<script lang="ts">
    import { fade, fly, scale } from "svelte/transition";
    import { onMount } from "svelte";
    import Ps2Intro from "./Ps2Intro.svelte";
    import HobbiesShowcase from "./HobbiesShowcase.svelte";
    let ready = false;   // se pone a true cuando termina la intro PS2
    let show = false;    // controla animaciones de avatar/chips

    // Typewriter
    export let intro = `Hi! I'm **Francisco Manuel Pinazo Guna**, a **Full Stack Developer** passionate about turning complex ideas into elegant, scalable solutions. Beyond my love for coding and building systems, I completed a **Flight Attendant course** driven by my interest in aviation and high-trust team coordination, and I'm also a **Certified Lifeguard**, fueled by sports like boxing and swimming and a commitment to help when it's needed. Technology, teamwork, and readiness to act — these shape not just my career, but the way I approach life.`;

    let rendered = "";
    let speed = 12; // ms por carácter
    let started = false;

    // Arranca el typewriter cuando la intro PS2 termina
    $: if (ready && !started) {
        started = true;
        startTypewriter();
    }

    async function startTypewriter() {
        show = true;

        const clean = intro.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
        for (let i = 0; i <= clean.length; i++) {
            rendered = clean.slice(0, i);
            await new Promise((r) => setTimeout(r, speed));
        }
    }

    onMount(() => {
        setTimeout(() => { if (!ready) ready = true; }, 0);
    });
</script>

<Ps2Intro on:done={() => (ready = true)} />

{#if ready}
    <section class="intro">
        <div class="container">
            <div class="avatar-wrap" in:scale={{ duration: 350 }}>
                <div class="avatar" style="background-image: url('/assets/img/avatars/me.jpg')" />
            </div>

            <div class="chips">
                <div class="chip" in:fly={{ y: 12, duration: 300, delay: 150 }}>
                    <span class="icon">💻</span> Programming
                </div>
                <div class="chip" in:fly={{ y: 12, duration: 300, delay: 250 }}>
                    <span class="icon">✈️</span> Aviation (Flight Attendant)
                </div>
                <div class="chip" in:fly={{ y: 12, duration: 300, delay: 350 }}>
                    <span class="icon">🛟</span> Lifeguarding & Sports
                </div>
            </div>

            <p class="lead" in:fade={{ duration: 200, delay: 400 }}>
                {rendered}<span class="cursor" aria-hidden="true" />
            </p>

            <a class="cta" href="/hire-me" in:fly={{ y: 10, duration: 250, delay: 600 }}>Hire me</a>
        </div>
    </section>
    <HobbiesShowcase />
{/if}

<style>
    .intro { padding: clamp(56px, 7vw, 120px) 16px 48px; display: grid; place-items: center; }
    .container { width: min(100%, 920px); display: grid; justify-items: center; gap: 20px; text-align: center; }
    .avatar-wrap { position: relative; }
    .avatar { width: clamp(110px, 12vw, 150px); aspect-ratio: 4/5; border-radius: 999px; background-size: cover; background-position: center; box-shadow: 0 10px 30px rgba(0,0,0,.18); border: 3px solid rgba(255,255,255,.7); }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
    .chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 999px; background: rgba(0,0,0,.05); backdrop-filter: blur(6px); font-weight: 600; transition: transform .2s, box-shadow .2s; cursor: default; }
    .chip:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,.1); }
    .icon { font-size: 1.1rem; line-height: 1; }
    .lead { font-size: clamp(1rem, 2.2vw, 1.15rem); line-height: 1.75; max-width: 60ch; color: #333; }
    .cursor { display: inline-block; width: 10px; height: 1.1em; margin-left: 2px; background: currentColor; opacity: .75; animation: blink 1s steps(1) infinite; vertical-align: -2px; }
    @keyframes blink { 50% { opacity: 0; } }
    .cta { display: inline-block; padding: 10px 18px; border-radius: 12px; border: 1px solid rgba(0,0,0,.1); text-decoration: none; font-weight: 700; transition: transform .15s, box-shadow .2s, background .2s; background: white; box-shadow: 0 4px 14px rgba(0,0,0,.08); }
    .cta:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(0,0,0,.12); }
    .cta:active { transform: translateY(0); }
    @media (prefers-color-scheme: dark) {
        .lead { color: #ddd; }
        .chip { background: rgba(255,255,255,.06); }
        .cta { background: #111; color: #fafafa; border-color: rgba(255,255,255,.08); }
        .avatar { border-color: rgba(255,255,255,.2); }
    }
</style>