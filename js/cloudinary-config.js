/**
 * Configuración de Cloudinary
 * Manejo de subida de imágenes
 */

const CLOUDINARY_CONFIG = {
    cloudName: 'di5vjucp6',
    uploadPreset: 'academia_noticias'
};

/**
 * Subir imagen a Cloudinary
 * @param {File} file - Archivo de imagen
 * @returns {Promise<string>} - URL de la imagen subida
 */
export const subirImagen = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error('Error al subir imagen');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Error subiendo imagen a Cloudinary:', error);
        throw error;
    }
};

/**
 * Eliminar imagen de Cloudinary
 * Nota: Para eliminar imágenes se necesita el backend, 
 * pero las imágenes huérfanas se pueden limpiar desde el dashboard de Cloudinary
 */
export const eliminarImagen = async (url) => {
    // Cloudinary requiere autenticación para eliminar desde el frontend
    // Las imágenes se pueden eliminar manualmente desde el dashboard si es necesario
    console.log('Imagen marcada para eliminación:', url);
    return true;
};