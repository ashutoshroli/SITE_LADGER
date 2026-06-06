const API_URL = "https://script.google.com/macros/s/AKfycbwEhsKonoUzRLXW8P25HXlKO3e6UWAy9dE-oJXIBuYcHKJC1nNc96ABnFOQkh-Yur8s/exec";

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'LOGIN', email, password })
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            alert("Login Successful: " + data.user.name);
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error("Connection Error:", error);
    }
}
