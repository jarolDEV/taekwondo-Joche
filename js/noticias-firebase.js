/**
 * Módulo de Noticias Públicas - Firebase
 * Compatible con formato antiguo y nuevo
 */

import { obtenerNoticiasPublicadas, obtenerNoticia, obtenerFechaPublicacion } from './firebase-config.js';

const NoticiasPublic = (() => {
    const container = document.getElementById('noticias-container');

    const init = async () => {
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Cargando noticias...</p>
            </div>
        `;

        try {
            const noticias = await obtenerNoticiasPublicadas(6);
            
            if (noticias.length === 0) {
                mostrarVacio();
                return;
            }

            renderNoticias(noticias);
        } catch (error) {
            console.error('Error:', error);
            mostrarError();
        }
    };

    const renderNoticias = (noticias) => {
        container.innerHTML = noticias.map(noticia => {
            const fechaPub = obtenerFechaPublicacion(noticia);
            
            return `
                <article class="news-card">
                    ${noticia.imagen ? `
                        <div class="news-card__image">
                            <img src="${noticia.imagen}" alt="${escapeHtml(noticia.titulo)}" loading="lazy">
                        </div>
                    ` : ''}
                    <div class="news-card__body">
                        <span class="news-card__date">${formatearFecha(fechaPub)}</span>
                        <h3 class="news-card__title">${escapeHtml(noticia.titulo)}</h3>
                        <p class="news-card__excerpt">${escapeHtml(noticia.resumen)}</p>
                        <button class="news-card__link" data-id="${noticia.id}">
                            Leer más →
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        container.querySelectorAll('.news-card__link').forEach(btn => {
            btn.addEventListener('click', () => verDetalle(btn.dataset.id));
        });
    };

    const verDetalle = async (id) => {
        try {
            const noticia = await obtenerNoticia(id);
            if (noticia) mostrarModal(noticia);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const mostrarModal = (noticia) => {
        const existing = document.querySelector('.modal');
        if (existing) existing.remove();

        const fechaPub = obtenerFechaPublicacion(noticia);

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal__overlay"></div>
            <div class="modal__content">
                <button class="modal__close" aria-label="Cerrar">✕</button>
                ${noticia.imagen ? `
                    <div class="modal__image">
                        <img src="${noticia.imagen}" alt="${escapeHtml(noticia.titulo)}">
                    </div>
                ` : ''}
                <span class="modal__date">${formatearFecha(fechaPub)}</span>
                <h2 class="modal__title">${escapeHtml(noticia.titulo)}</h2>
                <div class="modal__text">${escapeHtml(noticia.contenido)}</div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => modal.classList.add('active'));

        modal.querySelector('.modal__overlay').addEventListener('click', cerrarModal);
        modal.querySelector('.modal__close').addEventListener('click', cerrarModal);
        document.addEventListener('keydown', handleEsc);
    };

    const cerrarModal = () => {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.classList.remove('active');
            document.removeEventListener('keydown', handleEsc);
            setTimeout(() => {
                modal.remove();
                document.body.style.overflow = '';
            }, 300);
        }
    };

    const handleEsc = (e) => {
        if (e.key === 'Escape') cerrarModal();
    };

    const mostrarVacio = () => {
        container.innerHTML = `
            <div class="empty-state">
                <span>📰</span>
                <p>Próximamente publicaremos noticias. ¡Vuelve pronto!</p>
            </div>
        `;
    };

    const mostrarError = () => {
        container.innerHTML = `
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

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    NoticiasPublic.init();
});