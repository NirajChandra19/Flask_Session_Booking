document.addEventListener('DOMContentLoaded', () => {
  const serviceItems = document.querySelectorAll('.service-item');
  const serviceLinks = document.querySelectorAll('.service-link');

  serviceLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Use data-service attribute if present, else fallback to href id
      let selectedService = link.getAttribute('data-service');
      if (!selectedService) {
        selectedService = link.getAttribute('href').substring(1);
      }
      selectedService = selectedService.trim().toLowerCase();

      if (selectedService === 'all') {
        // Show all cards
        serviceItems.forEach(item => item.style.display = '');
      } else {
        // Show only cards matching the selected service slug
        serviceItems.forEach(item => {
          const cardTitle = item.querySelector('.card-title').textContent.trim().toLowerCase().replace(/\s+/g, '-');
          if (cardTitle === selectedService) {
            item.style.display = '';
            item.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            item.style.display = 'none';
          }
        });
      }

      // Close Bootstrap dropdown menu programmatically (if Bootstrap is used)
      const dropdownToggle = document.getElementById('servicesDropdown');
      if (dropdownToggle) {
        const dropdownInstance = bootstrap.Dropdown.getInstance(dropdownToggle);
        if (dropdownInstance) dropdownInstance.hide();
      }
    });
  });
});
