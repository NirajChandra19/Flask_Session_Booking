document.addEventListener('DOMContentLoaded', () => {
  fetch('/check-session')
    .then(res => res.json())
    .then(data => {
      const navbarBrand = document.getElementById('navbarBrand');
      const navLinks = document.getElementById('navLinks');

      // Update navbar brand text based on login status
      if (data.loggedIn && data.username) {
        navbarBrand.textContent = "Welcome " + data.username;
      } else {
        navbarBrand.textContent = "Welcome to Our Service";
      }

      // Create dropdown menu for logged-in user
      function createUserMenu(username, role) {
        const li = document.createElement('li');
        li.classList.add('nav-item', 'dropdown');

        const profilePath = role === 'user' ? '/user-profile' : '/worker-profile';

        li.innerHTML = `
          <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            ${username} (${role})
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="${profilePath}">View Profile</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
          </ul>
        `;
        return li;
      }

      // Setup logout button event
      function setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
              const res = await fetch('/logout', { method: 'POST' });
              if (res.ok) {
                window.location.reload();
              } else {
                alert('Logout failed.');
              }
            } catch (error) {
              console.error(error);
              alert('Logout failed due to network error.');
            }
          });
        }
      }

      if (data.loggedIn) {
        // Remove login/signup dropdowns
        document.getElementById('loginDropdown')?.parentElement?.remove();
        document.getElementById('signupDropdown')?.parentElement?.remove();

        // Add user menu dropdown
        const userMenu = createUserMenu(data.username, data.role);
        navLinks.appendChild(userMenu);

        setupLogout();
      } else {
        // Attach login redirects for each role option
        document.querySelectorAll('.login-option').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const role = link.getAttribute('data-role');
            window.location.href = `/login-page?role=${role}`;
          });
        });

        // Attach signup redirects for each role option
        document.querySelectorAll('.signup-option').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const role = link.getAttribute('data-role');
            window.location.href = role === 'user' ? '/register-user' : '/register-worker';
          });
        });
      }

      // Highlight current nav link
      const currentPath = window.location.pathname;
      document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath === href) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    })
    .catch(() => {
      console.error('Failed to fetch session info');
    });
});
