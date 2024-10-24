function createNewItem() {
    // Obtener valores de los inputs
    const nombre = document.querySelector('input[name="example-text-input"]').value;
    const tipoPrenda = document.querySelector('input[name="report-type"]:checked').nextElementSibling.querySelector('.form-selectgroup-title').innerText;
    const imagenInput = document.querySelector('.file-input');
    
    // Verificar si se seleccionó una imagen
    if (imagenInput.files.length === 0) {
        alert("Por favor, carga una imagen.");
        return;
    }

    // Obtener la imagen como base64
    const file = imagenInput.files[0];
    const reader = new FileReader();
    
    reader.onloadend = function() {
        const imagenBase64 = reader.result; // Contenido en base64

        // Crear un objeto para la nueva prenda
        const newItem = {
            nombre: nombre,
            tipoPrenda: tipoPrenda,
            imagen: imagenBase64
        };

        // Guardar en Firebase
        const newItemRef = database.ref('prendas').push(); // `prendas` es el nombre de la colección
        newItemRef.set(newItem)
            .then(() => {
                alert("Prenda creada exitosamente.");
                // Opcional: limpiar los inputs después de crear
                document.querySelector('input[name="example-text-input"]').value = '';
                imagenInput.value = '';
                document.getElementById('imagePreview').innerHTML = ''; // Limpiar vista previa
            })
            .catch((error) => {
                console.error("Error al guardar en Firebase: ", error);
            });
    };
    
    reader.readAsDataURL(file); // Leer la imagen como URL de datos
}
