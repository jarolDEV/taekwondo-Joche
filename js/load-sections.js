/**
 * Cargador de secciones HTML
 */

const SectionLoader = (() => {
    const sections = [
        { id: 'section-header', file: 'sections/header.html' },
        { id: 'section-hero', file: 'sections/hero.html' },
        { id: 'section-about', file: 'sections/about.html' },
        { id: 'section-news', file: 'sections/news.html' },
        { id: 'section-contact', file: 'sections/contact.html' },
        { id: 'section-footer', file: 'sections/footer.html' }
    ];

    const loadSection = async (id, file) => {
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`Error cargando ${file}`);
            const html = await response.text();
            const container = document.getElementById(id);
            if (container) {
                container.outerHTML = html;
            }
        } catch (error) {
            console.error(`Error al cargar sección ${file}:`, error);
        }
    };

    const init = async () => {
        // Cargar todas las secciones en paralelo
        await Promise.all(
            sections.map(section => loadSection(section.id, section.file))
        );

        // Disparar evento cuando todas las secciones estén cargadas
        document.dispatchEvent(new Event('sectionsLoaded'));
    };

    return { init };
})();

// Cargar secciones inmediatamente
SectionLoader.init();