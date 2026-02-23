/**
 * Configuración de Firebase - Academia Joche
 * Compatible con noticias antiguas (fecha) y nuevas (fechaPublicacion)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    getDoc,
    query, 
    orderBy, 
    limit,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBRYhcDKMt-u31qrc7UIYuWdwXHJgtiGIo",
    authDomain: "academia-joche.firebaseapp.com",
    projectId: "academia-joche",
    storageBucket: "academia-joche.firebasestorage.app",
    messagingSenderId: "121576369202",
    appId: "1:121576369202:web:0abd13e432ef7df1e0a02b"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const noticiasRef = collection(db, "noticias");

// ================================
// FUNCIONES DE AUTENTICACIÓN
// ================================

export const iniciarSesion = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        throw error;
    }
};

export const cerrarSesion = async () => {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        throw error;
    }
};

export const observarAuth = (callback) => {
    return onAuthStateChanged(auth, callback);
};

export const recuperarPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (error) {
        console.error("Error al enviar email:", error);
        throw error;
    }
};

export const cambiarPassword = async (passwordActual, passwordNuevo) => {
    try {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error("No hay usuario autenticado");

        const credential = EmailAuthProvider.credential(user.email, passwordActual);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, passwordNuevo);
        return true;
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        throw error;
    }
};

export const getUsuarioActual = () => {
    return auth.currentUser;
};

// ================================
// FUNCIONES AUXILIARES
// ================================

/**
 * Obtener fecha de publicación de una noticia
 * Compatible con formato antiguo (fecha string) y nuevo (fechaPublicacion Timestamp)
 */
export const obtenerFechaPublicacion = (noticia) => {
    // Si tiene fechaPublicacion (formato nuevo)
    if (noticia.fechaPublicacion) {
        if (noticia.fechaPublicacion.toDate) {
            return noticia.fechaPublicacion.toDate();
        }
        return new Date(noticia.fechaPublicacion);
    }
    
    // Si tiene fecha (formato antiguo - string "YYYY-MM-DD")
    if (noticia.fecha) {
        return new Date(noticia.fecha + 'T00:00:00');
    }
    
    // Si tiene creadoEn como fallback
    if (noticia.creadoEn) {
        if (noticia.creadoEn.toDate) {
            return noticia.creadoEn.toDate();
        }
        return new Date(noticia.creadoEn);
    }
    
    return new Date();
};

// ================================
// FUNCIONES PARA NOTICIAS
// ================================

/**
 * Obtener todas las noticias (para admin)
 */
export const obtenerNoticias = async (limite = 50) => {
    try {
        const snapshot = await getDocs(noticiasRef);
        
        let noticias = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Ordenar manualmente por fecha (compatible con ambos formatos)
        noticias.sort((a, b) => {
            const fechaA = obtenerFechaPublicacion(a);
            const fechaB = obtenerFechaPublicacion(b);
            return fechaB - fechaA;
        });
        
        return noticias.slice(0, limite);
    } catch (error) {
        console.error("Error al obtener noticias:", error);
        throw error;
    }
};

/**
 * Obtener solo noticias publicadas (para sitio público)
 */
export const obtenerNoticiasPublicadas = async (limite = 50) => {
    try {
        const snapshot = await getDocs(noticiasRef);
        const ahora = new Date();
        
        let noticias = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(noticia => {
                const fechaPub = obtenerFechaPublicacion(noticia);
                return fechaPub <= ahora;
            });
        
        // Ordenar por fecha (más recientes primero)
        noticias.sort((a, b) => {
            const fechaA = obtenerFechaPublicacion(a);
            const fechaB = obtenerFechaPublicacion(b);
            return fechaB - fechaA;
        });
        
        return noticias.slice(0, limite);
    } catch (error) {
        console.error("Error al obtener noticias publicadas:", error);
        throw error;
    }
};

export const obtenerNoticia = async (id) => {
    try {
        const docRef = doc(db, "noticias", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error al obtener noticia:", error);
        throw error;
    }
};

export const agregarNoticia = async (noticia) => {
    try {
        const docRef = await addDoc(noticiasRef, {
            ...noticia,
            creadoEn: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error al agregar noticia:", error);
        throw error;
    }
};

export const actualizarNoticia = async (id, noticia) => {
    try {
        const docRef = doc(db, "noticias", id);
        await updateDoc(docRef, {
            ...noticia,
            actualizadoEn: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error al actualizar noticia:", error);
        throw error;
    }
};

export const eliminarNoticia = async (id) => {
    try {
        const docRef = doc(db, "noticias", id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("Error al eliminar noticia:", error);
        throw error;
    }
};

export { db, auth, Timestamp };