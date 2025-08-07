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
                <h3 class="text-center">My Journey Through Learning & Development</h3>
                <p class="text-center">A timeline of my education, achievements, and growth in technology.</p>
                <ul class="timeline">
                    {#each [1, 2, 3, 4, 5, 6, 7] as step, i}
                        <li class={i % 2 === 1 ? 'timeline-inverted' : ''}>
                            <div class="timeline-image">
                                {#if step == 1 || step == 2}
                                    <img src="assets/img/schools/rodrigo.png" alt="Timeline Step" />

                                    {/if}

                                {#if step == 3}
                                    <img src="assets/img/schools/serra.jpg" alt="Timeline Step" />

                                {/if}
                                {#if step == 4}
                                    <img src="assets/img/schools/c1.jpg" alt="Timeline Step" />

                                {/if}
                                {#if step == 5}
                                    <img src="assets/img/schools/aws.webp" alt="Timeline Step" />

                                {/if}
                                {#if step == 6}
                                    <img src="assets/img/schools/azure.png" alt="Timeline Step" />

                                {/if}
                                {#if step == 7}
                                    <img src="assets/img/schools/medac.png" alt="Timeline Step" />

                                {/if}
                            </div>
                            <div class="timeline-panel">
                                <div class="timeline-heading">
                                    <h4 class="subheading">
                                        {#if step === 1}
                                         I.E.S José Rodrigo Botet   06/2018
                                        {:else if step === 2}
                                            I.E.S José Rodrigo Botet  06/2020
                                        {:else if step === 3}
                                          I.E.S Serra Perenxisa  06/2021
                                        {:else if step === 4}
                                            Official School Of Languages Quart De Poblet 06/2022
                                        {:else if step === 5}
                                            AWS Certified Cloud Practitioner 02/2023
                                        {:else if step === 6}
                                            Microsoft Certified: Azure Fundamentals 07/2023
                                        {:else if step === 7}
                                          Official School Of Languages Quart De Poblet 06/2022
                                            {:else}
                                            Medac Valencia /2026
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
                                        {:else if step === 5}
                                            Certification. Foundational level. Issued by Amazon Web Services Training and Certification
                                            AWS Certified Cloud Practitioner
                                        {:else if step === 6}
                                            Azure Fundamentals Issued by Microsoft
                                        {:else}
                                            Master in AI and Big Data
                                        {/if}
                                    </p>
                                </div>
                            </div>
                            {#if step !== 7}
                                <div class="line"></div>
                            {/if}
                        </li>
                    {/each}
                </ul>
            </div>
        </div>
    </div>
</section>