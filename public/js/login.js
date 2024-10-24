import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
        import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

        // Configuración de Firebase
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

        // Función para login con Google
        document.getElementById('loginBtn').addEventListener('click', () => {
            signInWithPopup(auth, provider)
                .then((result) => {
                    // Información del usuario
                    const user = result.user;

                    // Guardar el usuario en localStorage
                    localStorage.setItem('user', JSON.stringify(user));

                    // Redirigir a la ruta "dashboard"
                    window.location.href = 'dashboard'; // Asegúrate de que esta ruta sea correcta
        
                })
                .catch((error) => {
                    console.error("Error durante el login:", error);
                });
        });

        