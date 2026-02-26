/**
 * Módulo de Noticias Públicas - Firebase
 * Compatible con formato antiguo y nuevo
 */

import { obtenerNoticiasPublicadas, obtenerNoticia, obtenerFechaPublicacion } from './firebase-config.js';

const NoticiasPublic = (() => {
    
    const inicializar = async () => {
        const contenedorNoticias = document.getElementById('noticias-container');
        
        if (!contenedorNoticias) return;
        
        contenedorNoticias.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Cargando noticias...</p>
            </div>
        `;

        try {
            const listaNoticias = await obtenerNoticiasPublicadas(6);
            
            if (listaNoticias.length === 0) {
                mostrarEstadoVacio(contenedorNoticias);
                return;
            }

            renderizarNoticias(contenedorNoticias, listaNoticias);
            
            // Disparar evento cuando las noticias estén listas
            document.dispatchEvent(new Event('noticiasLoaded'));
        } catch (error) {
            console.error('Error:', error);
            mostrarEstadoError(contenedorNoticias);
        }
    };

    const renderizarNoticias = (contenedorNoticias, listaNoticias) => {
        contenedorNoticias.innerHTML = listaNoticias.map(noticia => {
            const fechaPublicacion = obtenerFechaPublicacion(noticia);
            
            return `
                <article class="news-card">
                    ${noticia.imagen ? `
                        <div class="news-card__image">
                            <img src="${noticia.imagen}" alt="${escaparHtml(noticia.titulo)}" loading="lazy">
                        </div>
                    ` : ''}
                    <div class="news-card__body">
                        <span class="news-card__date">${formatearFecha(fechaPublicacion)}</span>
                        <h3 class="news-card__title">${escaparHtml(noticia.titulo)}</h3>
                        <p class="news-card__excerpt">${escaparHtml(noticia.resumen)}</p>
                        <button class="news-card__link" data-id="${noticia.id}">
                            Leer más →
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        contenedorNoticias.querySelectorAll('.news-card__link').forEach(boton => {
            boton.addEventListener('click', () => verDetalleNoticia(boton.dataset.id));
        });
    };

    const verDetalleNoticia = async (noticiaId) => {
        try {
            const noticia = await obtenerNoticia(noticiaId);
            if (noticia) mostrarModalNoticia(noticia);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const mostrarModalNoticia = (noticia) => {
        const modalExistente = document.querySelector('.modal');
        if (modalExistente) modalExistente.remove();

        const fechaPublicacion = obtenerFechaPublicacion(noticia);

        const modalNoticia = document.createElement('div');
        modalNoticia.className = 'modal';
        modalNoticia.innerHTML = `
            <div class="modal__overlay"></div>
            <div class="modal__content">
                <button class="modal__close" aria-label="Cerrar">✕</button>
                ${noticia.imagen ? `
                    <div class="modal__image">
                        <img src="${noticia.imagen}" alt="${escaparHtml(noticia.titulo)}">
                    </div>
                ` : ''}
                <span class="modal__date">${formatearFecha(fechaPublicacion)}</span>
                <h2 class="modal__title">${escaparHtml(noticia.titulo)}</h2>
                <div class="modal__text">${escaparHtml(noticia.contenido)}</div>
            </div>
        `;

        document.body.appendChild(modalNoticia);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => modalNoticia.classList.add('active'));

        modalNoticia.querySelector('.modal__overlay').addEventListener('click', cerrarModalNoticia);
        modalNoticia.querySelector('.modal__close').addEventListener('click', cerrarModalNoticia);
        document.addEventListener('keydown', manejarTeclaEscape);
    };

    const cerrarModalNoticia = () => {
        const modalNoticia = document.querySelector('.modal');
        if (modalNoticia) {
            modalNoticia.classList.remove('active');
            document.removeEventListener('keydown', manejarTeclaEscape);
            setTimeout(() => {
                modalNoticia.remove();
                document.body.style.overflow = '';
            }, 300);
        }
    };

    const manejarTeclaEscape = (evento) => {
        if (evento.key === 'Escape') cerrarModalNoticia();
    };

    const mostrarEstadoVacio = (contenedorNoticias) => {
        contenedorNoticias.innerHTML = `
            <div class="empty-state">
                <span>📰</span>
                <p>Próximamente publicaremos noticias. ¡Vuelve pronto!</p>
            </div>
        `;
    };

    const mostrarEstadoError = (contenedorNoticias) => {
        contenedorNoticias.innerHTML = `
            <div class="error-state">
                <span>⚠️</span>
                <p>No pudimos cargar las noticias.</p>
                <button class="btn btn--secondary" onclick="location.reload()">Reintentar</button>
            </div>
        `;
    };

    const formatearFecha = (fecha) => {
        return fecha.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const escaparHtml = (texto) => {
        const elementoTemporal = document.createElement('div');
        elementoTemporal.textContent = texto || '';
        return elementoTemporal.innerHTML;
    };

    return { inicializar };
})();

// Verificar si las secciones ya se cargaron O esperar el evento
const inicializarCuandoSeccionesEstenListas = () => {
    const contenedorNoticiasExiste = document.getElementById('noticias-container');
    
    if (contenedorNoticiasExiste) {
        // Las secciones ya se cargaron, inicializar inmediatamente
        NoticiasPublic.inicializar();
    } else {
        // Esperar a que las secciones se carguen
        document.addEventListener('sectionsLoaded', () => {
            NoticiasPublic.inicializar();
        });
    }
};

// Ejecutar cuando el módulo esté listo
inicializarCuandoSeccionesEstenListas();