/**
 * Cargador de secciones HTML - Dojo Shudokan
 * Carga cada sección de forma modular
 */

const SectionLoader = (() => {
    const sections = [
        { id: 'section-header', file: 'sections/header.html' },
        { id: 'section-hero', file: 'sections/hero.html' },
        { id: 'section-about', file: 'sections/about.html' },
        { id: 'section-values', file: 'sections/values.html' },
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
        await Promise.all(
            sections.map(section => loadSection(section.id, section.file))
        );

        document.dispatchEvent(new Event('sectionsLoaded'));
    };

    return { init };
})();

SectionLoader.init();