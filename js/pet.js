/* Pixel-art pets — sprite sheets + interactive companion */
const PET_NAMES = { owl: 'Búho', wolf: 'Lobo', dinosaur: 'Dino' };

const DISTRACTIONS = [
  '¡Oye, mira esto! 👀', '¿Ya terminaste? 😅', 'Un descanso... ☕',
  '¡Juguemos un ratito! 🎮', '¿Tienes hambre? 🍎', 'Zzz... 😴',
  '¡Sígueme! 🐾', '¿Estudiamos juntos? 📚'
];

function injectPetFilters() {
  if (document.getElementById('pet-svg-filters')) return;
  document.body.insertAdjacentHTML('afterbegin', `
    <svg id="pet-svg-filters" xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0" aria-hidden="true">
      <defs>
        <filter id="pet-remove-white" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1.05 -1.05 -1.05 3 0"/>
        </filter>
      </defs>
    </svg>`);
}

const PetRenderer = {
  build(type, size = 'normal') {
    const src = `/images/pets/${type}.png`;
    const cls = size === 'large' ? 'pet-sprite pet-sprite-img pet-sprite-lg' : 'pet-sprite pet-sprite-img';
    return `<img src="${src}" class="${cls} pet-sprite-${type} pet-anim-idle" alt="${PET_NAMES[type] || 'Mascota'}" draggable="false">`;
  }
};

window.PetRenderer = PetRenderer;

class PetController {
  constructor(el, pet) {
    this.el = el;
    this.inner = el.querySelector('.pet-float-inner');
    this.sprite = el.querySelector('.pet-sprite-img, .pet-sprite-sheet');
    this.pet = pet;
    this.x = window.innerWidth * 0.65;
    this.y = window.innerHeight * 0.55;
    this.targetX = this.x;
    this.targetY = this.y;
    this.mouseX = this.x;
    this.mouseY = this.y;
    this.prevMouseX = this.x;
    this.prevMouseY = this.y;
    this.state = 'idle';
    this.anim = 'idle';
    this.scaredUntil = 0;
    this.sleeping = false;
    this.distractionTimer = null;
    this.raf = null;
    this.lastTick = performance.now();

    this.bindEvents();
    this.startLoop();
    this.scheduleDistraction();
  }

  setAnim(name) {
    if (!this.sprite || this.anim === name) return;
    this.anim = name;
    this.sprite.classList.remove('pet-anim-idle', 'pet-anim-walk', 'pet-anim-happy', 'pet-anim-scared');
    this.sprite.classList.add(`pet-anim-${name}`);
  }

  bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.prevMouseX = this.mouseX;
      this.prevMouseY = this.mouseY;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      const speed = Math.hypot(this.mouseX - this.prevMouseX, this.mouseY - this.prevMouseY);
      const near = Math.hypot(this.mouseX - this.x, this.mouseY - this.y) < 80;
      if (speed > 35 && near && this.state !== 'scared' && !this.sleeping) {
        this.scare();
      }
    });

    this.inner.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.sleeping) {
        this.wakeUp();
        return;
      }
      this.happyClick();
    });
  }

  scare() {
    this.state = 'scared';
    this.scaredUntil = Date.now() + 1200;
    this.setAnim('scared');
    this.showBubble('¡Aah! 😱');

    const edges = [
      { x: 20, y: this.y },
      { x: window.innerWidth - 100, y: this.y },
      { x: this.x, y: 20 },
      { x: this.x, y: window.innerHeight - 120 }
    ];
    const nearest = edges.reduce((best, edge) => {
      const d = Math.hypot(edge.x - this.x, edge.y - this.y);
      return d < best.d ? { ...edge, d } : best;
    }, { d: Infinity, x: 20, y: this.y });

    this.targetX = nearest.x;
    this.targetY = nearest.y;
    setTimeout(() => {
      if (Date.now() >= this.scaredUntil) {
        this.state = 'idle';
        this.setAnim('idle');
      }
    }, 1200);
  }

  happyClick() {
    this.setAnim('happy');
    this.spawnHeart();
    this.showBubble('♥ ¡Gracias!');
    setTimeout(() => {
      if (this.state !== 'scared') this.setAnim('idle');
    }, 600);
  }

  spawnHeart() {
    const heart = document.createElement('span');
    heart.className = 'pet-heart';
    heart.textContent = '❤️';
    this.inner.appendChild(heart);
    setTimeout(() => heart.remove(), 900);
  }

  showBubble(text) {
    const bubble = this.el.querySelector('.pet-float-bubble');
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add('visible');
    clearTimeout(this._bubbleTimer);
    this._bubbleTimer = setTimeout(() => bubble.classList.remove('visible'), 2500);
  }

  wakeUp() {
    this.sleeping = false;
    this.el.classList.remove('pet-sleeping');
    this.setAnim('idle');
    this.showBubble('¡Buenos días! ☀️');
  }

  scheduleDistraction() {
    if (this.distractionTimer) clearInterval(this.distractionTimer);
    this.distractionTimer = setInterval(() => {
      if (this.sleeping || this.state === 'scared') return;
      if (Math.random() < 0.35) {
        const msg = DISTRACTIONS[Math.floor(Math.random() * DISTRACTIONS.length)];
        this.showBubble(msg);
        this.setAnim('happy');
        setTimeout(() => { if (this.state !== 'scared') this.setAnim('idle'); }, 500);
      }
    }, 18000);
  }

  updateVitals() {
    const hunger = this.pet.hunger ?? 100;
    const energy = this.pet.energy ?? 100;
    const sleep = this.pet.sleep ?? 100;

    const hud = this.el.querySelector('.pet-vitals');
    if (hud) {
      hud.innerHTML = `
        <span title="Hambre">🍎 ${hunger}%</span>
        <span title="Energía">⚡ ${energy}%</span>
        <span title="Sueño">😴 ${sleep}%</span>`;
    }

    if (sleep < 25 && !this.sleeping) {
      this.sleeping = true;
      this.el.classList.add('pet-sleeping');
      this.showBubble('Zzz... 💤');
    }

    if (hunger < 35) this.el.classList.add('pet-hungry');
    else this.el.classList.remove('pet-hungry');
  }

  startLoop() {
    const tick = (now) => {
      const dt = Math.min((now - this.lastTick) / 16, 3);
      this.lastTick = now;

      if (!this.sleeping && this.state !== 'scared') {
        const energy = (this.pet.energy ?? 100) / 100;
        const speed = 0.04 + energy * 0.06;
        this.targetX += (this.mouseX - this.x - 40) * speed * dt * 0.15;
        this.targetY += (this.mouseY - this.y - 40) * speed * dt * 0.15;
      }

      this.x += (this.targetX - this.x) * 0.12 * dt;
      this.y += (this.targetY - this.y) * 0.12 * dt;

      const vx = this.x - (this._lastX ?? this.x);
      const vy = this.y - (this._lastY ?? this.y);
      const speed = Math.hypot(vx, vy);
      this._lastX = this.x;
      this._lastY = this.y;

      this.x = Math.max(10, Math.min(window.innerWidth - 90, this.x));
      this.y = Math.max(10, Math.min(window.innerHeight - 100, this.y));

      const body = this.el.querySelector('.pet-body-3d');
      if (body) {
        const walking = speed > 0.4 && !this.sleeping && this.state !== 'scared';
        body.classList.toggle('pet-walking', walking);
        if (walking) this.setAnim('walk');
        else if (this.state !== 'scared' && this.anim !== 'happy') this.setAnim('idle');

        if (Math.abs(vx) > 0.2 && this.sprite) {
          this.sprite.style.setProperty('--face-dir', vx > 0 ? '1' : '-1');
        }
      }

      this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
      this.raf = requestAnimationFrame(tick);
    };
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
    this.raf = requestAnimationFrame(tick);
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.distractionTimer) clearInterval(this.distractionTimer);
  }
}

class PetWidget {
  constructor() {
    this.pet = null;
    this.controller = null;
    injectPetFilters();
    this.init();
  }

  async init() {
    if (!window.API?.Auth.isLoggedIn()) return;
    try {
      const data = await window.API.api('/profile');
      this.pet = data.pet;
      if (this.pet?.pending_choice) this.showChoiceModal();
      else if (this.pet?.unlocked && this.pet.pet_type) this.renderFloat();
    } catch { /* silent */ }
  }

  renderFloat() {
    if (this.controller) this.controller.destroy();
    const existing = document.getElementById('pet-float');
    if (existing) existing.remove();

    const type = this.pet.pet_type || 'owl';
    const mood = this.pet.happiness >= 80 ? '😊' : this.pet.happiness >= 50 ? '🙂' : '😐';

    const el = document.createElement('div');
    el.id = 'pet-float';
    el.className = `pet-float pet-pixel pet-interactive pet-${type}`;
    el.innerHTML = `
      <div class="pet-float-inner" title="${this.pet.name}">
        <div class="pet-vitals"></div>
        <span class="pet-float-stats">${this.pet.food_count || 0}</span>
        <div class="pet-body-3d">
          <div class="pet-sprite-wrap">
            ${PetRenderer.build(type)}
          </div>
          <div class="pet-shadow"></div>
        </div>
        <div class="pet-float-bubble">${mood} ${this.pet.name}</div>
      </div>`;

    document.body.appendChild(el);
    this.controller = new PetController(el, this.pet);
    this.controller.updateVitals();
  }

  celebrate() {
    const sprite = document.querySelector('#pet-float .pet-sprite-img, #pet-float .pet-sprite-sheet');
    if (sprite) {
      sprite.classList.add('pet-celebrate');
      setTimeout(() => sprite.classList.remove('pet-celebrate'), 800);
    }
    if (this.controller) this.controller.happyClick();
  }

  showChoiceModal() {
    if (document.getElementById('pet-choice-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'pet-choice-overlay';
    overlay.className = 'pet-choice-overlay';
    overlay.innerHTML = `
      <div class="pet-choice-modal">
        <h2>🎉 ¡Elige tu mascota!</h2>
        <p>Tu mascota te seguirá, reaccionará a tus clics y necesitará cuidados (hambre, energía y sueño).</p>
        <div class="pet-choice-grid">
          <div class="pet-choice-option" data-type="owl">${PetRenderer.build('owl', 'large')}<strong>Búho</strong></div>
          <div class="pet-choice-option" data-type="wolf">${PetRenderer.build('wolf', 'large')}<strong>Lobo</strong></div>
          <div class="pet-choice-option" data-type="dinosaur">${PetRenderer.build('dinosaur', 'large')}<strong>Dinosaurio</strong></div>
        </div>
        <input type="text" class="pet-choice-name" id="pet-name-input" placeholder="Nombre (opcional)" maxlength="30">
        <button class="btn btn-primary" id="pet-confirm-btn" disabled>Elegir mascota</button>
      </div>`;

    document.body.appendChild(overlay);
    let chosen = null;
    const confirmBtn = overlay.querySelector('#pet-confirm-btn');

    overlay.querySelectorAll('.pet-choice-option').forEach(opt => {
      opt.addEventListener('click', () => {
        overlay.querySelectorAll('.pet-choice-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        chosen = opt.dataset.type;
        confirmBtn.disabled = false;
        overlay.querySelector('#pet-name-input').placeholder = PET_NAMES[chosen];
      });
    });

    confirmBtn.addEventListener('click', async () => {
      if (!chosen) return;
      confirmBtn.textContent = 'Guardando...';
      confirmBtn.disabled = true;
      try {
        const name = overlay.querySelector('#pet-name-input').value.trim();
        const res = await window.API.api('/profile/pet/choose', {
          method: 'POST',
          body: JSON.stringify({ pet_type: chosen, name: name || undefined })
        });
        this.pet = res.pet;
        overlay.remove();
        this.renderFloat();
        this.celebrate();
      } catch (err) {
        alert(err.message);
        confirmBtn.textContent = 'Elegir mascota';
        confirmBtn.disabled = false;
      }
    });
  }

  async refresh() {
    if (!window.API?.Auth.isLoggedIn()) return;
    try {
      const data = await window.API.api('/profile');
      this.pet = data.pet;
      if (this.pet?.pending_choice) this.showChoiceModal();
      else if (this.pet?.unlocked && this.pet.pet_type) {
        if (this.controller) {
          this.controller.pet = this.pet;
          this.controller.updateVitals();
        } else {
          this.renderFloat();
        }
      }
    } catch { /* silent */ }
  }
}

window.PetWidget = PetWidget;
document.addEventListener('DOMContentLoaded', () => { window.petWidget = new PetWidget(); });
