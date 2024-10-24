// Cargar módulos Firebase solo cuando el usuario hace clic en el botón de login
document.getElementById('loginBtn').addEventListener('click', async () => {
    try {
        // Cargar dinámicamente los módulos de Firebase
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js");
        const { getAuth, signInWithPopup, GoogleAuthProvider } = await import("https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js");

        // Configuración de Firebase (se recomienda mover a un archivo de configuración o a variables de entorno)
        const firebaseConfig = {
            apiKey: "AIzaSyAaMNIc8A7u22E4k5mMnI9hn-0SH6GgY78",
            authDomain: "togs-cc569.firebaseapp.com",
            projectId: "togs-cc569",
            storageBucket: "togs-cc569.appspot.com",
            messagingSenderId: "721742431560",
            appId: "1:721742431560:web:fd5b98af6b107e73e45f7d",
            measurementId: "G-BMSNFFXFJ8"
        };

        // Inicializa Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        // Intentar login con Google
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Guardar el usuario en localStorage
        localStorage.setItem('user', JSON.stringify(user));

        // Redirigir a la ruta "dashboard"
        window.location.href = 'dashboard'; // Asegúrate de que esta ruta sea la correcta

    } catch (error) {
        // Manejo de errores detallado
        if (error.code === 'auth/popup-closed-by-user') {
            console.error("El popup de login fue cerrado por el usuario.");
        } else if (error.code === 'auth/network-request-failed') {
            console.error("Hubo un problema de red, por favor revisa tu conexión.");
        } else {
            console.error("Error durante el login:", error);
        }
    }
});
