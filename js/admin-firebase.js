/**
 * Panel de Administración con Firebase Auth + Cloudinary
 * Incluye noticias programadas - Compatible con formato antiguo y nuevo
 */

import { 
    obtenerNoticias, 
    agregarNoticia, 
    actualizarNoticia, 
    eliminarNoticia,
    iniciarSesion,
    cerrarSesion,
    observarAuth,
    recuperarPassword,
    cambiarPassword,
    obtenerFechaPublicacion,
    Timestamp
} from './firebase-config.js';

import { subirImagen } from './cloudinary-config.js';

// ================================
// MÓDULO DE AUTENTICACIÓN
// ================================
const Auth = (() => {
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmailSpan = document.getElementById('userEmail');
    
    const recoverBox = document.getElementById('recoverBox');
    const loginBox = document.querySelector('.login-box');
    const showRecoverBtn = document.getElementById('showRecoverBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const recoverForm = document.getElementById('recoverForm');
    const recoverMessage = document.getElementById('recoverMessage');
    
    const passwordModal = document.getElementById('passwordModal');
    const showPasswordBtn = document.getElementById('showPasswordBtn');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const passwordForm = document.getElementById('passwordForm');
    const passwordMessage = document.getElementById('passwordMessage');

    const init = () => {
        observarAuth((user) => {
            if (user) {
                showPanel(user);
            } else {
                showLogin();
            }
        });

        loginForm?.addEventListener('submit', handleLogin);
        logoutBtn?.addEventListener('click', handleLogout);
        
        showRecoverBtn?.addEventListener('click', () => toggleRecoverForm(true));
        showLoginBtn?.addEventListener('click', () => toggleRecoverForm(false));
        recoverForm?.addEventListener('submit', handleRecover);
        
        showPasswordBtn?.addEventListener('click', () => togglePasswordModal(true));
        cancelPasswordBtn?.addEventListener('click', () => togglePasswordModal(false));
        passwordForm?.addEventListener('submit', handleChangePassword);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Entrando...';
        loginError.style.display = 'none';

        try {
            await iniciarSesion(email, password);
        } catch (error) {
            let mensaje = 'Error al iniciar sesión';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    mensaje = '❌ No existe una cuenta con este correo';
                    break;
                case 'auth/wrong-password':
                    mensaje = '❌ Contraseña incorrecta';
                    break;
                case 'auth/invalid-email':
                    mensaje = '❌ Correo electrónico inválido';
                    break;
                case 'auth/too-many-requests':
                    mensaje = '❌ Demasiados intentos. Intenta más tarde';
                    break;
                case 'auth/invalid-credential':
                    mensaje = '❌ Credenciales inválidas';
                    break;
                default:
                    mensaje = '❌ Error al iniciar sesión';
            }
            
            loginError.textContent = mensaje;
            loginError.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    };

    const handleLogout = async () => {
        try {
            await cerrarSesion();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleRecover = async (e) => {
        e.preventDefault();
        const email = document.getElementById('recoverEmail').value;
        
        const submitBtn = recoverForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Enviando...';

        try {
            await recuperarPassword(email);
            recoverMessage.textContent = '✅ ¡Enlace enviado! Revisa tu correo';
            recoverMessage.className = 'message success';
            recoverForm.reset();
        } catch (error) {
            let mensaje = error.code === 'auth/user-not-found' 
                ? '❌ No existe una cuenta con este correo'
                : 'Error al enviar el correo';
            
            recoverMessage.textContent = mensaje;
            recoverMessage.className = 'message error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar enlace';
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            passwordMessage.textContent = '❌ Las contraseñas no coinciden';
            passwordMessage.className = 'message error';
            return;
        }
        
        if (newPassword.length < 6) {
            passwordMessage.textContent = '❌ Mínimo 6 caracteres';
            passwordMessage.className = 'message error';
            return;
        }
        
        const submitBtn = passwordForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Guardando...';

        try {
            await cambiarPassword(currentPassword, newPassword);
            passwordMessage.textContent = '✅ ¡Contraseña actualizada!';
            passwordMessage.className = 'message success';
            passwordForm.reset();
            
            setTimeout(() => {
                togglePasswordModal(false);
            }, 2000);
        } catch (error) {
            passwordMessage.textContent = error.code === 'auth/wrong-password' 
                ? '❌ Contraseña actual incorrecta'
                : '❌ Error al cambiar contraseña';
            passwordMessage.className = 'message error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 Guardar';
        }
    };

    const toggleRecoverForm = (showRecover) => {
        loginBox.style.display = showRecover ? 'none' : 'block';
        recoverBox.style.display = showRecover ? 'block' : 'none';
        recoverMessage.className = 'message';
        recoverForm.reset();
    };

    const togglePasswordModal = (show) => {
        passwordModal.style.display = show ? 'flex' : 'none';
        passwordMessage.className = 'message';
        passwordForm.reset();
    };

    const showPanel = (user) => {
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'block';
        userEmailSpan.textContent = user.email;
        NoticiasAdmin.init();
    };

    const showLogin = () => {
        loginScreen.style.display = 'flex';
        adminPanel.style.display = 'none';
        toggleRecoverForm(false);
    };

    return { init };
})();

// ================================
// MÓDULO DE GESTIÓN DE NOTICIAS
// ================================
const NoticiasAdmin = (() => {
    let editandoId = null;
    let imagenActual = null;
    let imagenNueva = null;
    let imagenEliminada = false;
    let todasLasNoticias = [];
    let filtroActual = 'todas';

    const form = document.getElementById('noticiaForm');
    const formTitle = document.getElementById('formTitle');
    const cancelBtn = document.getElementById('cancelBtn');
    const submitBtn = form?.querySelector('button[type="submit"]');
    const listaContainer = document.getElementById('noticiasLista');
    const countBadge = document.getElementById('noticiasCount');
    
    const imageInput = document.getElementById('imagen');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImage');
    
    const programarCheckbox = document.getElementById('programar');
    const programarInfo = document.getElementById('programarInfo');

    const init = async () => {
        if (!form) return;

        form.addEventListener('submit', handleSubmit);
        cancelBtn?.addEventListener('click', cancelarEdicion);
        initImageUpload();
        initProgramar();
        initFiltros();
        
        setFechaHoraActual();
        
        await cargarNoticias();
    };

    const setFechaHoraActual = () => {
        const ahora = new Date();
        document.getElementById('fecha').valueAsDate = ahora;
        document.getElementById('hora').value = ahora.toTimeString().slice(0, 5);
    };

    const initProgramar = () => {
        programarCheckbox?.addEventListener('change', () => {
            programarInfo.style.display = programarCheckbox.checked ? 'block' : 'none';
        });
    };

    const initFiltros = () => {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                filtroActual = tab.dataset.filter;
                renderLista(filtrarNoticias(todasLasNoticias));
            });
        });
    };

    const filtrarNoticias = (noticias) => {
        const ahora = new Date();
        
        switch (filtroActual) {
            case 'publicadas':
                return noticias.filter(n => {
                    const fechaPub = obtenerFechaPublicacion(n);
                    return fechaPub <= ahora;
                });
            case 'programadas':
                return noticias.filter(n => {
                    const fechaPub = obtenerFechaPublicacion(n);
                    return fechaPub > ahora;
                });
            default:
                return noticias;
        }
    };

    const initImageUpload = () => {
        imagePreview.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', handleImageSelect);
        
        imagePreview.addEventListener('dragover', (e) => {
            e.preventDefault();
            imagePreview.classList.add('dragover');
        });
        
        imagePreview.addEventListener('dragleave', () => {
            imagePreview.classList.remove('dragover');
        });
        
        imagePreview.addEventListener('drop', (e) => {
            e.preventDefault();
            imagePreview.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                processImage(file);
            }
        });
        
        removeImageBtn.addEventListener('click', handleRemoveImage);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) processImage(file);
    };

    const processImage = (file) => {
    // Formatos permitidos
    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!formatosPermitidos.includes(file.type)) {
        Toast.show('⚠️ Solo se permiten imágenes JPG, PNG o WEBP', 'warning');
        return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (file.size > MAX_SIZE) {
        const pesoMB = (file.size / (1024 * 1024)).toFixed(2);
        Toast.show(`⚠️ La imagen pesa ${pesoMB}MB. El máximo permitido es 5MB`, 'warning');
        
        // Mostrar alerta visual en el preview
        imagePreview.innerHTML = `
            <div class="preview-error">
                <span>🚫</span>
                <p><strong>Imagen demasiado pesada</strong></p>
                <p>${file.name}</p>
                <p class="preview-error__size">${pesoMB}MB / 5MB máximo</p>
                <p class="preview-error__hint">Reduce el tamaño de la imagen e intenta de nuevo</p>
            </div>
        `;
        imagePreview.classList.remove('has-image');
        removeImageBtn.style.display = 'none';
        imageInput.value = '';
        return;
    }
    
    comprimirImagen(file, 800, 0.8).then(compressedFile => {
        imagenNueva = compressedFile;
        imagenEliminada = false;
        
        const reader = new FileReader();
        reader.onload = (e) => showImagePreview(e.target.result);
        reader.readAsDataURL(compressedFile);
        
        const pesoOriginal = (file.size / (1024 * 1024)).toFixed(2);
        const pesoComprimido = (compressedFile.size / (1024 * 1024)).toFixed(2);
        Toast.show(`✅ Imagen lista (${pesoOriginal}MB → ${pesoComprimido}MB)`, 'success');
    });
};

    const comprimirImagen = (file, maxWidth = 800, quality = 0.8) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => {
                            resolve(new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            }));
                        },
                        'image/jpeg',
                        quality
                    );
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const showImagePreview = (src) => {
        imagePreview.innerHTML = `<img src="${src}" alt="Preview">`;
        imagePreview.classList.add('has-image');
        removeImageBtn.style.display = 'inline-flex';
    };

    const handleRemoveImage = () => {
        imagenNueva = null;
        imagenEliminada = true;
        resetImagePreview();
        Toast.show('🗑️ Imagen eliminada', 'warning');
    };

    const resetImagePreview = () => {
        imagePreview.innerHTML = '<span class="preview-placeholder">📷 Haz clic o arrastra una imagen aquí</span>';
        imagePreview.classList.remove('has-image');
        removeImageBtn.style.display = 'none';
        imageInput.value = '';
    };

    const cargarNoticias = async () => {
        listaContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Cargando noticias...</p>
            </div>
        `;

        try {
            todasLasNoticias = await obtenerNoticias();
            renderLista(filtrarNoticias(todasLasNoticias));
        } catch (error) {
            console.error('Error:', error);
            listaContainer.innerHTML = `
                <div class="error-state">
                    <p>❌ Error al cargar las noticias.</p>
                    <button class="btn btn-secondary" onclick="location.reload()">Reintentar</button>
                </div>
            `;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fecha = document.getElementById('fecha').value;
        const hora = document.getElementById('hora').value;
        const fechaHora = new Date(`${fecha}T${hora}`);
        
        const noticia = {
            titulo: document.getElementById('titulo').value.trim(),
            fechaPublicacion: Timestamp.fromDate(fechaHora),
            programada: programarCheckbox.checked,
            resumen: document.getElementById('resumen').value.trim(),
            contenido: document.getElementById('contenido').value.trim(),
            imagen: imagenActual
        };

        if (!noticia.titulo || !fecha || !hora || !noticia.resumen || !noticia.contenido) {
            Toast.show('⚠️ Completa todos los campos', 'warning');
            return;
        }

        setLoading(true, 'Guardando...');

        try {
            if (imagenNueva) {
                setLoading(true, 'Subiendo imagen...');
                noticia.imagen = await subirImagen(imagenNueva);
            } else if (imagenEliminada) {
                noticia.imagen = null;
            }

            if (editandoId) {
                await actualizarNoticia(editandoId, noticia);
                Toast.show('✅ ¡Noticia actualizada!', 'success');
            } else {
                await agregarNoticia(noticia);
                const mensaje = programarCheckbox.checked 
                    ? '✅ ¡Noticia programada!' 
                    : '✅ ¡Noticia publicada!';
                Toast.show(mensaje, 'success');
            }

            limpiarFormulario();
            await cargarNoticias();
        } catch (error) {
            console.error('Error:', error);
            Toast.show('❌ Error al guardar', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderLista = (noticias) => {
        const ahora = new Date();
        
        const publicadas = todasLasNoticias.filter(n => obtenerFechaPublicacion(n) <= ahora).length;
        const programadas = todasLasNoticias.length - publicadas;

        countBadge.textContent = `${noticias.length} de ${todasLasNoticias.length} (${publicadas} publicadas, ${programadas} programadas)`;

        if (noticias.length === 0) {
            listaContainer.innerHTML = `
                <div class="empty-state">
                    <p>📭 No hay noticias en esta categoría.</p>
                </div>
            `;
            return;
        }

        listaContainer.innerHTML = noticias.map(noticia => {
            const fechaPub = obtenerFechaPublicacion(noticia);
            const esProgramada = fechaPub > ahora;
            
            return `
                <div class="noticia-item ${esProgramada ? 'programada' : ''}">
                    ${noticia.imagen ? `
                        <div class="noticia-thumb">
                            <img src="${noticia.imagen}" alt="${escapeHtml(noticia.titulo)}">
                        </div>
                    ` : ''}
                    <div class="noticia-info">
                        <h3>
                            ${escapeHtml(noticia.titulo)}
                            <span class="noticia-status ${esProgramada ? 'programada' : 'publicada'}">
                                ${esProgramada ? '📆 Programada' : '✅ Publicada'}
                            </span>
                        </h3>
                        <p class="fecha-hora">📅 ${formatearFechaHora(fechaPub)}</p>
                        <p class="resumen">${escapeHtml(truncar(noticia.resumen, 80))}</p>
                    </div>
                    <div class="noticia-actions">
                        <button class="btn btn-secondary btn-small btn-editar" data-id="${noticia.id}">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger btn-small btn-eliminar" data-id="${noticia.id}">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        listaContainer.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => editar(btn.dataset.id));
        });

        listaContainer.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', () => confirmarEliminar(btn.dataset.id));
        });
    };

    const editar = (id) => {
        const noticia = todasLasNoticias.find(n => n.id === id);
        if (!noticia) return;

        editandoId = id;
        imagenActual = noticia.imagen || null;
        imagenNueva = null;
        imagenEliminada = false;

        document.getElementById('titulo').value = noticia.titulo;
        
        const fechaPub = obtenerFechaPublicacion(noticia);
        document.getElementById('fecha').value = fechaPub.toISOString().split('T')[0];
        document.getElementById('hora').value = fechaPub.toTimeString().slice(0, 5);
        
        programarCheckbox.checked = noticia.programada || false;
        programarInfo.style.display = noticia.programada ? 'block' : 'none';
        
        document.getElementById('resumen').value = noticia.resumen;
        document.getElementById('contenido').value = noticia.contenido;

        if (noticia.imagen) {
            showImagePreview(noticia.imagen);
        } else {
            resetImagePreview();
        }

        formTitle.textContent = '✏️ Editando Noticia';
        cancelBtn.style.display = 'inline-flex';
        submitBtn.textContent = '💾 Actualizar Noticia';

        form.scrollIntoView({ behavior: 'smooth' });
        Toast.show('📝 Editando noticia...', 'warning');
    };

    const confirmarEliminar = (id) => {
        const noticia = todasLasNoticias.find(n => n.id === id);
        if (!noticia) return;

        Modal.show(
            '⚠️ ¿Eliminar noticia?',
            `¿Eliminar "<strong>${escapeHtml(noticia.titulo)}</strong>"?`,
            async () => {
                try {
                    await eliminarNoticia(id);
                    Toast.show('🗑️ Noticia eliminada', 'success');
                    await cargarNoticias();
                } catch (error) {
                    Toast.show('❌ Error al eliminar', 'error');
                }
            }
        );
    };

    const cancelarEdicion = () => {
        limpiarFormulario();
        Toast.show('❌ Edición cancelada', 'warning');
    };

    const limpiarFormulario = () => {
        form.reset();
        editandoId = null;
        imagenActual = null;
        imagenNueva = null;
        imagenEliminada = false;
        
        setFechaHoraActual();
        programarCheckbox.checked = false;
        programarInfo.style.display = 'none';
        
        formTitle.textContent = '➕ Agregar Nueva Noticia';
        cancelBtn.style.display = 'none';
        submitBtn.textContent = '💾 Guardar Noticia';
        
        resetImagePreview();
    };

    const setLoading = (loading, text = 'Guardando...') => {
        submitBtn.disabled = loading;
        submitBtn.textContent = loading ? `⏳ ${text}` : 
            (editandoId ? '💾 Actualizar Noticia' : '💾 Guardar Noticia');
    };

    const formatearFechaHora = (fecha) => {
        return fecha.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    };

    const truncar = (text, max) => {
        if (!text) return '';
        return text.length > max ? text.substring(0, max) + '...' : text;
    };

    return { init };
})();

// ================================
// TOAST
// ================================
const Toast = (() => {
    const show = (message, type = 'success') => {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    return { show };
})();

// ================================
// MODAL
// ================================
const Modal = (() => {
    const show = (title, message, onConfirm) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-box">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="modalCancel">Cancelar</button>
                    <button class="btn btn-danger" id="modalConfirm">Sí, eliminar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('show'));

        const close = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('#modalCancel').addEventListener('click', close);
        modal.querySelector('#modalConfirm').addEventListener('click', () => {
            onConfirm();
            close();
        });
    };

    return { show };
})();

// ================================
// TOGGLE PASSWORD
// ================================
const TogglePassword = (() => {
    const init = () => {
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                const input = document.getElementById(targetId);
                
                if (input) {
                    if (input.type === 'password') {
                        input.type = 'text';
                        button.classList.add('showing');
                        button.querySelector('.eye-icon').textContent = '🙈';
                    } else {
                        input.type = 'password';
                        button.classList.remove('showing');
                        button.querySelector('.eye-icon').textContent = '👁️';
                    }
                }
            });
        });
    };

    return { init };
})();

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    TogglePassword.init();
});