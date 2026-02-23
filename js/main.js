/**
 * Main JavaScript - Academia Joche
 */

// Navegación móvil
const Navigation = (() => {
    const toggle = document.querySelector('.nav__toggle');
    const menu = document.querySelector('.nav__menu');

    const init = () => {
        if (!toggle || !menu) return;
        
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });

        // Cerrar al hacer clic en un enlace
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
    const form = document.getElementById('contactForm');

    const init = () => {
        if (!form) return;
        form.addEventListener('submit', handleSubmit);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
        form.reset();
    };

    return { init };
})();

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
    ContactForm.init();
});