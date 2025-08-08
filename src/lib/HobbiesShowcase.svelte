<script lang="ts">
    import { fade, fly } from "svelte/transition";

    type Hobby = {
        id: string;
        title: string;
        emoji?: string;
        accent: string;
        blurb: string;
        details: string;
        tags: string[];
    };

    const hobbies: Hobby[] = [
        {
            id: "boxing",
            title: "Boxing",
            emoji: "🥊",
            accent: "#ef4444",
            blurb: "Technique and cardio training.",
            details:
                "Shadow boxing, heavy bag, and jump rope. I love the discipline and how it sharpens coordination and decision-making under pressure.",
            tags: ["Footwork", "Jump Rope", "Heavy Bag", "Discipline"]
        },
        {
            id: "swimming",
            title: "Swimming",
            emoji: "🏊‍♂️",
            accent: "#06b6d4",
            blurb: "Endurance and breathing control.",
            details:
                "Freestyle and breaststroke for distance. I focus on efficient mechanics and breath control — it also keeps me sharp for lifeguarding.",
            tags: ["Freestyle", "Breaststroke", "Breathing", "Endurance"]
        },
        {
            id: "mtg",
            title: "Magic: The Gathering",
            emoji: "🃏",
            accent: "#a855f7",
            blurb: "Strategy and deckbuilding.",
            details:
                "I enjoy midrange/tempo shells and clean synergies. I like testing lines and optimizing decisions.",
            tags: ["Deckbuilding", "Tempo", "Value", "Synergy"]
        },
        {
            id: "metal",
            title: "Metal Detecting (clean beaches)",
            emoji: "🧲",
            accent: "#22c55e",
            blurb: "Find metal, leave beaches cleaner.",
            details:
                "Detect, sort, and recycle. I like mixing the outdoors with a positive impact: removing caps, nails, and small metal from the sand.",
            tags: ["Detector", "Recycling", "Beaches", "Volunteering"]
        }
    ];

    let expanded: string | null = null;
    const toggle = (id: string) => (expanded = expanded === id ? null : id);

    // Svelte action: tilt
    function tilt(node: HTMLElement, max = 10) {
        function onMove(e: PointerEvent) {
            const r = node.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            const rx = (py - 0.5) * -max;
            const ry = (px - 0.5) *  max;
            node.style.setProperty("--rx", `${rx}deg`);
            node.style.setProperty("--ry", `${ry}deg`);
        }
        function reset() {
            node.style.setProperty("--rx", "0deg");
            node.style.setProperty("--ry", "0deg");
        }
        node.addEventListener("pointermove", onMove);
        node.addEventListener("pointerleave", reset);
        return { destroy() {
                node.removeEventListener("pointermove", onMove);
                node.removeEventListener("pointerleave", reset);
            }};
    }
</script>

<section class="hobbies-dock" role="region" aria-label="Hobbies dock">
    <div class="container">
        <div class="dock-header">
            <h2>Hobbies</h2>
            <p class="sub">Things that keep me active, focused, and curious.</p>
        </div>

        <div class="rail" aria-label="Hobbies list">
            {#each hobbies as h}
                <article
                        class="card"
                        style={`--accent:${h.accent}`}
                        tabindex="0"
                        aria-expanded={expanded === h.id}
                        on:click={() => toggle(h.id)}
                        on:keydown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle(h.id))}
                        use:tilt
                        in:fly={{ y: 12, duration: 220 }}
                        out:fade={{ duration: 120 }}
                >
                    <div class="top">
                        <div class="emoji" aria-hidden="true">{h.emoji}</div>
                        <h3>{h.title}</h3>
                        <p class="blurb">{h.blurb}</p>
                        <div class="tags">
                            {#each h.tags as t}<span class="tag">{t}</span>{/each}
                        </div>
                    </div>

                    {#if expanded === h.id}
                        <div class="details" in:fade={{ duration: 140 }}>
                            <p>{h.details}</p>
                        </div>
                    {/if}
                </article>
            {/each}
        </div>
    </div>
</section>

<style>
    /* Dock wrapper fixed to bottom */
    .hobbies-dock {
        position: fixed;
        left: 0; right: 0; bottom: 0;
        z-index: 50;
        padding: max(10px, env(safe-area-inset-bottom)) 12px calc(10px + env(safe-area-inset-bottom));
        backdrop-filter: blur(10px);
        background:
                linear-gradient(180deg, rgba(255,255,255,.65), rgba(255,255,255,.78)) /* light glass */;
        border-top: 1px solid rgba(0,0,0,.08);
    }
    .container {
        width: min(100%, 1100px);
        margin: 0 auto;
    }

    /* Header row */
    .dock-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin: 0 6px 8px;
    }
    .dock-header h2 {
        margin: 0;
        font-size: clamp(1rem, 2.6vw, 1.2rem);
        letter-spacing: .02em;
    }
    .sub {
        margin: 0;
        color: #475569;
        font-size: .9rem;
        opacity: .9;
    }

    /* Horizontal rail (mobile) that turns grid on wide screens */
    .rail {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: min(78vw, 280px);
        gap: 12px;
        overflow-x: auto;
        padding: 6px 4px 2px;
        scroll-snap-type: x mandatory;
    }
    .rail::-webkit-scrollbar { height: 8px; }
    .rail::-webkit-scrollbar-thumb { background: rgba(0,0,0,.25); border-radius: 8px; }

    @media (min-width: 900px) {
        .rail {
            grid-auto-flow: initial;
            grid-auto-columns: initial;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            overflow: visible;
        }
    }

    .card {
        scroll-snap-align: start;
        position: relative;
        background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.86));
        border: 1px solid rgba(0,0,0,.08);
        border-radius: 14px;
        padding: 14px 14px 10px;
        box-shadow: 0 10px 22px rgba(0,0,0,.08);
        cursor: pointer;
        transform: perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
        transition: transform .12s ease, box-shadow .2s ease, background .2s ease;
        outline: none;
    }
    .card:hover, .card:focus-visible {
        box-shadow: 0 16px 34px rgba(0,0,0,.12);
        background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.9));
    }
    .card::after {
        content: "";
        position: absolute; inset: 0 0 auto 0; height: 3px; border-radius: 14px 14px 0 0;
        background: var(--accent, #60a5fa);
    }

    .top { display: grid; gap: 6px; }
    .emoji { font-size: 26px; line-height: 1; }
    h3 { margin: 0; font-size: clamp(1rem, 2.5vw, 1.12rem); }
    .blurb { margin: 0; color: #374151; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .tag {
        font-size: .75rem; padding: 4px 8px; border-radius: 999px;
        background: color-mix(in oklab, var(--accent) 18%, white);
        color: #111827; border: 1px solid color-mix(in oklab, var(--accent) 35%, #0000);
    }

    .details {
        margin-top: 10px; padding-top: 10px;
        border-top: 1px dashed rgba(0,0,0,.12); color: #1f2937;
    }

    /* Make space at page bottom so content above isn't covered by the dock
       (only needed if you mount dock over page content; otherwise ignore) */
    :global(body) { padding-bottom: 190px; }

    @media (prefers-color-scheme: dark) {
        .hobbies-dock {
            background: linear-gradient(180deg, rgba(17,17,17,.78), rgba(17,17,17,.86));
            border-top-color: rgba(255,255,255,.08);
        }
        .sub { color: #9aa3ad; }
        .card {
            background: linear-gradient(180deg, rgba(17,17,17,.95), rgba(17,17,17,.88));
            border-color: rgba(255,255,255,.08);
            box-shadow: 0 10px 28px rgba(0,0,0,.35);
        }
        .card:hover, .card:focus-visible {
            background: linear-gradient(180deg, rgba(24,24,24,.96), rgba(24,24,24,.9));
        }
        .blurb { color: #d1d5db; }
        .details { color: #e5e7eb; border-top-color: rgba(255,255,255,.12); }
        .tag {
            background: color-mix(in oklab, var(--accent) 22%, #111);
            color: #e5e7eb; border-color: color-mix(in oklab, var(--accent) 45%, #0000);
        }
    }

    @supports not (background: color-mix(in oklab, red 10%, white)) {
        .tag { background: rgba(0,0,0,.06); border-color: rgba(0,0,0,.12); }
        @media (prefers-color-scheme: dark) {
            .tag { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.18); }
        }
    }
</style>