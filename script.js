let wifiPlans = [];
let simPlans = [];
let cameraPlans = [];
let tiviPlans = [];
let postpaidPlans = [];
let newsItems = [];
let bannerItems = [];
let activeBannerIndex = 0;
let bannerIntervalId = null;

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không tải được ${url}`);
  }
  return response.json();
}

function renderBanner(items) {
  const container = document.getElementById('banner-slider');
  if (!container || !items.length) return;

  container.innerHTML = items
    .map(
      (item, index) => `
        <div class="banner-slide ${index === 0 ? 'active' : ''}">
          <img src="${item.image}" alt="${item.title}" class="banner-image" />
          <div class="banner-overlay">
            <h2>${item.title}</h2>
            <p>${item.subtitle}</p>
          </div>
        </div>
      `
    )
    .join('');

  const dots = document.createElement('div');
  dots.className = 'banner-dots';
  dots.innerHTML = items
    .map(
      (_item, index) => `<button class="banner-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Chuyển ảnh ${index + 1}"></button>`
    )
    .join('');
  container.appendChild(dots);

  container.querySelectorAll('.banner-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = Number(dot.getAttribute('data-index'));
      showBannerSlide(index);
    });
  });

  startBannerAutoplay();
}

function showBannerSlide(index) {
  const slides = document.querySelectorAll('#banner-slider .banner-slide');
  const dots = document.querySelectorAll('#banner-slider .banner-dot');
  if (!slides.length || !dots.length) return;

  activeBannerIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === activeBannerIndex));
  dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === activeBannerIndex));
}

function startBannerAutoplay() {
  if (bannerIntervalId) clearInterval(bannerIntervalId);
  bannerIntervalId = setInterval(() => {
    showBannerSlide(activeBannerIndex + 1);
  }, 5000);
}

function openNewsModal(item) {
  const modal = document.getElementById('news-modal');
  const title = document.getElementById('news-modal-title');
  const body = document.getElementById('news-modal-body');
  if (!modal || !title || !body) return;

  title.textContent = item.title;
  body.innerHTML = `
    ${item.image ? `<img src="${item.image}" alt="${item.title}" />` : ''}
    <p class="meta">${item.date}</p>
    <h3>${item.title}</h3>
    <p>${item.detail || item.description}</p>
  `;

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeNewsModal() {
  const modal = document.getElementById('news-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function renderNews(items) {
  const list = document.getElementById('news-list');
  if (!list) return;

  list.innerHTML = items
    .map(
      (item) => `
        <article class="card card-news" data-title="${item.title}" tabindex="0">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" class="card-image" />` : ''}
          <p class="meta">${item.date}</p>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('#news-list .card-news').forEach((card) => {
    const title = card.getAttribute('data-title');
    const item = items.find((entry) => entry.title === title);
    if (!item) return;

    card.addEventListener('click', () => openNewsModal(item));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openNewsModal(item);
      }
    });
  });
}

function setSelectedPackage(title) {
  const select = document.getElementById('customer-package');
  if (!select) return;

  const exists = Array.from(select.options).some((option) => option.value === title);
  if (!exists) {
    const option = document.createElement('option');
    option.value = title;
    option.textContent = title;
    select.appendChild(option);
  }

  select.value = title;
  updatePricingSummary();
}

function parsePriceToNumber(priceText) {
  if (!priceText) return 0;
  const digitsOnly = String(priceText).replace(/[^\d]/g, '');
  if (!digitsOnly) return 0;
  return Number(digitsOnly);
}

function formatCurrency(value) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

function findPlanByTitle(title) {
  const catalog = [...wifiPlans, ...cameraPlans, ...tiviPlans];
  return catalog.find((plan) => plan.title === title) || null;
}

function getPlanCategory(title) {
  if (wifiPlans.some((plan) => plan.title === title)) return 'wifi';
  if (tiviPlans.some((plan) => plan.title === title)) return 'tivi';
  if (cameraPlans.some((plan) => plan.title === title)) return 'camera';
  return 'unknown';
}

function getPaymentMonths() {
  const termSelect = document.getElementById('customer-term');
  if (!termSelect) return 1;
  switch (termSelect.value) {
    case '6m':
      return 6;
    case '12m':
      return 12;
    default:
      return 1;
  }
}

function getPaymentLabel() {
  switch (getPaymentMonths()) {
    case 6:
      return '6 tháng';
    case 12:
      return '1 năm';
    default:
      return 'hàng tháng';
  }
}

function calculatePackageTotal(title) {
  const plan = findPlanByTitle(title);
  if (!plan) return 0;

  const category = getPlanCategory(title);
  const monthlyPrice = parsePriceToNumber(plan.price);
  const months = getPaymentMonths();
  const serviceTotal = months === 12 ? monthlyPrice * 11 : monthlyPrice * months;
  return category === 'wifi' ? serviceTotal + 300000 : serviceTotal;
}

function updatePricingSummary() {
  const summary = document.getElementById('price-summary');
  const packageSelect = document.getElementById('customer-package');
  if (!summary || !packageSelect) return;

  const selectedPackage = packageSelect.value;
  const paymentSection = document.getElementById('payment-section');
  if (!paymentSection) return;

  const category = getPlanCategory(selectedPackage);
  const shouldShowPayment = category === 'wifi' || category === 'tivi';
  paymentSection.classList.toggle('hidden', !shouldShowPayment);

  if (!selectedPackage || category === 'camera') {
    if (category === 'camera') {
      summary.textContent = 'Không áp dụng hình thức đóng cước cho gói này.';
    } else {
      summary.textContent = 'Vui lòng chọn gói để xem tổng tiền.';
    }
    return;
  }

  const plan = findPlanByTitle(selectedPackage);
  if (!plan) {
    summary.textContent = 'Gói này chưa có giá để tính tổng tiền.';
    return;
  }

  const monthlyPrice = parsePriceToNumber(plan.price);
  const months = getPaymentMonths();
  const serviceTotal = months === 12 ? monthlyPrice * 11 : monthlyPrice * months;
  const total = category === 'wifi' ? serviceTotal + 300000 : serviceTotal;
  const offerLabel = months === 12 ? 'Ưu đãi: tặng 1 tháng' : '';
  const priceText = `${formatCurrency(monthlyPrice)} × ${months} tháng`;
  const installFeeLine = category === 'wifi' ? `<br>Phí lắp đặt: <strong>${formatCurrency(300000)}</strong>` : '';

  summary.innerHTML = `Giá tháng: <strong>${priceText}</strong><br>${offerLabel ? `<span style="color:#a70012; font-weight:700;">${offerLabel}</span><br>` : ''}${installFeeLine}<br>Tổng tiền dự kiến: <strong>${formatCurrency(total)}</strong>`;
}

function renderWifiPlans(items) {
  const list = document.getElementById('wifi-list');
  if (!list) return;

  list.innerHTML = items
    .map(
      (item) => `
        <article class="card">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="price">${item.price}</div>
          <ul>${item.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>
          <div class="card-actions">
            <button class="btn btn-primary register-wifi" data-title="${item.title}">Đăng ký</button>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('#wifi-list .register-wifi').forEach((button) => {
    button.addEventListener('click', () => {
      const title = button.getAttribute('data-title');
      setSelectedPackage(title);
      openModal();
    });
  });
}

function renderSimPlans(items) {
  const list = document.getElementById('sim-list');
  if (!list) return;

  list.innerHTML = items
    .map(
      (item) => `
        <article class="card">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="price">${item.price}</div>
          ${item.features && item.features.length ? `<ul>${item.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>` : ''}
          <div class="card-actions">
            <a class="btn btn-primary" href="${item.link || 'https://viettel.vn/lan-toa/goi-cuoc?kh=hieubt_ldg_cnkd'}" target="_blank" rel="noopener noreferrer">Đăng ký</a>
          </div>
        </article>
      `
    )
    .join('');
}

function renderCameraPlans(items) {
  const list = document.getElementById('camera-list');
  if (!list) return;

  list.innerHTML = items
    .map(
      (item) => `
        <article class="card">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" class="card-image" />` : ''}
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="price">${item.price}</div>
          <ul>${item.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>
          <div class="card-actions">
            <button class="btn btn-primary register-wifi" data-title="${item.title}">Đăng ký</button>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('#camera-list .register-wifi').forEach((button) => {
    button.addEventListener('click', () => {
      const title = button.getAttribute('data-title');
      setSelectedPackage(title);
      openModal();
    });
  });
}

function renderTiviPlans(items) {
  const list = document.getElementById('tivi-list');
  if (!list) return;

  list.innerHTML = items
    .map(
      (item) => `
        <article class="card">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="price">${item.price}</div>
          <ul>${item.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>
          <div class="card-actions">
            <button class="btn btn-primary register-wifi" data-title="${item.title}">Đăng ký</button>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('#tivi-list .register-wifi').forEach((button) => {
    button.addEventListener('click', () => {
      const title = button.getAttribute('data-title');
      setSelectedPackage(title);
      openModal();
    });
  });
}

function renderPostpaidPlans(items) {
  const list = document.getElementById('postpaid-list');
  if (!list) return;

  list.innerHTML = items
    .map(
      (item) => `
        <article class="card">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          <div class="price">${item.price}</div>
          <ul>${item.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>
          <div class="card-actions">
            <button class="btn btn-primary register-wifi" data-title="${item.title}">Đăng ký</button>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('#postpaid-list .register-wifi').forEach((button) => {
    button.addEventListener('click', () => {
      const title = button.getAttribute('data-title');
      setSelectedPackage(title);
      openModal();
    });
  });
}

function populatePackageOptions(items) {
  const select = document.getElementById('customer-package');
  if (!select) return;
  const uniqueItems = Array.from(new Map(items.map((item) => [item.title, item])).values());
  select.innerHTML = ['<option value="">-- Chọn gói --</option>', ...uniqueItems.map((item) => `<option value="${item.title}">${item.title}</option>`)].join('');
}

function openModal() {
  const modal = document.getElementById('register-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  const modal = document.getElementById('register-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function initSideNavigation() {
  const links = document.querySelectorAll('.side-nav-link');
  const sections = Array.from(document.querySelectorAll('main section[id]'));

  const setActiveLink = () => {
    const scrollPosition = window.scrollY + window.innerHeight * 0.35;
    let activeId = sections[0]?.id;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        activeId = section.id;
      }
    });

    links.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('data-target') === activeId);
    });
  };

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (!targetSection) return;
      event.preventDefault();
      const top = targetSection.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    [newsItems, wifiPlans, simPlans, cameraPlans, tiviPlans, postpaidPlans, bannerItems] = await Promise.all([
      loadJson('./news.json'),
      loadJson('./wifi.json'),
      loadJson('./sim.json'),
      loadJson('./camera.json'),
      loadJson('./tivi.json'),
      loadJson('./postpaid.json'),
      loadJson('./banner.json'),
    ]);

    renderBanner(bannerItems);
    renderNews(newsItems);
    initSideNavigation();
    renderWifiPlans(wifiPlans);
    renderSimPlans(simPlans);
    renderCameraPlans(cameraPlans);
    renderTiviPlans(tiviPlans);
    renderPostpaidPlans(postpaidPlans);
    populatePackageOptions([...wifiPlans, ...cameraPlans, ...tiviPlans, ...postpaidPlans]);
  } catch (error) {
    document.getElementById('news-list').innerHTML = '<p>Không thể tải dữ liệu.</p>';
    document.getElementById('wifi-list').innerHTML = '<p>Không thể tải dữ liệu.</p>';
    document.getElementById('sim-list').innerHTML = '<p>Không thể tải dữ liệu.</p>';
    console.error(error);
  }

  document.getElementById('close-register')?.addEventListener('click', closeModal);
  document.getElementById('register-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'register-modal') closeModal();
  });

  document.getElementById('close-news')?.addEventListener('click', closeNewsModal);
  document.getElementById('news-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'news-modal') closeNewsModal();
  });

  document.getElementById('customer-package')?.addEventListener('change', updatePricingSummary);
  document.getElementById('customer-term')?.addEventListener('change', updatePricingSummary);

  document.getElementById('register-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('customer-name').value.trim();
    const packageName = document.getElementById('customer-package').value;
    const paymentTerm = document.getElementById('customer-term').value;
    const address = document.getElementById('customer-address').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const note = document.getElementById('customer-note').value.trim();

    if (!name || !packageName || !address || !phone) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    const category = getPlanCategory(packageName);
    const total = calculatePackageTotal(packageName);
    const paymentLabel = category === 'wifi' || category === 'tivi' ? (paymentTerm === '6m' ? '6 tháng' : paymentTerm === '12m' ? '1 năm (ưu đãi tặng 1 tháng)' : 'hàng tháng') : 'không áp dụng';
    const installLine = category === 'wifi' ? `\nPhí lắp đặt: ${formatCurrency(300000)}` : '';
    const message = `Khách hàng: ${name}\nGói: ${packageName}\nHình thức: ${paymentLabel}${installLine}\nTổng tiền: ${total ? formatCurrency(total) : 'Chưa xác định'}\nĐịa chỉ: ${address}\nSĐT: ${phone}\nGhi chú: ${note || 'Không có'}`;
    const email = 'bangtrunghieu777@gmail.com';
    const subject = encodeURIComponent('Đăng ký gói dịch vụ Viettel');
    const body = encodeURIComponent(message);

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    window.open(`https://zalo.me/0333031688?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');

    alert(`Đăng ký thành công cho ${name}\nGói: ${packageName}\nHình thức: ${paymentLabel}${category === 'wifi' ? `\nPhí lắp đặt: ${formatCurrency(300000)}` : ''}\nTổng tiền: ${total ? formatCurrency(total) : 'Chưa xác định'}\nĐịa chỉ: ${address}\nSĐT: ${phone}\nGhi chú: ${note || 'Không có'}`);
    event.target.reset();
    closeModal();
  });
});
