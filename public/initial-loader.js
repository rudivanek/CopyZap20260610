// Only show loader on /copy-maker page
(function() {
  const loader = document.getElementById('initial-loader');
  if (loader && window.location.pathname !== '/copy-maker') {
    loader.style.display = 'none';
  }
})();
