
function handleCredentialResponse(response) {
    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: response.credential }),
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.token) {
            
            
            // Store email in localStorage
            if (data.email) {
                localStorage.setItem('user_email', data.email);
            }
                
            window.location.href = data.redirect || 'home.html';
            } else {
                console.error('Login failed');
                alert('Login failed. Please try again.');
            }
        })
        .catch((err) => {
            console.error('Error during login:', err);
            alert('An error occurred during login. Please try again.');
        });
}

// Existing parseJwt function
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
}