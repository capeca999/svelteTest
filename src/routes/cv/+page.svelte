<script>
    import { fade, fly } from "svelte/transition";

    let activeTab = "studies";

    const delayFor = (i) => 60 + i * 55;

    function fadeFly(node, params) {
        const f = fade(node, params);
        const fl = fly(node, params);
        return {
            delay: params?.delay ?? 0,
            duration: Math.max(f.duration, fl.duration),
            css: (t, u) => f.css(t, u) + fl.css(t, u)
        };
    }

    const studies = [
        {
            img: "assets/img/schools/rodrigo.png",
            date: "06/2018",
            title: "I.E.S José Rodrigo Botet ",
            desc: "Intermediate Vocational Training in Microcomputer Systems and Networks"
        },
        {
            img: "assets/img/schools/rodrigo.png",
            date: "06/2020",
            title: "I.E.S José Rodrigo Botet",
            desc: "Higher Vocational Training in Web Application Development"
        },
        {
            img: "assets/img/schools/serra.jpg",
            date: "06/2021",
            title: "I.E.S Serra Perenxisa",
            desc: "Higher Vocational Training in Multiplatform Application Development"
        },
        {
            img: "assets/img/schools/c1.jpg",
            date: "06/2022",
            title: "Official School Of Languages Quart De Poblet",
            desc: "C1 in English at Official School of Languages"
        },
        {
            img: "assets/img/schools/aws.webp",
            date: "02/2023",
            title: "AWS Certified Cloud Practitioner",
            desc: "Certification. Foundational level. Issued by Amazon Web Services"
        },
        {
            img: "assets/img/schools/azure.png",
            date: "08/2023",
            title: "Microsoft Certified: Azure Fundamentals",
            desc: "Azure Fundamentals Issued by Microsoft"
        },
        {
            img: "assets/img/schools/global.jpg",
            date: "07/2024",
            title: "Global Crew TCP Training",
            desc: "Certified Flight Attendant License"
        },
        {
            img: "assets/img/schools/soco.png",
            date: "07/2025",
            title: "ENSSAP Valencia",
            desc: "Certified Lifeguard with AED Authorization"
        },
        {
            img: "assets/img/schools/medac.png",
            date: "06/2026",
            title: "Medac Valencia",
            desc: "Master in AI and Big Data"
        }
    ];

    const work = [
        {
            img: "assets/img/companies/ford.jpg",
            date: "03/2017 - 05/2018",
            title: "Ford España - Almussafes",
            desc: "Maintained and updated corporate websites. Managed web projects from concept to delivery."        },
        {
            img: "assets/img/companies/nntdata.jpg",
            date: "06/2020 - 04/2024",
            title: "NNTData - Valencia",
            desc: "Led a development team as Scrum Master, ensuring on-time delivery of features. Worked with Java, JavaScript, PHP, Rust, Angular, and Spring."        },
        {
            img: "assets/img/companies/boluda.png",
            date: "03/2025 - Actualidad",
            title: "Boluda",
            desc: "Developed and maintained critical internal systems using modern (Angular, Spring Boot) and legacy (JSP, Struts, Hibernate) stacks. Led legacy module refactoring for performance and scalability. Worked in Agile: sprint planning, code reviews, and resolving production issues."        }
    ];

    $: current = activeTab === "studies" ? studies : work;
</script>



<section class="portfolio-block block-intro border-bottom">
    <div class="container mt-5">
        <!-- Tabs con indicador deslizante -->
        <div class="tabbar">
            <button
                    class="btn-tab"
                    class:active={activeTab === "studies"}
                    on:click={() => (activeTab = "studies")}
            >
                Education
            </button>
            <button
                    class="btn-tab"
                    class:active={activeTab === "work"}
                    on:click={() => (activeTab = "work")}
            >
                Work Experience
            </button>
            <span class="indicator" aria-hidden="true" style="transform: translateX({activeTab === 'studies' ? '0%' : '100%'});"></span>
        </div>

        <!-- Cambia todo el UL como bloque keyed para animación entre modos -->
        {#key activeTab}
            <ul class="timeline">
                {#each current as step, i (step.title)}
                    <li class={i % 2 === 1 ? 'timeline-inverted' : ''}
                        in:fadeFly={{ y: 14, x: activeTab === 'studies' ? -14 : 14, duration: 260, delay: delayFor(i) }}
                        out:fade={{ duration: 140 }}
                    >
                        <div class="timeline-image">
                            <img src={step.img} alt="Timeline Step" />
                        </div>
                        <div class="timeline-panel">
                            <div class="timeline-heading">
                                <h4 class="subheading">{step.title} {step.date}</h4>
                            </div>
                            <div class="timeline-body">
                                <p class="text-muted">{step.desc}</p>
                            </div>
                        </div>
                        {#if i !== current.length - 1}
                            <div class="line"></div>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/key}
    </div>
</section>

<style>
    /* Tabs con indicador deslizante */
    .tabbar {
        position: relative;
        display: inline-grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        border: 1px solid var(--bs-primary);
        border-radius: 999px;
        overflow: hidden;
        margin: 0 auto 1rem;
    }
    .btn-tab {
        padding: .5rem 1rem;
        background: transparent;
        border: none;
        font-weight: 600;
        cursor: pointer;
        min-width: 160px;
    }
    .btn-tab.active { color: white; }
    .indicator {
        position: absolute;
        top: 0;
        left: 0;
        width: 50%;
        height: 100%;
        background: var(--bs-primary);
        z-index: -1;
        transition: transform 220ms ease;
    }

    /* Un pelín de polish en imágenes */
    .timeline-image img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 999px;
        transform: translateZ(0); /* activa GPU */
        transition: transform 200ms ease;
    }
    .timeline-image img:hover { transform: scale(1.04); }
</style>