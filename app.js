const API_URL = "https://script.google.com/macros/s/AKfycbx_8D0senIFIY0bzH8KOBjcK-OZ1TTTj1YPzGfCWkxYdRrkPCVB0VnbX6f-Ng2yxIZm/exec";

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;

    const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors', // CORS handling
        body: JSON.stringify({ action: 'LOGIN', email, password })
    });
    
    alert("Check Console for Response (CORS restricted mode)");
    console.log("Login Attempted");
}
