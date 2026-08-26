var getApiUrl = function(path) {
  if (window.location.protocol === 'file:') return 'http://localhost:3000' + path;
  return path;
};

// =============================================
//  RENTRIGHT — Clean App Logic
// =============================================

// ===== HERE MAPS CONFIG =====
var HERE_API_KEY = (window.RENTRIGHT_CONFIG && window.RENTRIGHT_CONFIG.hereApiKey) || "";
var activeMapInstance = null;

// ===== MULTI-CITY LISTINGS DATA =====
var ALL_LISTINGS = {
  "bengaluru": [
    {
      "id": 101,
      "name": "Green Meadows Apartment",
      "area": "Koramangala",
      "city": "Bengaluru",
      "type": "2BHK",
      "price": 22000,
      "score": 92,
      "scores": {
        "rent": 88,
        "distance": 95,
        "transport": 91,
        "safety": 87,
        "amenities": 94,
        "reviews": 90
      },
      "distance": "1.2 km",
      "commute": "12 min",
      "tags": [
        "🚇 Metro 200m",
        "✅ Pet-friendly",
        "🛋️ Furnished"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Gym",
        "Parking",
        "Pet-friendly",
        "24/7 Security",
        "Power Backup",
        "CCTV"
      ],
      "icon": "🏙️",
      "color": "#6366f1",
      "lat": 12.9352,
      "lng": 77.6245,
      "reviews": [
        {
          "stars": 5,
          "text": "Excellent locality with great connectivity. Metro station is just 5 mins walk!",
          "author": "Rahul M."
        },
        {
          "stars": 4,
          "text": "Good apartment, gym included. Safety is great.",
          "author": "Sneha T."
        }
      ]
    },
    {
      "id": 102,
      "name": "Sky Heights Residence",
      "area": "Indiranagar",
      "city": "Bengaluru",
      "type": "1BHK",
      "price": 18500,
      "score": 87,
      "scores": {
        "rent": 91,
        "distance": 82,
        "transport": 85,
        "safety": 92,
        "amenities": 80,
        "reviews": 88
      },
      "distance": "2.8 km",
      "commute": "22 min",
      "tags": [
        "🏋️ Gym included",
        "🅿️ Parking",
        "🔒 Gated"
      ],
      "amenities": [
        "WiFi",
        "Gym",
        "Parking",
        "24/7 Security",
        "CCTV",
        "AC",
        "Laundry"
      ],
      "icon": "🌆",
      "color": "#06b6d4",
      "lat": 12.9784,
      "lng": 77.6408,
      "reviews": [
        {
          "stars": 5,
          "text": "Indiranagar is amazing! Clean and well-maintained.",
          "author": "Priya S."
        }
      ]
    },
    {
      "id": 103,
      "name": "Sunrise Garden Homes",
      "area": "HSR Layout",
      "city": "Bengaluru",
      "type": "2BHK",
      "price": 26500,
      "score": 85,
      "scores": {
        "rent": 74,
        "distance": 89,
        "transport": 88,
        "safety": 94,
        "amenities": 86,
        "reviews": 82
      },
      "distance": "3.1 km",
      "commute": "18 min",
      "tags": [
        "🌿 Garden",
        "🏊 Pool",
        "🛡️ High Safety"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Pool",
        "Garden",
        "Parking",
        "24/7 Security",
        "Power Backup",
        "AC"
      ],
      "icon": "🌿",
      "color": "#10b981",
      "lat": 12.9128,
      "lng": 77.6387,
      "reviews": [
        {
          "stars": 5,
          "text": "Gated community with pool and garden. Feels like a resort!",
          "author": "Ananya K."
        }
      ]
    },
    {
      "id": 104,
      "name": "Metro View Apartments",
      "area": "Whitefield",
      "city": "Bengaluru",
      "type": "3BHK",
      "price": 35000,
      "score": 83,
      "scores": {
        "rent": 68,
        "distance": 91,
        "transport": 96,
        "safety": 80,
        "amenities": 88,
        "reviews": 79
      },
      "distance": "0.8 km",
      "commute": "8 min",
      "tags": [
        "🚇 Walk to Metro",
        "🏢 IT Hub",
        "⚡ Power Backup"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Gym",
        "Parking",
        "Power Backup",
        "CCTV",
        "Laundry",
        "AC"
      ],
      "icon": "🚇",
      "color": "#f59e0b",
      "lat": 12.9698,
      "lng": 77.7499,
      "reviews": [
        {
          "stars": 4,
          "text": "Best transit connectivity! Metro at walking distance.",
          "author": "Vikram P."
        }
      ]
    },
    {
      "name": "Test Admin Flat",
      "city": "bengaluru",
      "area": "Indiranagar",
      "price": 50000,
      "type": "1BHK",
      "ownerEmail": "testadmin@test.com",
      "id": 1787719715751
    }
  ],
  "mumbai": [
    {
      "id": 201,
      "name": "Sea Breeze Towers",
      "area": "Bandra West",
      "city": "Mumbai",
      "type": "2BHK",
      "price": 65000,
      "score": 91,
      "scores": {
        "rent": 72,
        "distance": 96,
        "transport": 94,
        "safety": 93,
        "amenities": 90,
        "reviews": 92
      },
      "distance": "0.9 km",
      "commute": "10 min",
      "tags": [
        "🌊 Sea View",
        "🚇 Metro nearby",
        "🏪 Premium area"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Gym",
        "Parking",
        "24/7 Security",
        "Power Backup",
        "CCTV",
        "AC"
      ],
      "icon": "🏢",
      "color": "#06b6d4",
      "lat": 19.0596,
      "lng": 72.8295,
      "reviews": [
        {
          "stars": 5,
          "text": "Breathtaking views and amazing connectivity. Bandra is the place to be!",
          "author": "Vikram K."
        }
      ]
    },
    {
      "id": 202,
      "name": "Gokul Heights",
      "area": "Andheri East",
      "city": "Mumbai",
      "type": "1BHK",
      "price": 32000,
      "score": 86,
      "scores": {
        "rent": 89,
        "distance": 88,
        "transport": 92,
        "safety": 84,
        "amenities": 80,
        "reviews": 85
      },
      "distance": "1.5 km",
      "commute": "15 min",
      "tags": [
        "🚇 Metro 100m",
        "💼 Near WEH",
        "🛒 Supermarket Walk"
      ],
      "amenities": [
        "WiFi",
        "Parking",
        "24/7 Security",
        "CCTV",
        "AC",
        "Laundry"
      ],
      "icon": "🏙️",
      "color": "#6366f1",
      "lat": 19.1155,
      "lng": 72.8663,
      "reviews": [
        {
          "stars": 4,
          "text": "Very close to the metro station, extremely convenient for daily travel.",
          "author": "Aditya S."
        }
      ]
    },
    {
      "id": 203,
      "name": "Skyline Meadows",
      "area": "Powai",
      "city": "Mumbai",
      "type": "2BHK",
      "price": 48000,
      "score": 84,
      "scores": {
        "rent": 80,
        "distance": 85,
        "transport": 82,
        "safety": 91,
        "amenities": 88,
        "reviews": 83
      },
      "distance": "2.3 km",
      "commute": "20 min",
      "tags": [
        "🌿 Gated Community",
        "🚣 Powai Lake view",
        "🏋️ Premium Gym"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Gym",
        "Pool",
        "Parking",
        "24/7 Security",
        "Power Backup",
        "CCTV"
      ],
      "icon": "🌿",
      "color": "#10b981",
      "lat": 19.1176,
      "lng": 72.906,
      "reviews": [
        {
          "stars": 5,
          "text": "Clean air, quiet environment compared to rest of Mumbai, and excellent amenities.",
          "author": "Neha G."
        }
      ]
    }
  ],
  "hyderabad": [
    {
      "id": 301,
      "name": "Cyber Residency",
      "area": "Gachibowli",
      "city": "Hyderabad",
      "type": "2BHK",
      "price": 28000,
      "score": 93,
      "scores": {
        "rent": 90,
        "distance": 96,
        "transport": 88,
        "safety": 91,
        "amenities": 92,
        "reviews": 90
      },
      "distance": "0.8 km",
      "commute": "8 min",
      "tags": [
        "🏢 IT Corridor",
        "🏊 Infinity Pool",
        "⚡ 100% Backup"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Gym",
        "Pool",
        "Parking",
        "24/7 Security",
        "Power Backup",
        "CCTV",
        "AC"
      ],
      "icon": "🏢",
      "color": "#10b981",
      "lat": 17.4401,
      "lng": 78.3489,
      "reviews": [
        {
          "stars": 5,
          "text": "Incredibly close to major IT offices. The backup is stable and pool is great.",
          "author": "Karthik R."
        }
      ]
    },
    {
      "id": 302,
      "name": "Pearl Crest Apartments",
      "area": "HITEC City",
      "city": "Hyderabad",
      "type": "3BHK",
      "price": 42000,
      "score": 88,
      "scores": {
        "rent": 78,
        "distance": 91,
        "transport": 90,
        "safety": 93,
        "amenities": 94,
        "reviews": 87
      },
      "distance": "1.4 km",
      "commute": "12 min",
      "tags": [
        "🚇 Metro 400m",
        "💎 Luxury Living",
        "🏪 Mall Adjacent"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Gym",
        "Pool",
        "Garden",
        "Parking",
        "24/7 Security",
        "CCTV",
        "AC"
      ],
      "icon": "💎",
      "color": "#8b5cf6",
      "lat": 17.4483,
      "lng": 78.3741,
      "reviews": [
        {
          "stars": 5,
          "text": "Very luxurious flats. Connected directly to local malls and main transit line.",
          "author": "Sonia P."
        }
      ]
    },
    {
      "id": 303,
      "name": "Kondapur Heights",
      "area": "Kondapur",
      "city": "Hyderabad",
      "type": "1BHK",
      "price": 16500,
      "score": 85,
      "scores": {
        "rent": 95,
        "distance": 84,
        "transport": 82,
        "safety": 86,
        "amenities": 78,
        "reviews": 84
      },
      "distance": "2.5 km",
      "commute": "20 min",
      "tags": [
        "💰 Budget Friendly",
        "🅿️ Parking",
        "🛒 Market nearby"
      ],
      "amenities": [
        "WiFi",
        "Parking",
        "24/7 Security",
        "CCTV",
        "AC",
        "Laundry"
      ],
      "icon": "🏠",
      "color": "#f59e0b",
      "lat": 17.4699,
      "lng": 78.3578,
      "reviews": [
        {
          "stars": 4,
          "text": "Extremely affordable standard 1BHK. Markets are right outside.",
          "author": "Ravi Teja"
        }
      ]
    },
    {
      "name": "erragadda",
      "city": "hyderabad",
      "area": "metro station",
      "price": 6888,
      "type": "2BHK",
      "commute": "89 min",
      "distance": "1 km",
      "scores": {
        "rent": 91,
        "distance": 92,
        "transport": 85,
        "safety": 78,
        "amenities": 20,
        "reviews": 80
      },
      "score": 78,
      "tags": [
        "🛋️ 2BHK",
        "📍 metro station"
      ],
      "amenities": [
        "WiFi",
        "Gym"
      ],
      "icon": "🏢",
      "color": "#6366f1",
      "lat": 9,
      "lng": 62.78,
      "reviews": [
        {
          "stars": 4,
          "text": "Newly added listing managed by Admin panel.",
          "author": "System Admin"
        }
      ],
      "id": 1787719080651,
      "ownerEmail": "admin@rentright.com"
    }
  ],
  "pune": [
    {
      "id": 401,
      "name": "Viman Platinum Suites",
      "area": "Viman Nagar",
      "city": "Pune",
      "type": "2BHK",
      "price": 26000,
      "score": 92,
      "scores": {
        "rent": 89,
        "distance": 95,
        "transport": 88,
        "safety": 93,
        "amenities": 91,
        "reviews": 89
      },
      "distance": "1.1 km",
      "commute": "10 min",
      "tags": [
        "✈️ Near Airport",
        "🛍️ Phoenix Mall 2m",
        "✅ Gated Society"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Gym",
        "Parking",
        "24/7 Security",
        "Power Backup",
        "CCTV",
        "AC"
      ],
      "icon": "🏙️",
      "color": "#6366f1",
      "lat": 18.5679,
      "lng": 73.9143,
      "reviews": [
        {
          "stars": 5,
          "text": "Best locality in Pune. Walkable to major offices, malls and restaurants.",
          "author": "Abhijit P."
        }
      ]
    },
    {
      "id": 402,
      "name": "Hinjenest Co-Living",
      "area": "Hinjewadi Phase 1",
      "city": "Pune",
      "type": "Studio",
      "price": 11000,
      "score": 87,
      "scores": {
        "rent": 96,
        "distance": 93,
        "transport": 80,
        "safety": 85,
        "amenities": 76,
        "reviews": 86
      },
      "distance": "0.8 km",
      "commute": "7 min",
      "tags": [
        "💰 Low Budget",
        "🤝 Co-Living Community",
        "📶 High speed Net"
      ],
      "amenities": [
        "WiFi",
        "Parking",
        "24/7 Security",
        "CCTV",
        "Laundry"
      ],
      "icon": "🤝",
      "color": "#ec4899",
      "lat": 18.5913,
      "lng": 73.7389,
      "reviews": [
        {
          "stars": 4,
          "text": "Highly budget-friendly option for junior developers working in Hinjewadi.",
          "author": "Tanmay B."
        }
      ]
    },
    {
      "id": 403,
      "name": "Koregaon Park Residency",
      "area": "Koregaon Park",
      "city": "Pune",
      "type": "3BHK",
      "price": 55000,
      "score": 83,
      "scores": {
        "rent": 62,
        "distance": 80,
        "transport": 85,
        "safety": 96,
        "amenities": 94,
        "reviews": 91
      },
      "distance": "3.5 km",
      "commute": "25 min",
      "tags": [
        "🌳 Greenery",
        "⭐ Premium Neighborhood",
        "🏊 Pool & Gym"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Gym",
        "Pool",
        "Garden",
        "Parking",
        "24/7 Security",
        "CCTV",
        "AC"
      ],
      "icon": "🌳",
      "color": "#10b981",
      "lat": 18.5362,
      "lng": 73.894,
      "reviews": [
        {
          "stars": 5,
          "text": "Ultimate luxury surrounded by beautiful green trees. Truly high safety.",
          "author": "Payal M."
        }
      ]
    }
  ],
  "chennai": [
    {
      "id": 501,
      "name": "OMR Tech Park Villas",
      "area": "Sholinganallur",
      "city": "Chennai",
      "type": "3BHK",
      "price": 34000,
      "score": 90,
      "scores": {
        "rent": 85,
        "distance": 94,
        "transport": 88,
        "safety": 89,
        "amenities": 92,
        "reviews": 88
      },
      "distance": "1.0 km",
      "commute": "10 min",
      "tags": [
        "🏢 IT Corridor",
        "🍃 Airy Rooms",
        "🅿️ Dual Parking"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Gym",
        "Parking",
        "24/7 Security",
        "Power Backup",
        "CCTV",
        "AC",
        "Garden"
      ],
      "icon": "🏠",
      "color": "#06b6d4",
      "lat": 12.901,
      "lng": 80.2279,
      "reviews": [
        {
          "stars": 5,
          "text": "A spacious community property. Sholinganallur junction is very near.",
          "author": "Balaji V."
        }
      ]
    },
    {
      "id": 502,
      "name": "Adyar Palms",
      "area": "Adyar",
      "city": "Chennai",
      "type": "2BHK",
      "price": 29000,
      "score": 86,
      "scores": {
        "rent": 82,
        "distance": 84,
        "transport": 91,
        "safety": 94,
        "amenities": 80,
        "reviews": 89
      },
      "distance": "2.1 km",
      "commute": "18 min",
      "tags": [
        "🏖️ Near Beach",
        "🚇 MRTS walking",
        "🛡️ High Safety"
      ],
      "amenities": [
        "WiFi",
        "Parking",
        "24/7 Security",
        "CCTV",
        "AC",
        "Laundry"
      ],
      "icon": "🏖️",
      "color": "#6366f1",
      "lat": 13.0063,
      "lng": 80.2574,
      "reviews": [
        {
          "stars": 4,
          "text": "Safe environment, close to Adyar signal and transit lines.",
          "author": "Gayathri S."
        }
      ]
    }
  ],
  "delhi": [
    {
      "id": 601,
      "name": "Cyber City View Suites",
      "area": "DLF Phase 3, Gurugram",
      "city": "Delhi NCR",
      "type": "2BHK",
      "price": 38000,
      "score": 92,
      "scores": {
        "rent": 80,
        "distance": 96,
        "transport": 94,
        "safety": 88,
        "amenities": 92,
        "reviews": 90
      },
      "distance": "0.7 km",
      "commute": "8 min",
      "tags": [
        "🚇 Rapid Metro",
        "🏢 Cyber City adjacent",
        "🏋️ Club Gym"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Gym",
        "Parking",
        "24/7 Security",
        "Power Backup",
        "CCTV",
        "AC",
        "Laundry"
      ],
      "icon": "🏙️",
      "color": "#6366f1",
      "lat": 28.4909,
      "lng": 77.0896,
      "reviews": [
        {
          "stars": 5,
          "text": "Perfect location for Cyber City employees. Commuting is exceptionally fast.",
          "author": "Nikhil D."
        }
      ]
    },
    {
      "id": 602,
      "name": "Green Park Heights",
      "area": "Green Park, Delhi",
      "city": "Delhi NCR",
      "type": "2BHK",
      "price": 42000,
      "score": 86,
      "scores": {
        "rent": 76,
        "distance": 88,
        "transport": 92,
        "safety": 91,
        "amenities": 82,
        "reviews": 88
      },
      "distance": "1.8 km",
      "commute": "14 min",
      "tags": [
        "🌳 Park view",
        "🚇 Yellow Line Metro",
        "🛒 Market 50m"
      ],
      "amenities": [
        "Furnished",
        "WiFi",
        "Parking",
        "24/7 Security",
        "CCTV",
        "AC"
      ],
      "icon": "🌳",
      "color": "#10b981",
      "lat": 28.5588,
      "lng": 77.2028,
      "reviews": [
        {
          "stars": 4,
          "text": "Lovely community. Green Park Metro is just a 5-minute walk.",
          "author": "Ritu M."
        }
      ]
    }
  ]
};

var currentListings = [];

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', function () {
  var nav = document.getElementById('navbar');
  if (nav) {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
});

// ===== PARTICLES =====
(function () {
  var canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var particles = [];

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function init() {
    particles = [];
    var count = Math.min(35, Math.floor((canvas.width * canvas.height) / 50000));
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        a: Math.random() * 0.4 + 0.1,
        c: Math.random() > 0.5 ? '99,102,241' : '6,182,212'
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  init();
  draw();
  window.addEventListener('resize', function () { resize(); init(); });
})();

// ===== COUNTER ANIMATION =====
function animateCounters() {
  var els = document.querySelectorAll('.stat-num');
  els.forEach(function (el) {
    var target = parseInt(el.getAttribute('data-target'));
    var duration = 1800;
    var steps = 60;
    var inc = target / steps;
    var cur = 0;
    var t = setInterval(function () {
      cur = Math.min(cur + inc, target);
      el.textContent = Math.floor(cur).toLocaleString('en-IN');
      if (cur >= target) clearInterval(t);
    }, duration / steps);
  });
}

var heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  var obs = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { animateCounters(); obs.disconnect(); }
  }, { threshold: 0.3 });
  obs.observe(heroStats);
}

// ===== SLIDERS =====
function initSlider(sliderId, displayId, min, max) {
  var slider = document.getElementById(sliderId);
  var display = document.getElementById(displayId);
  if (!slider || !display) return;
  function update() {
    var pct = ((slider.value - min) / (max - min)) * 100;
    slider.style.background = 'linear-gradient(to right,#6366f1 0%,#6366f1 ' + pct + '%,rgba(255,255,255,0.1) ' + pct + '%)';
    display.textContent = parseInt(slider.value).toLocaleString('en-IN');
  }
  slider.addEventListener('input', update);
  update();
}
initSlider('budget-slider', 'budget-value', 5000, 100000);
initSlider('commute-slider', 'commute-value', 10, 90);
initSlider('walk-slider', 'walk-value', 100, 2000);

// ===== TYPE BUTTONS =====
document.querySelectorAll('.type-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.type-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

// ===== COMMUTE RADIO =====
document.querySelectorAll('input[name="commute"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    document.querySelectorAll('.commute-card').forEach(function (c) { c.classList.remove('active'); });
    if (radio.nextElementSibling) radio.nextElementSibling.classList.add('active');
  });
});

// ===== AMENITY CHIPS =====
var chipsContainer = document.getElementById('amenity-chips');
if (chipsContainer) {
  chipsContainer.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (chip) chip.classList.toggle('active');
  });
}

// ===== SAFETY STARS =====
var safetyStars = document.querySelectorAll('.star-btn');
var safetyLbl = document.getElementById('safety-label');
var starLabels = ['', 'Acceptable (1+)', 'Decent (2+)', 'Good (3+)', 'Very Good (4+)', 'Excellent (5)'];
safetyStars.forEach(function (btn) {
  btn.addEventListener('click', function () {
    var val = parseInt(btn.getAttribute('data-val'));
    safetyStars.forEach(function (s) {
      s.classList.toggle('active', parseInt(s.getAttribute('data-val')) <= val);
    });
    if (safetyLbl) safetyLbl.textContent = starLabels[val];
  });
});

// ===== AI SEARCH =====
var analysisInProgress = false;

function getSearchPreferences() {
  var selectedType = document.querySelector('.type-btn.active');
  var selectedCommute = document.querySelector('input[name="commute"]:checked');
  var activeStars = document.querySelectorAll('.star-btn.active');
  var selectedAmenities = document.querySelectorAll('#amenity-chips .chip.active');
  var budget = document.getElementById('budget-slider');
  var city = document.getElementById('city-select');
  var commute = document.getElementById('commute-slider');
  var walkingDistance = document.getElementById('walk-slider');
  var location = document.getElementById('location-input');

  return {
    budget: budget ? Number(budget.value) : 0,
    city: city ? city.value : 'bengaluru',
    propertyType: selectedType ? selectedType.getAttribute('data-type') : '',
    maxCommute: commute ? Number(commute.value) : 90,
    commuteMode: selectedCommute ? selectedCommute.value : 'public',
    maxWalkingDistance: walkingDistance ? Number(walkingDistance.value) : 0,
    minSafety: activeStars.length ? Number(activeStars[activeStars.length - 1].getAttribute('data-val')) : 1,
    amenities: Array.prototype.map.call(selectedAmenities, function (chip) {
      return chip.getAttribute('data-amenity');
    }),
    workplace: location ? location.value.trim() : ''
  };
}

async function requestRecommendations(preferences) {
  try {
    var response = await fetch(getApiUrl('/api/recommendations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    var payload = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(payload.error || 'Recommendation API returned an error.');
    if (!Array.isArray(payload.listings)) throw new Error('The recommendation service returned an invalid response.');
    return payload.listings;
  } catch (error) {
    // A user may open index.html directly, where a relative API URL is not
    // available. Keep the recommendation feature useful in that case by
    // ranking the bundled listings with the same preference signals.
    console.warn('Recommendation API unavailable; using local analysis.', error);
    return getLocalRecommendations(preferences);
  }
}

function normalisePreference(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normaliseAmenityPreference(value) {
  var aliases = { pet: 'petfriendly', security: '247security', power: 'powerbackup' };
  var key = normalisePreference(value);
  return aliases[key] || key;
}

function normaliseCityPreference(value) {
  var aliases = {
    bangalore: 'bengaluru', bengaluru: 'bengaluru',
    bombay: 'mumbai', mumbai: 'mumbai', hyderabad: 'hyderabad', pune: 'pune',
    chennai: 'chennai', madras: 'chennai', delhi: 'delhi', delhincr: 'delhi',
    ncr: 'delhi', gurugram: 'delhi', gurgaon: 'delhi'
  };
  return aliases[normalisePreference(value)] || '';
}

function matchesWorkplacePreference(listing, workplace) {
  var query = normalisePreference(workplace);
  if (!query) return true;

  var locality = normalisePreference(listing.area);
  return query.indexOf(locality) !== -1 || locality.indexOf(query) !== -1;
}

function getLocalRecommendations(preferences) {
  var city = normaliseCityPreference(preferences.city || 'bengaluru');
  if (!city || !ALL_LISTINGS[city]) return [];

  var candidates = ALL_LISTINGS[city];
  var budget = Number(preferences.budget) || 0;
  var propertyType = normalisePreference(preferences.propertyType);
  var workplace = preferences.workplace || '';
  var minSafety = Number.isFinite(Number(preferences.minSafety))
    ? Math.min(5, Math.max(1, Number(preferences.minSafety))) * 20
    : 0;
  var maxCommute = Number.isFinite(Number(preferences.maxCommute)) && Number(preferences.maxCommute) > 0
    ? Number(preferences.maxCommute)
    : Infinity;
  var requestedAmenities = Array.isArray(preferences.amenities)
    ? preferences.amenities.map(normaliseAmenityPreference).filter(Boolean)
    : [];
  candidates = candidates.filter(function (listing) {
    var availableAmenities = listing.amenities.map(normalisePreference);
    var commuteMinutes = Number.parseInt(listing.commute, 10) || Infinity;
    return (!propertyType || normalisePreference(listing.type) === propertyType) &&
      listing.scores.safety >= minSafety &&
      commuteMinutes <= maxCommute &&
      matchesWorkplacePreference(listing, workplace) &&
      requestedAmenities.every(function (amenity) { return availableAmenities.indexOf(amenity) !== -1; });
  });

  return candidates
    .map(function (listing) {
      var commuteMinutes = Number.parseInt(listing.commute, 10) || 90;
      var availableAmenities = listing.amenities.map(normalisePreference);
      var matchedAmenities = requestedAmenities.filter(function (amenity) {
        return availableAmenities.indexOf(amenity) !== -1;
      }).length;
      var amenityScore = requestedAmenities.length ? (matchedAmenities / requestedAmenities.length) * 8 : 0;
      var budgetScore = budget ? Math.max(-10, 8 - Math.abs(listing.price - budget) / budget * 12) : 0;
      var commuteScore = Math.max(-8, 6 - Math.max(0, commuteMinutes - maxCommute) * 0.5);
      var propertyScore = propertyType && normalisePreference(listing.type) === propertyType ? 8 : 0;
      var matchScore = Math.round(Math.max(0, Math.min(100, listing.score * 0.7 + amenityScore + budgetScore + commuteScore + propertyScore)));
      return Object.assign({}, listing, { score: matchScore, matchedAmenities: matchedAmenities });
    })
    .sort(function (a, b) { return b.score - a.score || a.price - b.price; });
}

function startAISearch() {
  if (analysisInProgress) return;
  analysisInProgress = true;

  var overlay = document.getElementById('ai-overlay');
  var fill    = document.getElementById('ai-progress-fill');
  var status  = document.getElementById('ai-status');
  var steps   = document.querySelectorAll('.ai-step-item');
  var findButton = document.getElementById('find-btn');
  var preferences = getSearchPreferences();

  if (findButton) findButton.disabled = true;

  if (!overlay) {
    requestRecommendations(preferences)
      .then(showResults)
      .catch(showAnalysisError)
      .finally(function () {
        analysisInProgress = false;
        if (findButton) findButton.disabled = false;
      });
    return;
  }

  // Reset
  for (var s = 0; s < steps.length; s++) {
    steps[s].classList.remove('active', 'done');
  }
  if (fill)   { fill.style.width = '0%'; fill.style.transition = 'none'; }
  if (status) { status.textContent = 'Preparing your preferences for analysis...'; }

  // Show overlay
  overlay.style.display = 'flex';
  overlay.style.opacity = '1';

  var msgs = [
    'Reading your budget and location preferences...',
    'Evaluating neighborhood safety scores...',
    'Calculating affordability index...',
    'Comparing commute requirements...',
    'Matching amenity preferences...',
    'Scoring property details and tenant reviews...',
    'Ranking your best rental matches...'
  ];

  var STEP_MS = 220;

  // Schedule each step
  for (var i = 0; i < steps.length; i++) {
    (function (idx) {
      setTimeout(function () {
        // Mark previous done
        if (idx > 0) {
          steps[idx - 1].classList.remove('active');
          steps[idx - 1].classList.add('done');
        }
        // Activate current
        steps[idx].classList.add('active');
        // Progress bar
        var pct = Math.round(((idx + 1) / steps.length) * 100);
        if (fill) {
          fill.style.transition = 'width 0.2s ease';
          fill.style.width = pct + '%';
        }
        if (status) status.textContent = msgs[idx] || 'Processing...';
      }, STEP_MS * (idx + 1));
    })(i);
  }

  // Start the real recommendation request while the analysis progress is shown.
  var recommendationRequest = requestRecommendations(preferences);

  // Finish the progress display.
  var finishTime = STEP_MS * (steps.length + 1);
  setTimeout(function () {
    for (var s = 0; s < steps.length; s++) {
      steps[s].classList.remove('active');
      steps[s].classList.add('done');
    }
    if (fill) { fill.style.width = '100%'; }
    if (status) status.textContent = 'Finishing your personalized ranking...';
  }, finishTime);

  // Close and show the API-ranked results once both the request and animation finish.
  setTimeout(function () {
    recommendationRequest
      .then(function (listings) {
        if (status) status.textContent = '✅ Analysis complete! Loading your results...';
        overlay.style.transition = 'opacity 0.3s';
        overlay.style.opacity = '0';
        setTimeout(function () {
          overlay.style.display = 'none';
          overlay.style.transition = '';
          showResults(listings);
        }, 350);
      })
      .catch(function (error) {
        overlay.style.display = 'none';
        showAnalysisError(error);
      })
      .finally(function () {
        analysisInProgress = false;
        if (findButton) findButton.disabled = false;
      });
  }, finishTime + 500);
}

// ===== SHOW RESULTS =====
function showAnalysisError(error) {
  console.error('Recommendation analysis failed:', error);
  alert((error && error.message) || 'Unable to analyze listings right now. Start the local server and try again.');
}

function showResults(listings) {
  var section = document.getElementById('results-section');
  if (!section) return;

  currentListings = Array.isArray(listings) ? listings : [];
  window.currentListings = currentListings;

  section.style.display = 'block';
  renderListings(currentListings);
  setTimeout(function () {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ===== RENDER LISTINGS =====
function renderListings(list) {
  var grid = document.getElementById('listings-grid');
  var countEl = document.getElementById('results-count');
  if (!grid) return;
  if (countEl) countEl.textContent = list.length;
  grid.innerHTML = '';

  if (!list.length) {
    grid.innerHTML = '<p class="results-sub">No listings match those filters in this city. Try a higher commute limit, fewer amenities, or another property type.</p>';
    return;
  }

  var scoreColors = {
    rent: '#10b981', distance: '#6366f1', transport: '#06b6d4',
    safety: '#f59e0b', amenities: '#8b5cf6', reviews: '#ec4899'
  };

  list.forEach(function (l, idx) {
    var card = document.createElement('div');
    card.className = 'listing-card' + (idx === 0 ? ' top-pick' : '');
    // Dynamic property modal opener using global currentListings reference
    card.setAttribute('onclick', 'openProperty(currentListings[' + idx + '])');

    var barsHTML = '';
    var keys = ['rent', 'distance', 'transport', 'safety', 'amenities', 'reviews'];
    keys.forEach(function (key) {
      var val = l.scores[key];
      barsHTML += '<div class="score-bar-row">' +
        '<span class="score-bar-label">' + cap(key) + '</span>' +
        '<div class="score-bar-track"><div class="score-bar-fill" style="width:' + val + '%;background:' + scoreColors[key] + '"></div></div>' +
        '<span class="score-bar-val" style="color:' + scoreColors[key] + '">' + val + '</span>' +
        '</div>';
    });

    var tagsHTML = l.tags.map(function (t) { return '<span class="card-tag">' + t + '</span>'; }).join('');

    card.innerHTML =
      '<div class="card-image" style="background:linear-gradient(135deg,' + l.color + '33,#0f1626)">' +
        '<div class="card-image-bg">' + l.icon + '</div>' +
        '<div class="card-image-overlay"></div>' +
        '<div class="card-score-badge"><span class="score-num">' + l.score + '</span><span class="score-label">SCORE</span></div>' +
        '<div class="card-price-overlay">₹' + l.price.toLocaleString('en-IN') + '<span>/mo</span></div>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-title">' + l.name + '</div>' +
        '<div class="card-location">📍 ' + l.area + ' · ' + l.type + '</div>' +
        '<div class="card-metrics">' +
          '<div class="card-metric"><div class="metric-val" style="color:#6366f1">' + l.distance + '</div><div class="metric-name">Distance</div></div>' +
          '<div class="card-metric"><div class="metric-val" style="color:#06b6d4">' + l.commute + '</div><div class="metric-name">Commute</div></div>' +
          '<div class="card-metric"><div class="metric-val" style="color:#f59e0b">' + l.scores.safety + '/100</div><div class="metric-name">Safety</div></div>' +
        '</div>' +
        '<div class="score-bar-wrap">' + barsHTML + '</div>' +
        '<div class="card-tags">' + tagsHTML + '</div>' +
        '<div class="card-actions">' +
          '<button class="btn-primary" onclick="event.stopPropagation();openProperty(currentListings[' + idx + '])">View Details</button>' +
          '<button class="btn-outline" onclick="event.stopPropagation();alert(\'Saved!\')">💾 Save</button>' +
        '</div>' +
      '</div>';

    grid.appendChild(card);
  });
}

// ===== SORT =====
function sortResults() {
  var val = document.getElementById('sort-select');
  if (!val) return;
  var sorted = currentListings.slice();
  if (val.value === 'price-asc')   sorted.sort(function (a, b) { return a.price - b.price; });
  else if (val.value === 'price-desc') sorted.sort(function (a, b) { return b.price - a.price; });
  else if (val.value === 'distance')   sorted.sort(function (a, b) { return parseFloat(a.distance) - parseFloat(b.distance); });
  else if (val.value === 'safety')     sorted.sort(function (a, b) { return b.scores.safety - a.scores.safety; });
  else sorted.sort(function (a, b) { return b.score - a.score; });
  renderListings(sorted);
}

// ===== COMPARISON TABLE =====
function showComparison() {
  if (currentListings.length === 0) return;
  var top3    = currentListings.slice(0, 3);
  var overlay = document.getElementById('comparison-overlay');
  var table   = document.getElementById('comparison-table');
  if (!overlay || !table) return;
  overlay.style.display = 'flex';

  var scoreColors = { rent:'#10b981',distance:'#6366f1',transport:'#06b6d4',safety:'#f59e0b',amenities:'#8b5cf6',reviews:'#ec4899' };
  var icons       = { rent:'💰',distance:'📍',transport:'🚌',safety:'🛡️',amenities:'🏋️',reviews:'⭐' };

  var html = '<thead><tr><th style="text-align:left;width:130px">Metric</th>';
  top3.forEach(function (l) {
    html += '<th><div class="property-header">' + l.name.split(' ').slice(0,2).join(' ') + '</div>' +
            '<div style="font-size:.78rem;color:var(--text-muted)">' + l.area + ' · ' + l.type + '</div></th>';
  });
  html += '</tr></thead><tbody>';

  // Price row
  html += '<tr class="price-row"><td>Monthly Rent</td>';
  top3.forEach(function (l) { html += '<td>₹' + l.price.toLocaleString('en-IN') + '</td>'; });
  html += '</tr>';

  // Score row
  html += '<tr><td>AI Match Score</td>';
  top3.forEach(function (l, i) {
    html += '<td class="' + (i === 0 ? 'winner' : '') + '">' + l.score + '/100 ' + (i === 0 ? '🏆' : '') + '</td>';
  });
  html += '</tr>';

  // Metric rows
  Object.keys(scoreColors).forEach(function (key) {
    var vals = top3.map(function (l) { return l.scores[key]; });
    var max  = Math.max.apply(null, vals);
    html += '<tr><td>' + icons[key] + ' ' + cap(key) + '</td>';
    top3.forEach(function (l) {
      var isW = l.scores[key] === max;
      html += '<td class="' + (isW ? 'winner' : '') + '">' +
        '<div class="mini-bar">' +
        '<div class="mini-bar-track"><div class="mini-bar-fill" style="width:' + l.scores[key] + '%;background:' + scoreColors[key] + '"></div></div>' +
        ' ' + l.scores[key] + (isW ? ' ✓' : '') + '</div></td>';
    });
    html += '</tr>';
  });

  html += '</tbody>';
  table.innerHTML = html;
}

function closeComparison() {
  var el = document.getElementById('comparison-overlay');
  if (el) el.style.display = 'none';
}

// ===== PROPERTY MODAL =====
function openProperty(l) {
  var overlay = document.getElementById('property-overlay');
  var content = document.getElementById('property-content');
  if (!overlay || !content) return;
  overlay.style.display = 'flex';

  var scoreColors = { rent:'#10b981',distance:'#6366f1',transport:'#06b6d4',safety:'#f59e0b',amenities:'#8b5cf6',reviews:'#ec4899' };
  var icons       = { rent:'💰',distance:'📍',transport:'🚌',safety:'🛡️',amenities:'🏋️',reviews:'⭐' };

  var scoresHTML = '';
  Object.keys(scoreColors).forEach(function (key) {
    var val  = l.scores[key];
    var dash = Math.round(val * 0.97);
    scoresHTML +=
      '<div class="pscore-card">' +
        '<span class="pscore-icon">' + icons[key] + '</span>' +
        '<div class="pscore-ring">' +
          '<svg viewBox="0 0 64 64" width="64" height="64">' +
            '<circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="4"/>' +
            '<circle cx="32" cy="32" r="27" fill="none" stroke="' + scoreColors[key] + '" stroke-width="4"' +
              ' stroke-dasharray="' + dash + ' 170" stroke-dashoffset="42" stroke-linecap="round" transform="rotate(-90 32 32)"/>' +
          '</svg>' +
          '<span style="color:' + scoreColors[key] + '">' + val + '</span>' +
        '</div>' +
        '<span class="pscore-label">' + cap(key) + '</span>' +
      '</div>';
  });

  var amenitiesHTML = l.amenities.map(function (a) {
    return '<span class="amenity-item">✅ ' + a + '</span>';
  }).join('');

  var reviewsHTML = l.reviews.map(function (r) {
    return '<div class="review-card">' +
      '<div class="review-stars">' + '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars) + '</div>' +
      '<p class="review-text">"' + r.text + '"</p>' +
      '<div class="review-author">— ' + r.author + '</div>' +
    '</div>';
  }).join('');

  content.innerHTML =
    '<div class="property-header">' +
      '<div>' +
        '<h2 class="property-title">' + l.name + '</h2>' +
        '<div class="property-location">📍 ' + l.area + ', ' + l.city + ' · ' + l.type + '</div>' +
      '</div>' +
      '<div>' +
        '<div class="property-price">₹' + l.price.toLocaleString('en-IN') + '<span>/month</span></div>' +
        '<div style="text-align:right;margin-top:.3rem;color:#6366f1;font-weight:700;font-size:.9rem">AI Score: ' + l.score + '/100 🏆</div>' +
      '</div>' +
    '</div>' +
    // HERE Map container replace placeholder
    '<div id="here-map-container" style="width:100%;height:320px;border-radius:var(--radius-lg);margin-bottom:2rem;background:#0d1117;border:1px solid var(--border-subtle)"></div>' +
    '<h4 style="margin-bottom:1.25rem">Score Breakdown</h4>' +
    '<div class="property-scores">' + scoresHTML + '</div>' +
    '<div class="property-amenities"><h4>Amenities Included</h4><div class="amenity-grid">' + amenitiesHTML + '</div></div>' +
    '<div class="property-reviews"><h4>Tenant Reviews</h4>' + reviewsHTML + '</div>' +
    '<div class="property-actions">' +
      '<button class="btn-primary" style="background:linear-gradient(135deg,#10b981,#059669)" onclick="openInquiryModal(' + l.id + ', \'' + (l.name.replace(/'/g, "\\'")) + '\', \'' + (l.ownerEmail || 'admin@rentright.com') + '\')">🙋 Express Interest to Rent</button>' +
      '<button class="btn-primary" onclick="alert(\'Scheduling a visit!\')">📅 Schedule Visit</button>' +
      '<button class="btn-outline" onclick="alert(\'Saved to your favorites!\')">💾 Save Flat</button>' +
    '</div>';

  // Initialize dynamic HERE Maps API
  setTimeout(function() {
    renderHEREMap(l);
  }, 100);
}

function renderHEREMap(listing) {
  var container = document.getElementById('here-map-container');
  if (!container || typeof H === 'undefined') return;
  if (!HERE_API_KEY) {
    container.innerHTML = '<p style="padding:1.5rem;color:#cbd5e1">Map unavailable: add HERE_API_KEY to .env and restart the server.</p>';
    return;
  }

  // Clear existing map layers if active
  container.innerHTML = "";

  // Initialize Platform
  var platform = new H.service.Platform({
    apikey: HERE_API_KEY
  });

  // Default Layers
  var defaultLayers = platform.createDefaultLayers();

  // Draw Map
  var map = new H.Map(
    container,
    defaultLayers.vector.normal.map,
    {
      zoom: 15,
      center: { lat: listing.lat || 12.9716, lng: listing.lng || 77.5946 }
    }
  );

  // Enable interactions and scale metrics
  var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

  // Add marker
  var marker = new H.map.Marker({ lat: listing.lat, lng: listing.lng });
  map.addObject(marker);
  
  // Track instance to clean up memory
  activeMapInstance = map;
}

function closeProperty() {
  var el = document.getElementById('property-overlay');
  if (el) el.style.display = 'none';
  // Destroy map reference
  if (activeMapInstance) {
    activeMapInstance.dispose();
    activeMapInstance = null;
  }
}

// Close modals on background click
var compOverlay = document.getElementById('comparison-overlay');
if (compOverlay) {
  compOverlay.addEventListener('click', function (e) { if (e.target === compOverlay) closeComparison(); });
}
var propOverlay = document.getElementById('property-overlay');
if (propOverlay) {
  propOverlay.addEventListener('click', function (e) { if (e.target === propOverlay) closeProperty(); });
}

// ===== SCROLL FADE =====
var fadeEls = document.querySelectorAll('.step-card, .tech-card, .testimonial-card');
if (window.IntersectionObserver) {
  var fadeObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  fadeEls.forEach(function (el) { el.classList.add('fade-up'); fadeObs.observe(el); });
}

// ===== AUTHENTICATION & USER MANAGEMENT =====
var authState = {
  user: null,
  token: localStorage.getItem('rentright_token') || '',
  mode: 'login', // 'login' or 'register'
  role: 'user'   // 'user' or 'admin'
};

function openAuthModal(mode, role) {
  if (mode) authState.mode = mode;
  if (role) authState.role = role;
  
  var overlay = document.getElementById('auth-overlay');
  if (!overlay) return;
  
  updateAuthModalUI();
  overlay.style.display = 'flex';
}

function closeAuthModal() {
  var overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.style.display = 'none';
  hideAuthAlert();
}

function setAuthRole(role) {
  authState.role = role;
  var userBtn = document.getElementById('auth-role-user');
  var adminBtn = document.getElementById('auth-role-admin');
  
  if (role === 'admin') {
    if (adminBtn) adminBtn.classList.add('active');
    if (userBtn) userBtn.classList.remove('active');
  } else {
    if (userBtn) userBtn.classList.add('active');
    if (adminBtn) adminBtn.classList.remove('active');
  }
}

function toggleAuthMode(event) {
  if (event) event.preventDefault();
  authState.mode = (authState.mode === 'login') ? 'register' : 'login';
  updateAuthModalUI();
}

function updateAuthModalUI() {
  hideAuthAlert();
  var title = document.getElementById('auth-modal-title');
  var sub = document.getElementById('auth-modal-sub');
  var nameGroup = document.getElementById('auth-name-group');
  var submitBtn = document.getElementById('auth-submit-btn');
  var toggleText = document.getElementById('auth-toggle-text');
  var toggleLink = document.getElementById('auth-toggle-link');

  setAuthRole(authState.role);

  if (authState.mode === 'register') {
    authState.role = 'user';
    setAuthRole('user');
    if (title) title.textContent = 'Create RentRight Account';
    if (sub) sub.textContent = 'Join 4,200+ renters getting AI recommendations';
    if (nameGroup) nameGroup.style.display = 'block';
    if (submitBtn) submitBtn.textContent = 'Create Account';
    if (toggleText) toggleText.textContent = 'Already have an account?';
    if (toggleLink) toggleLink.textContent = 'Sign In';
  } else {
    if (title) title.textContent = 'Sign In to RentRight';
    if (sub) sub.textContent = 'Access recommendations & administrator portal';
    if (nameGroup) nameGroup.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Sign In';
    if (toggleText) toggleText.textContent = "Don't have an account?";
    if (toggleLink) toggleLink.textContent = 'Register Now';
  }
}

function fillDemoCredentials(role) {
  setAuthRole(role);
  authState.mode = 'login';
  updateAuthModalUI();
  
  var emailInput = document.getElementById('auth-email');
  var passInput = document.getElementById('auth-password');
  
  if (role === 'admin') {
    if (emailInput) emailInput.value = 'admin@rentright.com';
    if (passInput) passInput.value = 'admin123';
  } else {
    if (emailInput) emailInput.value = 'user@rentright.com';
    if (passInput) passInput.value = 'user123';
  }
}

function showAuthAlert(msg, isSuccess) {
  var alertEl = document.getElementById('auth-alert');
  if (!alertEl) return;
  alertEl.textContent = msg;
  alertEl.style.display = 'block';
  if (isSuccess) {
    alertEl.style.background = 'rgba(16,185,129,0.15)';
    alertEl.style.borderColor = 'rgba(16,185,129,0.3)';
    alertEl.style.color = '#6ee7b7';
  } else {
    alertEl.style.background = 'rgba(239,68,68,0.15)';
    alertEl.style.borderColor = 'rgba(239,68,68,0.3)';
    alertEl.style.color = '#fca5a5';
  }
}

function hideAuthAlert() {
  var alertEl = document.getElementById('auth-alert');
  if (alertEl) alertEl.style.display = 'none';
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  hideAuthAlert();
  
  var email = document.getElementById('auth-email').value;
  var password = document.getElementById('auth-password').value;
  var name = document.getElementById('auth-name').value;
  var endpoint = (authState.mode === 'register') ? '/api/auth/register' : '/api/auth/login';
  
  var payload = { email: email, password: password };
  if (authState.mode === 'login') payload.role = authState.role;
  if (authState.mode === 'register') {
    payload.name = name || 'New User';
  }

  try {
    var response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await response.json();
    
    if (data.success && data.user) {
      authState.user = data.user;
      authState.token = data.token;
      localStorage.setItem('rentright_token', data.token);
      
      updateNavbarAuthUI();
      closeAuthModal();
      
      // Auto-navigate to correct view
      if (data.user.role === 'admin') {
        setViewMode('admin');
      } else {
        setViewMode('client');
      }
    } else {
      showAuthAlert(data.error || 'Authentication failed');
    }
  } catch (err) {
    showAuthAlert('Unable to reach auth server. Make sure server is running.');
  }
}

async function checkAuthSession() {
  if (!authState.token) {
    if (window.location.pathname.indexOf('login.html') === -1) {
      window.location.href = 'login.html';
    }
    return;
  }

  try {
    var response = await fetch(getApiUrl('/api/auth/me'), {
      headers: { 'Authorization': 'Bearer ' + authState.token }
    });
    var data = await response.json();
    if (data.user) {
      authState.user = data.user;
    } else {
      var cachedUser = localStorage.getItem('rentright_user');
      if (cachedUser) {
        authState.user = JSON.parse(cachedUser);
      } else {
        authState.token = '';
        localStorage.removeItem('rentright_token');
        if (window.location.pathname.indexOf('login.html') === -1) {
          window.location.href = 'login.html';
        }
      }
    }
  } catch (e) {
    var cachedUser = localStorage.getItem('rentright_user');
    if (cachedUser) {
      try { authState.user = JSON.parse(cachedUser); } catch(err) {}
    } else if (window.location.pathname.indexOf('login.html') === -1) {
      window.location.href = 'login.html';
    }
  }
  updateNavbarAuthUI();
}

async function handleLogout() {
  if (authState.token) {
    try {
      await fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + authState.token }
      });
    } catch(e) {}
  }
  authState.user = null;
  authState.token = '';
  localStorage.removeItem('rentright_token');
  localStorage.removeItem('rentright_user');
  window.location.href = 'login.html';
}

// ===== STANDALONE LOGIN PAGE SCREEN CONTROLLERS =====
var pageAuthState = {
  mode: 'login', // 'login' or 'register'
  role: 'user'   // 'user' or 'admin'
};

function setPageAuthRole(role) {
  pageAuthState.role = role;
  var userTab = document.getElementById('page-role-user');
  var adminTab = document.getElementById('page-role-admin');
  
  if (role === 'admin') {
    if (adminTab) adminTab.classList.add('active');
    if (userTab) userTab.classList.remove('active');
  } else {
    if (userTab) userTab.classList.add('active');
    if (adminTab) adminTab.classList.remove('active');
  }
}

function togglePageAuthMode(event) {
  if (event) event.preventDefault();
  pageAuthState.mode = (pageAuthState.mode === 'login') ? 'register' : 'login';
  updatePageAuthUI();
}

function updatePageAuthUI() {
  hidePageAuthAlert();
  var nameGroup = document.getElementById('page-auth-name-group');
  var submitBtn = document.getElementById('page-auth-submit-btn');
  var toggleText = document.getElementById('page-auth-toggle-text');
  var toggleLink = document.getElementById('page-auth-toggle-link');

  setPageAuthRole(pageAuthState.role);

  if (pageAuthState.mode === 'register') {
    if (nameGroup) nameGroup.style.display = 'block';
    if (submitBtn) submitBtn.textContent = 'Create Account & Continue';
    if (toggleText) toggleText.textContent = 'Already have an account?';
    if (toggleLink) toggleLink.textContent = 'Sign In';
  } else {
    if (nameGroup) nameGroup.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Sign In & Continue';
    if (toggleText) toggleText.textContent = "Don't have an account?";
    if (toggleLink) toggleLink.textContent = 'Register Now';
  }
}

function fillPageDemoCredentials(role) {
  setPageAuthRole(role);
  pageAuthState.mode = 'login';
  updatePageAuthUI();
  
  var emailInput = document.getElementById('page-auth-email');
  var passInput = document.getElementById('page-auth-password');
  
  if (role === 'admin') {
    if (emailInput) emailInput.value = 'admin@rentright.com';
    if (passInput) passInput.value = 'admin123';
  } else {
    if (emailInput) emailInput.value = 'user@rentright.com';
    if (passInput) passInput.value = 'user123';
  }
}

function showPageAuthAlert(msg, isSuccess) {
  var alertEl = document.getElementById('page-auth-alert');
  if (!alertEl) return;
  alertEl.textContent = msg;
  alertEl.style.display = 'block';
  if (isSuccess) {
    alertEl.style.background = 'rgba(16,185,129,0.15)';
    alertEl.style.borderColor = 'rgba(16,185,129,0.3)';
    alertEl.style.color = '#6ee7b7';
  } else {
    alertEl.style.background = 'rgba(239,68,68,0.15)';
    alertEl.style.borderColor = 'rgba(239,68,68,0.3)';
    alertEl.style.color = '#fca5a5';
  }
}

function hidePageAuthAlert() {
  var alertEl = document.getElementById('page-auth-alert');
  if (alertEl) alertEl.style.display = 'none';
}

async function handlePageAuthSubmit(event) {
  event.preventDefault();
  hidePageAuthAlert();
  
  var email = document.getElementById('page-auth-email').value;
  var password = document.getElementById('page-auth-password').value;
  var name = document.getElementById('page-auth-name').value;
  var endpoint = (pageAuthState.mode === 'register') ? '/api/auth/register' : '/api/auth/login';
  
  var payload = { email: email, password: password };
  if (pageAuthState.mode === 'login') payload.role = pageAuthState.role;
  if (pageAuthState.mode === 'register') {
    payload.name = name || 'New User';
  }

  try {
    var response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await response.json();
    
    if (data.success && data.user) {
      authState.user = data.user;
      authState.token = data.token;
      localStorage.setItem('rentright_token', data.token);
      
      updateNavbarAuthUI();
      
      // Auto-navigate user to their appropriate workspace
      if (data.user.role === 'admin') {
        setViewMode('admin');
      } else {
        setViewMode('client');
      }
    } else {
      showPageAuthAlert(data.error || 'Authentication failed');
    }
  } catch (err) {
    showPageAuthAlert('Unable to reach auth server. Make sure server is running.');
  }
}

function updateNavbarAuthUI() {
  var loginScreen = document.getElementById('login-page-screen');
  var navbar = document.getElementById('navbar');
  var loggedOutBox = document.getElementById('auth-nav-logged-out');
  var loggedInBox = document.getElementById('auth-nav-logged-in');
  var displayName = document.getElementById('user-display-name');
  
  var clientLinks = document.querySelectorAll('.nav-link-client');
  var adminLink = document.querySelector('.nav-link-admin-toggle');

  if (authState.user) {
    if (loginScreen) loginScreen.style.display = 'none';
    if (navbar) navbar.style.display = 'block';

    if (loggedOutBox) loggedOutBox.style.display = 'none';
    if (loggedInBox) loggedInBox.style.display = 'inline-flex';
    
    if (authState.user.role === 'admin') {
      if (displayName) displayName.textContent = authState.user.name + ' (Flat Seller)';
      // Admin only sees Seller Console
      clientLinks.forEach(function(l) { l.style.display = 'none'; });
      if (adminLink) adminLink.style.display = 'inline-block';
      setViewMode('admin');
    } else {
      if (displayName) displayName.textContent = authState.user.name + ' (Customer)';
      // Customer only sees Renter Finder
      clientLinks.forEach(function(l) { l.style.display = 'inline-block'; });
      if (adminLink) adminLink.style.display = 'none';
      setViewMode('client');
    }
  } else {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (navbar) navbar.style.display = 'none';

    if (loggedOutBox) loggedOutBox.style.display = 'inline-flex';
    if (loggedInBox) loggedInBox.style.display = 'none';
  }
}

// Check session on load
checkAuthSession();

// ===== DUAL INTERFACE LOGIC (ADMIN / CUSTOMER CLIENT) =====
var currentViewMode = 'client';

function setViewMode(mode) {
  // Enforce role boundaries
  if (authState.user && authState.user.role === 'admin') {
    mode = 'admin'; // Admin is strictly restricted to Flat Seller Console
  } else if (authState.user && authState.user.role === 'user') {
    mode = 'client'; // Customer is strictly restricted to Renter AI Finder
  }

  currentViewMode = mode;
  var heroSec = document.getElementById('hero');
  var clientSecs = [
    document.getElementById('how-it-works'),
    document.getElementById('search-section'),
    document.getElementById('results-section')
  ];
  var adminPortal = document.getElementById('admin-portal');

  var clientLinks = document.querySelectorAll('.nav-link-client');
  var adminLink = document.querySelector('.nav-link-admin-toggle');
  var ctaClientBtn = document.querySelector('.nav-cta-client');
  var ctaAdminBtn = document.querySelector('.nav-cta-admin');

  if (mode === 'admin') {
    // Hide customer components
    if (heroSec) heroSec.style.display = 'none';
    clientSecs.forEach(function (s) { if (s) s.style.display = 'none'; });

    // Show admin seller portal
    if (adminPortal) adminPortal.style.display = 'block';

    if (adminLink) adminLink.classList.add('active');
    clientLinks.forEach(function (l) { l.classList.remove('active'); });
    if (ctaClientBtn) ctaClientBtn.style.display = 'none';
    if (ctaAdminBtn) ctaAdminBtn.style.display = 'inline-flex';

    loadAdminListings();
  } else {
    // Show customer components
    if (heroSec) heroSec.style.display = 'flex';
    if (document.getElementById('how-it-works')) document.getElementById('how-it-works').style.display = 'block';
    if (document.getElementById('search-section')) document.getElementById('search-section').style.display = 'block';
    
    // Hide admin portal
    if (adminPortal) adminPortal.style.display = 'none';

    if (adminLink) adminLink.classList.remove('active');
    if (ctaClientBtn) ctaClientBtn.style.display = 'inline-flex';
    if (ctaAdminBtn) ctaAdminBtn.style.display = 'none';
  }
}

// Select/toggle chips on Admin Add form
var adminAmenityChips = document.getElementById('admin-amenities');
if (adminAmenityChips) {
  adminAmenityChips.addEventListener('click', function(e) {
    var chip = e.target.closest('.chip');
    if (chip) chip.classList.toggle('active');
  });
}

function getAdminSelectedAmenities() {
  var selected = [];
  var activeChips = document.querySelectorAll('#admin-amenities .chip.active');
  activeChips.forEach(function (c) {
    selected.push(c.getAttribute('data-amenity'));
  });
  return selected;
}

async function handleAddNewProperty(event) {
  event.preventDefault();
  
  var name = document.getElementById('admin-name').value;
  var city = document.getElementById('admin-city').value;
  var area = document.getElementById('admin-area').value;
  var price = Number(document.getElementById('admin-price').value);
  var type = document.getElementById('admin-type').value;
  var commute = document.getElementById('admin-commute').value + " min";
  var distance = document.getElementById('admin-distance').value + " km";
  var safety = Number(document.getElementById('admin-safety').value);
  var lat = Number(document.getElementById('admin-lat').value);
  var lng = Number(document.getElementById('admin-lng').value);
  var amenities = getAdminSelectedAmenities();

  var currentEmail = authState.user ? authState.user.email : 'admin@rentright.com';
  var listingPayload = {
    name: name,
    city: city,
    area: area,
    price: price,
    type: type,
    commute: commute,
    distance: distance,
    ownerEmail: currentEmail,
    scores: {
      rent: Math.round(Math.max(10, 100 - (price/800))),
      distance: Math.round(Math.max(20, 100 - (parseFloat(distance)*8))),
      transport: 85,
      safety: safety,
      amenities: Math.round(amenities.length * 10),
      reviews: 80
    },
    score: Math.round((safety + 80 + 75) / 3),
    tags: ["🛋️ " + type, "📍 " + area],
    amenities: amenities,
    icon: "🏢",
    color: "#6366f1",
    lat: lat,
    lng: lng,
    reviews: [
      { stars: 4, text: "Newly published property by flat owner.", author: currentEmail }
    ]
  };

  try {
    var response = await fetch(getApiUrl('/api/listings'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (authState.token || '')
      },
      body: JSON.stringify(listingPayload)
    });
    var data = await response.json();
    if (data.success) {
      alert("Property published successfully!");
      document.getElementById('add-property-form').reset();
      document.querySelectorAll('#admin-amenities .chip.active').forEach(function(c) {
        c.classList.remove('active');
      });
      fetchAndUpdateLocalListings();
    } else {
      alert("Error adding listing: " + data.error);
    }
  } catch (err) {
    // Offline fallback: save locally
    if (listingPayload) {
      if (!ALL_LISTINGS[city]) ALL_LISTINGS[city] = [];
      ALL_LISTINGS[city].push(listingPayload);
      alert("Property published locally!");
      loadAdminListings();
      document.getElementById('add-property-form').reset();
      loadAdminListings();
    }
  }
}

async function fetchAndUpdateLocalListings() {
  try {
    var response = await fetch(getApiUrl('/api/listings'));
    var data = await response.json();
    if (data.listings) {
      ALL_LISTINGS = data.listings;
      loadAdminListings();
    }
  } catch(e) {
    console.error("Failed updating list from server.", e);
  }
}

function loadAdminListings() {
  var tbody = document.getElementById('admin-listings-table-body');
  var totalCount = document.getElementById('admin-total-count');
  
  if (typeof loadAdminInquiries === 'function') {
    loadAdminInquiries();
  }

  if (!tbody) return;

  var currentAdminEmail = authState.user ? authState.user.email : 'admin@rentright.com';

  var allItems = [];
  Object.keys(ALL_LISTINGS).forEach(function (city) {
    ALL_LISTINGS[city].forEach(function (item) {
      allItems.push(item);
    });
  });

  // Filter ONLY properties owned/posted by this specific logged in Administrator
  var myItems = allItems.filter(function(item) {
    if (!item.ownerEmail) return currentAdminEmail === 'admin@rentright.com';
    return item.ownerEmail === currentAdminEmail;
  });

  if (totalCount) totalCount.textContent = myItems.length;
  tbody.innerHTML = '';

  if (myItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-muted); font-size:0.95rem;">' +
      '🏢 You haven\'t published any flat or property listings yet.<br><span style="font-size:0.82rem;">Fill in the form above to post your first flat for rent!</span>' +
      '</td></tr>';
    return;
  }

  myItems.forEach(function (item) {
    var tr = document.createElement('tr');
    tr.innerHTML = 
      '<td>' +
        '<div style="font-weight:600;">' + item.name + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted);">' + item.area + '</div>' +
      '</td>' +
      '<td>' + cap(item.city) + '</td>' +
      '<td>' + item.type + '</td>' +
      '<td>₹' + item.price.toLocaleString('en-IN') + '</td>' +
      '<td>' + item.commute + ' (' + item.distance + ')</td>' +
      '<td>' + item.scores.safety + '/100</td>' +
      '<td>' +
        '<button class="btn-outline" style="color:var(--accent-red);border-color:rgba(239,68,68,0.3);padding:0.35rem 0.75rem;" onclick="handleDeleteListing(' + item.id + ')">Delete</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

async function handleDeleteListing(id) {
  if (!confirm("Are you sure you want to delete this listing?")) return;
  try {
    var response = await fetch(getApiUrl('/api/listings/') + id, {
      method: 'DELETE'
    });
    var data = await response.json();
    if (data.success) {
      alert("Listing deleted successfully!");
      fetchAndUpdateLocalListings();
    } else {
      alert("Error: " + data.error);
    }
  } catch (e) {
    alert("Connection error.");
  }
}

// ===== TENANT INQUIRIES & INTEREST MANAGERS =====
function openInquiryModal(listingId, flatName, ownerEmail) {
  var overlay = document.getElementById('inquiry-overlay');
  if (!overlay) return;

  document.getElementById('inquiry-listing-id').value = listingId || '';
  document.getElementById('inquiry-owner-email').value = ownerEmail || 'admin@rentright.com';
  document.getElementById('inquiry-flat-name').textContent = flatName || 'Property';

  // Autofill user details if logged in
  if (authState.user) {
    document.getElementById('inquiry-user-name').value = authState.user.name || '';
    document.getElementById('inquiry-user-email').value = authState.user.email || '';
  }

  hideInquiryAlert();
  overlay.style.display = 'flex';
}

function closeInquiryModal() {
  var overlay = document.getElementById('inquiry-overlay');
  if (overlay) overlay.style.display = 'none';
}

function showInquiryAlert(msg, isSuccess) {
  var alertEl = document.getElementById('inquiry-alert');
  if (!alertEl) return;
  alertEl.textContent = msg;
  alertEl.style.display = 'block';
  if (isSuccess) {
    alertEl.style.background = 'rgba(16,185,129,0.15)';
    alertEl.style.borderColor = 'rgba(16,185,129,0.3)';
    alertEl.style.color = '#6ee7b7';
  } else {
    alertEl.style.background = 'rgba(239,68,68,0.15)';
    alertEl.style.borderColor = 'rgba(239,68,68,0.3)';
    alertEl.style.color = '#fca5a5';
  }
}

function hideInquiryAlert() {
  var alertEl = document.getElementById('inquiry-alert');
  if (alertEl) alertEl.style.display = 'none';
}

async function handleInquirySubmit(event) {
  event.preventDefault();
  hideInquiryAlert();

  var payload = {
    listingId: document.getElementById('inquiry-listing-id').value,
    listingName: document.getElementById('inquiry-flat-name').textContent,
    ownerEmail: document.getElementById('inquiry-owner-email').value,
    userName: document.getElementById('inquiry-user-name').value,
    phone: document.getElementById('inquiry-phone').value,
    userEmail: document.getElementById('inquiry-user-email').value,
    moveInDate: document.getElementById('inquiry-move-date').value,
    message: document.getElementById('inquiry-message').value
  };

  try {
    var response = await fetch(getApiUrl('/api/inquiries'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await response.json();
    if (data.success) {
      showInquiryAlert('Success! Your interest has been sent to the property owner.', true);
      setTimeout(function() {
        closeInquiryModal();
        alert('Your contact details have been sent to the landlord. They will reach out to you shortly!');
      }, 1000);
    } else {
      showInquiryAlert(data.error || 'Failed to submit interest.');
    }
  } catch (err) {
    showInquiryAlert('Success! Interest recorded locally.');
    setTimeout(function() { closeInquiryModal(); }, 1000);
  }
}

async function loadAdminInquiries() {
  var tbody = document.getElementById('admin-inquiries-table-body');
  var countEl = document.getElementById('admin-inquiries-count');
  if (!tbody) return;

  var currentAdminEmail = authState.user ? authState.user.email : 'admin@rentright.com';

  try {
    var response = await fetch(getApiUrl('/api/inquiries?ownerEmail=') + encodeURIComponent(currentAdminEmail), {
      headers: { 'Authorization': 'Bearer ' + (authState.token || '') }
    });
    var data = await response.json();
    var inquiries = data.inquiries || [];

    if (countEl) countEl.textContent = inquiries.length;
    tbody.innerHTML = '';

    if (inquiries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-muted); font-size:0.95rem;">' +
        '📩 No tenant inquiries received yet for your properties.' +
        '</td></tr>';
      return;
    }

    inquiries.forEach(function(inq) {
      var dateStr = inq.createdAt ? new Date(inq.createdAt).toLocaleDateString('en-IN') : 'Recently';
      var tr = document.createElement('tr');
      tr.innerHTML = 
        '<td>' +
          '<div style="font-weight:600; color:var(--accent-primary);">' + (inq.listingName || 'Property') + '</div>' +
        '</td>' +
        '<td><strong>' + (inq.userName || 'Renter') + '</strong></td>' +
        '<td>' +
          '<div>📞 <a href="tel:' + inq.phone + '" style="color:var(--text-primary);font-weight:600;">' + inq.phone + '</a></div>' +
          '<div style="font-size:0.75rem;color:var(--text-muted);">✉️ ' + inq.userEmail + '</div>' +
        '</td>' +
        '<td>' + (inq.moveInDate || 'Flexible') + '</td>' +
        '<td><div style="max-width:260px; font-size:0.85rem; color:var(--text-secondary);">' + (inq.message || 'Interested in renting') + '</div></td>' +
        '<td>' + dateStr + '</td>' +
        '<td>' +
          '<button class="btn-outline" style="color:var(--accent-red);border-color:rgba(239,68,68,0.3);padding:0.35rem 0.75rem;" onclick="handleDeleteInquiry(\'' + inq.id + '\')">Remove</button>' +
        '</td>';
      tbody.appendChild(tr);
    });
  } catch(err) {
    console.warn("Could not load inquiries:", err);
  }
}

async function handleDeleteInquiry(id) {
  if (!confirm("Are you sure you want to remove this lead?")) return;
  try {
    await fetch(getApiUrl('/api/inquiries/') + id, { method: 'DELETE' });
    loadAdminInquiries();
  } catch(e) {}
}

// Initial fetch from server
fetchAndUpdateLocalListings();

// Also load inquiries in Admin Seller Portal
if (typeof loadAdminInquiries === 'function') {
  loadAdminInquiries();
}

// Expose globals for inline onclick handlers
window.startAISearch   = startAISearch;
window.showComparison  = showComparison;
window.closeComparison = closeComparison;
window.openProperty    = openProperty;
window.closeProperty   = closeProperty;
window.sortResults     = sortResults;
window.setViewMode     = setViewMode;
window.handleAddNewProperty = handleAddNewProperty;
window.handleDeleteListing = handleDeleteListing;
window.openAuthModal   = openAuthModal;
window.closeAuthModal  = closeAuthModal;
window.setAuthRole     = setAuthRole;
window.toggleAuthMode  = toggleAuthMode;
window.fillDemoCredentials = fillDemoCredentials;
window.handleAuthSubmit = handleAuthSubmit;
window.handleLogout    = handleLogout;
window.setPageAuthRole = setPageAuthRole;
window.togglePageAuthMode = togglePageAuthMode;
window.fillPageDemoCredentials = fillPageDemoCredentials;
window.handlePageAuthSubmit = handlePageAuthSubmit;
window.openInquiryModal = openInquiryModal;
window.closeInquiryModal = closeInquiryModal;
window.handleInquirySubmit = handleInquirySubmit;
window.loadAdminInquiries = loadAdminInquiries;
window.handleDeleteInquiry = handleDeleteInquiry;
window.ALL_LISTINGS    = ALL_LISTINGS;
window.currentListings = currentListings;
