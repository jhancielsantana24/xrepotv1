document.documentElement.lang = 'es';

// 1. Intersection Observer for Scroll Animations
const revealElements = document.querySelectorAll('.reveal');

const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const revealOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            return;
        } else {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, revealOptions);

revealElements.forEach(el => {
    revealOnScroll.observe(el);
});

// 2. Countdown Timer Logic
// Set the launch date to Q4 2026 (e.g., Nov 1, 2026)
const launchDate = new Date("Nov 1, 2026 09:00:00").getTime();

const timer = setInterval(function() {
    const now = new Date().getTime();
    const distance = launchDate - now;

    // Time calculations
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update DOM
    document.getElementById("days").innerText = days < 10 ? "0" + days : days;
    document.getElementById("hours").innerText = hours < 10 ? "0" + hours : hours;
    document.getElementById("minutes").innerText = minutes < 10 ? "0" + minutes : minutes;
    document.getElementById("seconds").innerText = seconds < 10 ? "0" + seconds : seconds;

    // If the countdown is over
    if (distance < 0) {
        clearInterval(timer);
        document.getElementById("days").innerText = "00";
        document.getElementById("hours").innerText = "00";
        document.getElementById("minutes").innerText = "00";
        document.getElementById("seconds").innerText = "00";
    }
}, 1000);

// 3. Navbar scroll effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(0, 0, 0, 0.8)';
        navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    } else {
        navbar.style.background = 'rgba(0, 0, 0, 0.6)';
        navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
    }
});

// 4. Smooth scrolling for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if(targetId === '#') return; // Ignore empty links used for modals
        
        e.preventDefault();
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// 5. Modal Logic
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Close modals when clicking outside the content box
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});

// 6. Notification Logic and Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    const icon = type === 'success' ? '✧' : '⚠';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove toast after 4 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        // Wait for CSS animation to finish before removing from DOM
        setTimeout(() => toast.remove(), 400); 
    }, 4000);
}

function focusEmailInput() {
    // Scroll to the top if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Focus the email input after a short delay to allow scrolling
    setTimeout(() => {
        const emailInput = document.getElementById('early-access-email');
        if (emailInput) {
            emailInput.focus();
            // Flash the input border for a nice effect
            emailInput.style.transition = 'all 0.3s';
            emailInput.parentElement.style.boxShadow = '0 0 15px rgba(10, 132, 255, 0.8)';
            setTimeout(() => {
                emailInput.parentElement.style.boxShadow = 'none';
            }, 1000);
        }
    }, 400);
}

function submitEarlyAccess() {
    const emailInput = document.getElementById('early-access-email');
    const emailValue = emailInput.value.trim();
    
    // Basic simple regex for email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailValue) {
        showToast('Por favor, ingresa tu correo electrónico.', 'error');
        emailInput.focus();
    } else if (!emailPattern.test(emailValue)) {
        showToast('Formato de correo no válido. Intenta nuevamente.', 'error');
        emailInput.focus();
    } else {
        const btn = document.querySelector('.btn-primary');
        const originalText = btn.innerText;
        btn.innerText = 'Cifrando...';
        btn.disabled = true;

        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailValue })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showToast(data.error, 'error');
                btn.innerText = originalText;
                btn.disabled = false;
            } else {
                // Success
                showToast('¡Acceso concedido! Pronto recibirás el correo cifrado.', 'success');
                emailInput.value = ''; // Clear value
                
                // Change button visually to show confirmation state
                btn.innerText = 'Registrado';
                btn.style.background = '#4CAF50';
                btn.style.color = '#fff';
                
                // Change it back after a few seconds
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = '#fff';
                    btn.style.color = '#000';
                    btn.disabled = false;
                }, 5000);
            }
        })
        .catch(err => {
            console.error(err);
            showToast('Líneas caídas, inténtalo de nuevo más tarde.', 'error');
            btn.innerText = originalText;
            btn.disabled = false;
        });
    }
}
