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

// Carrusel de noticias con loop
const Carousel = (() => {
    const init = () => {
        const track = document.getElementById('noticias-container');
        const btnLeft = document.querySelector('.carousel__btn--left');
        const btnRight = document.querySelector('.carousel__btn--right');

        if (!track || !btnLeft || !btnRight) return;

        const getScrollAmount = () => {
            const card = track.querySelector('.news-card');
            if (!card) return 300;
            return card.offsetWidth + 24;
        };

        btnRight.addEventListener('click', () => {
            const maxScroll = track.scrollWidth - track.clientWidth;

            if (track.scrollLeft >= maxScroll - 10) {
                // Si estamos al final, volver al inicio
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            }
        });

        btnLeft.addEventListener('click', () => {
            if (track.scrollLeft <= 10) {
                // Si estamos al inicio, ir al final
                track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            }
        });
    };

    return { init };
})();

// Verificar si las secciones ya se cargaron O esperar el evento
const inicializarCuandoSeccionesEstenListas = () => {
    const navegacionExiste = document.querySelector('.nav__toggle');
    
    if (navegacionExiste) {
        // Las secciones ya se cargaron
        Navigation.init();
        ContactForm.init();
    } else {
        // Esperar a que las secciones se carguen
        document.addEventListener('sectionsLoaded', () => {
            Navigation.init();
            ContactForm.init();
        });
    }
};

inicializarCuandoSeccionesEstenListas();

// Inicializar carrusel cuando las noticias estén listas
document.addEventListener('noticiasLoaded', () => {
    Carousel.init();
});