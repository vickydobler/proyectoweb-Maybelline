// =======================================
// MENU HAMBURGUESA FUNCIONAL (ETAPA 3)
// =======================================
document.addEventListener("DOMContentLoaded", () => {
  
  const menuBtn = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  if (!menuBtn || !navMenu) return;
  // Abrir/cerrar menú
  menuBtn.addEventListener("click", () => {
    const open = navMenu.classList.toggle("nav-open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  // Si cambio de tamaño, reseteo el menú
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      navMenu.classList.remove("nav-open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
});
