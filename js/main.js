/**
 * Main JavaScript - Academia Joche
 */

// Navegación móvil
const Navigation = (() => {
    const init = () => {
        const toggle = document.querySelector('.nav__toggle');
        const menu = document.querySelector('.nav__menu');

        if (!toggle || !menu) return;
        
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });

        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
            });
        });
    };

    return { init };
})();

// Formulario de contacto
const ContactForm = (() => {
    const init = () => {
        const form = document.getElementById('contactForm');
        if (!form) return;
        form.addEventListener('submit', handleSubmit);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
        e.target.reset();
    };

    return { init };
})();

// Esperar a que las secciones se carguen
document.addEventListener('sectionsLoaded', () => {
    Navigation.init();
    ContactForm.init();
});