<script>
    // Aquí podrías importar datos o lógica en el futuro
</script>

<section class="portfolio-block block-intro border-bottom">
    <div
            class="avatar"
            style="background-image: url('/assets/img/avatars/me.jpg'); width: 120px; height: 150px; border-radius: 50%; background-size: cover; margin: 0 auto;"
    ></div>
    <div class="container">
        <div class="about-me text-center mt-4">
            <p>
                Hi! I'm <strong>Francisco Manuel Pinazo Guna</strong>, a <strong>Full Stack Developer</strong> with a strong focus on backend development. I specialize in building reliable, scalable, and maintainable systems, always aiming for clean architecture and well-structured business logic. I enjoy turning complex problems into efficient technical solutions.
            </p>
            <a class="btn btn-outline-primary" role="button" href="/hire-me">Hire me</a>        </div>
    </div>

    <div class="container mt-5">
        <div class="row">
            <div class="col-lg-12">
                <h3 class="text-center">Zigzag Timeline Layout</h3>
                <p class="text-center">dwadw</p>

                <ul class="timeline">
                    {#each [1, 2, 3, 4, 5] as step, i}
                        <li class={i % 2 === 1 ? 'timeline-inverted' : ''}>
                            <div class="timeline-image">

                                <img
                                        class="img-circle img-responsive"
                                        src={`https://lorempixel.com/250/250/cats/${step}`}
                                        alt={`Cat ${step}`}
                                />
                            </div>
                            <div class="timeline-panel">
                                <div class="timeline-heading">
                                    <h4>{step === 5 ? 'Bonus Step' : `Step ${step}`}</h4>
                                    <h4 class="subheading">
                                        {#if step === 1}
                                            06/2018
                                        {:else if step === 2}
                                            06/2020
                                        {:else if step === 3}
                                            06/2021
                                        {:else}
                                            06/2022
                                        {/if}
                                    </h4>
                                </div>
                                <div class="timeline-body">
                                    <p class="text-muted">
                                        {#if step === 1}
                                            Intermediate Vocational Training in Microcomputer Systems and Networks
                                        {:else if step === 2}
                                            Higher Vocational Training in Web Application Development
                                        {:else if step === 3}
                                            Higher Vocational Training in Multiplatform Application Development
                                        {:else if step === 4}
                                            C1 in English at Official School of Languages
                                        {/if}
                                    </p>
                                </div>
                            </div>
                            {#if step !== 5}
                                <div class="line"></div>
                            {/if}
                        </li>
                    {/each}
                </ul>
            </div>
        </div>
    </div>
</section>