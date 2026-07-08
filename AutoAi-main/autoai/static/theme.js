/**
 * VahanSathi Theme Engine
 * Car-brand inspired themes — persisted in localStorage
 */
(function () {
  const THEMES = {
    default: {
      name: 'VahanSathi Blue',
      brand: 'Default',
      '--blue': '#3A8DCA',
      '--blue-dark': '#2670A8',
      '--blue-light': '#5BACD6',
      '--blue-pale': '#C8E4F5',
      '--sky': '#EAF4FB',
      '--amber': '#F5A623',
      '--amber-glow': '#FAC05E',
      '--bg': '#F0F7FE',
      '--border': '#D8EAF6',
      '--text': '#1A2533',
      '--text-mid': '#5A6A7A',
      '--text-soft': '#9AAABB',
      '--sidebar-bg': '#FFFFFF',
      '--topbar-bg': '#FFFFFF',
      '--hero-grad': 'linear-gradient(120deg,#1A4D7A 0%,#3A8DCA 55%,#5BACD6 100%)',
      '--accent': '#F5A623',
    },
    ferrari: {
      name: 'Ferrari Rosso',
      brand: 'Ferrari',
      '--blue': '#DC0000',
      '--blue-dark': '#A80000',
      '--blue-light': '#FF3333',
      '--blue-pale': '#FFD0D0',
      '--sky': '#FFF0F0',
      '--amber': '#F6C026',
      '--amber-glow': '#FFD84D',
      '--bg': '#FDF5F5',
      '--border': '#F5C8C8',
      '--text': '#1A0000',
      '--text-mid': '#6B3030',
      '--text-soft': '#B08080',
      '--sidebar-bg': '#1C0A0A',
      '--topbar-bg': '#FFFFFF',
      '--hero-grad': 'linear-gradient(120deg,#6B0000 0%,#DC0000 55%,#FF3333 100%)',
      '--accent': '#F6C026',
    },
    porsche: {
      name: 'Porsche Platinum',
      brand: 'Porsche',
      '--blue': '#8C6D3F',
      '--blue-dark': '#6B5330',
      '--blue-light': '#B89460',
      '--blue-pale': '#F0E6D0',
      '--sky': '#FAF6EF',
      '--amber': '#D0AF72',
      '--amber-glow': '#E8C98A',
      '--bg': '#F5F0E8',
      '--border': '#E0D0B8',
      '--text': '#1A1410',
      '--text-mid': '#5A4A30',
      '--text-soft': '#A09070',
      '--sidebar-bg': '#1C1810',
      '--topbar-bg': '#FFFFFF',
      '--hero-grad': 'linear-gradient(120deg,#2C2010 0%,#8C6D3F 55%,#B89460 100%)',
      '--accent': '#D0AF72',
    },
    bmw: {
      name: 'BMW Bavarian',
      brand: 'BMW',
      '--blue': '#0066CC',
      '--blue-dark': '#004C99',
      '--blue-light': '#3399FF',
      '--blue-pale': '#CCE5FF',
      '--sky': '#F0F6FF',
      '--amber': '#1C1C1C',
      '--amber-glow': '#444444',
      '--bg': '#F4F6F9',
      '--border': '#C8D8F0',
      '--text': '#0A0F1A',
      '--text-mid': '#3A4A6A',
      '--text-soft': '#8A9AB8',
      '--sidebar-bg': '#0A0F1A',
      '--topbar-bg': '#FFFFFF',
      '--hero-grad': 'linear-gradient(120deg,#001A40 0%,#0066CC 55%,#3399FF 100%)',
      '--accent': '#0066CC',
    },
    mercedes: {
      name: 'Mercedes Silver',
      brand: 'Mercedes-Benz',
      '--blue': '#262626',
      '--blue-dark': '#111111',
      '--blue-light': '#555555',
      '--blue-pale': '#E0E0E0',
      '--sky': '#F5F5F5',
      '--amber': '#C5A028',
      '--amber-glow': '#DDB835',
      '--bg': '#EFEFEF',
      '--border': '#D8D8D8',
      '--text': '#111111',
      '--text-mid': '#444444',
      '--text-soft': '#888888',
      '--sidebar-bg': '#111111',
      '--topbar-bg': '#FFFFFF',
      '--hero-grad': 'linear-gradient(120deg,#000000 0%,#262626 55%,#555555 100%)',
      '--accent': '#C5A028',
    },
    lamborghini: {
      name: 'Lamborghini Giallo',
      brand: 'Lamborghini',
      '--blue': '#C9A800',
      '--blue-dark': '#A88900',
      '--blue-light': '#FFD700',
      '--blue-pale': '#FFF6CC',
      '--sky': '#FDFBEE',
      '--amber': '#FFD700',
      '--amber-glow': '#FFE44D',
      '--bg': '#F8F5E0',
      '--border': '#EDE5A0',
      '--text': '#0D0D00',
      '--text-mid': '#4A4400',
      '--text-soft': '#8A8240',
      '--sidebar-bg': '#0D0D0D',
      '--topbar-bg': '#FFFFFF',
      '--hero-grad': 'linear-gradient(120deg,#0D0D0D 0%,#2A2600 55%,#4A4400 100%)',
      '--accent': '#FFD700',
    }
  };

  function applyTheme(key) {
    const theme = THEMES[key] || THEMES.default;
    const root = document.documentElement;
    Object.entries(theme).forEach(([prop, val]) => {
      if (prop.startsWith('--')) root.style.setProperty(prop, val);
    });
    // Sidebar dark mode for themed brands
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      const isDark = ['ferrari','porsche','bmw','mercedes','lamborghini'].includes(key);
      sidebar.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
    document.documentElement.setAttribute('data-theme', key);
    localStorage.setItem('vahan_theme', key);
  }

  // Apply saved theme on load
  const saved = localStorage.getItem('vahan_theme') || 'default';
  applyTheme(saved);

  // Public API
  window.VahanTheme = { THEMES, apply: applyTheme, current: () => localStorage.getItem('vahan_theme') || 'default' };
})();
