var getApiUrl = function(path) {
  if (window.location.protocol === 'file:') return 'http://localhost:3000' + path;
  return path;
};

function cap(str) {
  if (!str) return '';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

// =============================================
//  RENTRIGHT — Clean App Logic
// =============================================

// ===== HERE MAPS CONFIG =====
var HERE_API_KEY = (window.RENTRIGHT_CONFIG && window.RENTRIGHT_CONFIG.hereApiKey) || "";
var activeMapInstance = null;

// ===== MULTI-CITY LISTINGS DATA =====
var ALL_LISTINGS = {
  "bengaluru": [],
  "mumbai": [],
  "hyderabad": [
    {
      id: 1003,
      name: "xyz hotel",
      area: "Kukatpally",
      city: "hyderabad",
      price: 22000,
      type: "2BHK",
      commute: "10 min",
      distance: "2.0 km",
      ownerEmail: "edukullaadithya08@gmail.com",
      ownerId: "usr_admin",
      scores: { rent: 90, distance: 92, transport: 85, safety: 88, amenities: 85, reviews: 88 },
      score: 91,
      tags: ["🛋️ 2BHK", "📍 Kukatpally", "⭐ Prime Location"],
      amenities: ["wifi", "lift", "parking", "powerbackup"],
      icon: "🏢",
      color: "#10b981",
      lat: 17.4875,
      lng: 78.3953,
      reviews: []
    }
  ],
  "pune": [],
  "chennai": [],
  "delhi": []
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
    if (response.ok) {
      var data = await response.json();
      if (data.listings && Array.isArray(data.listings) && data.listings.length > 0) {
        return data.listings;
      }
    }
  } catch (err) {
    console.warn("API recommendations fallback to local computation:", err);
  }
  return getLocalRecommendations(preferences);
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
  return aliases[normalisePreference(value)] || normalisePreference(value);
}

function matchesLocationPreference(listing, searchLocation) {
  if (!searchLocation || !String(searchLocation).trim()) return true;
  
  var query = String(searchLocation).trim().toLowerCase();
  var queryNorm = normalisePreference(query);
  if (!queryNorm) return true;

  var area = String(listing.area || '').toLowerCase();
  var areaNorm = normalisePreference(area);
  var city = String(listing.city || '').toLowerCase();
  var cityNorm = normalisePreference(city);
  var name = String(listing.name || '').toLowerCase();
  var nameNorm = normalisePreference(name);

  // 1. Direct substring matching
  if (area.indexOf(query) !== -1 || query.indexOf(area) !== -1 ||
      (areaNorm && (areaNorm.indexOf(queryNorm) !== -1 || queryNorm.indexOf(areaNorm) !== -1))) {
    return true;
  }
  if (city.indexOf(query) !== -1 || query.indexOf(city) !== -1 ||
      (cityNorm && (cityNorm.indexOf(queryNorm) !== -1 || queryNorm.indexOf(cityNorm) !== -1))) {
    return true;
  }
  if (name.indexOf(query) !== -1 || query.indexOf(name) !== -1 ||
      (nameNorm && (nameNorm.indexOf(queryNorm) !== -1 || queryNorm.indexOf(nameNorm) !== -1))) {
    return true;
  }

  // 2. Tokenized word-by-word matching
  var tokens = query.split(/[\s,.-]+/).filter(function(t) { return t.length > 2; }).map(normalisePreference);
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (areaNorm && (areaNorm.indexOf(token) !== -1 || token.indexOf(areaNorm) !== -1)) return true;
    if (cityNorm && (cityNorm.indexOf(token) !== -1 || token.indexOf(cityNorm) !== -1)) return true;
    if (nameNorm && (nameNorm.indexOf(token) !== -1 || token.indexOf(nameNorm) !== -1)) return true;
  }

  // 3. Phonetic and locality aliases
  var aliases = [
    ['kukatpally', 'kukattepally', 'kukatpalli'],
    ['madhapur', 'madhapur'],
    ['gachibowli', 'gachibowli'],
    ['hitec', 'hitech', 'hiteccity', 'cybercity'],
    ['koramangala', 'kora'],
    ['indiranagar', 'indiranagar'],
    ['whitefield', 'whitefield'],
    ['bellandur', 'bellandur'],
    ['hsr', 'hsrlayout'],
    ['ecity', 'electroniccity'],
    ['bandra', 'bandrawest', 'bandraeast'],
    ['powai', 'powai'],
    ['andheri', 'andheriwest', 'andherieast'],
    ['hinjewadi', 'hinjawadi'],
    ['koregaon', 'koregaonpark'],
    ['baner', 'baner'],
    ['omr', 'thoraipakkam'],
    ['adyar', 'adyar'],
    ['gurgaon', 'gurugram', 'cybercity']
  ];

  for (var j = 0; j < aliases.length; j++) {
    var group = aliases[j];
    var queryMatchesGroup = group.some(function(alias) { return queryNorm.indexOf(alias) !== -1 || alias.indexOf(queryNorm) !== -1; });
    if (queryMatchesGroup) {
      var listingMatchesGroup = group.some(function(alias) { return areaNorm.indexOf(alias) !== -1 || nameNorm.indexOf(alias) !== -1; });
      if (listingMatchesGroup) return true;
    }
  }

  return false;
}

function matchesWorkplacePreference(listing, workplace) {
  return matchesLocationPreference(listing, workplace);
}

function getLocalRecommendations(preferences) {
  // 1. Ensure custom listings from storage are in ALL_LISTINGS
  mergeCustomListingsIntoAll();

  var city = normaliseCityPreference(preferences.city || 'bengaluru');
  var workplace = String(preferences.workplace || preferences.location || '').trim();
  var workplaceNorm = normalisePreference(workplace);
  var budget = Number(preferences.budget) || 0;
  var propertyType = normalisePreference(preferences.propertyType);
  var maxCommute = Number(preferences.maxCommute) > 0 ? Number(preferences.maxCommute) : Infinity;
  var requestedAmenities = Array.isArray(preferences.amenities)
    ? preferences.amenities.map(normaliseAmenityPreference).filter(Boolean)
    : [];

  // Gather candidate properties from selected city
  var pool = (ALL_LISTINGS[city] || []).slice();

  // If user searched a location keyword, also search across ALL cities
  if (workplaceNorm) {
    Object.keys(ALL_LISTINGS).forEach(function(cKey) {
      if (cKey !== city) {
        (ALL_LISTINGS[cKey] || []).forEach(function(item) {
          if (matchesLocationPreference(item, workplace)) {
            if (!pool.some(function(p) { return String(p.id) === String(item.id); })) {
              pool.push(item);
            }
          }
        });
      }
    });
  }

  // Fallback to all cities if pool is empty
  if (pool.length === 0) {
    Object.keys(ALL_LISTINGS).forEach(function(cKey) {
      (ALL_LISTINGS[cKey] || []).forEach(function(item) {
        if (!pool.some(function(p) { return String(p.id) === String(item.id); })) {
          pool.push(item);
        }
      });
    });
  }

  if (!pool.length) return [];

  // Score and filter each candidate
  var scoredCandidates = pool.map(function(listing) {
    var availAmenities = (listing.amenities || []).map(normalisePreference);
    var commuteMinutes = Number.parseInt(listing.commute, 10) || 10;
    
    // Check match criteria
    var matchesLocation = matchesLocationPreference(listing, workplace);
    var matchesType = (!propertyType || normalisePreference(listing.type) === propertyType);
    
    // Soft scoring for amenities
    var matchedAmenitiesCount = requestedAmenities.filter(function (amenity) {
      return availAmenities.indexOf(amenity) !== -1;
    }).length;
    var amenityBonus = requestedAmenities.length ? (matchedAmenitiesCount / requestedAmenities.length) * 15 : 5;

    // Location bonus: if property is in the area/workplace searched, strong bonus!
    var locationBonus = (workplaceNorm && matchesLocation) ? 35 : 0;

    // Budget match score
    var budgetScore = budget ? Math.max(-15, 10 - Math.abs((listing.price || 0) - budget) / budget * 15) : 5;

    // Commute match score
    var commuteScore = Math.max(-10, 8 - Math.max(0, commuteMinutes - maxCommute) * 0.5);

    // Property type match score
    var typeScore = matchesType ? 10 : -10;

    var baseScore = listing.score || 85;
    var finalScore = Math.round(Math.max(10, Math.min(99, baseScore * 0.5 + locationBonus + amenityBonus + budgetScore + commuteScore + typeScore)));

    return Object.assign({}, listing, {
      score: finalScore,
      matchedAmenities: matchedAmenitiesCount,
      isExactLocationMatch: Boolean(workplaceNorm && matchesLocation)
    });
  });

  // Filter for exact location matches if any exist
  var locationMatches = scoredCandidates.filter(function(s) { return s.isExactLocationMatch; });
  var results = (workplaceNorm && locationMatches.length > 0) ? locationMatches : scoredCandidates;

  // Sort by location relevance first, then overall score
  results.sort(function (a, b) {
    if (a.isExactLocationMatch && !b.isExactLocationMatch) return -1;
    if (!a.isExactLocationMatch && b.isExactLocationMatch) return 1;
    return b.score - a.score || (a.price || 0) - (b.price || 0);
  });

  return results;
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
var cachedUser = null;
try {
  var cachedRaw = localStorage.getItem('rentright_user');
  if (cachedRaw) cachedUser = JSON.parse(cachedRaw);
} catch(e) {}

var authState = {
  user: cachedUser,
  token: localStorage.getItem('rentright_token') || '',
  mode: 'login', // 'login' or 'register'
  role: (cachedUser && cachedUser.role) ? cachedUser.role : 'user'
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
    
    var personName = authState.user.name && authState.user.name.trim().length > 0 
      ? authState.user.name.trim() 
      : (authState.user.email ? authState.user.email.split('@')[0] : 'Admin');

    if (authState.user.role === 'admin') {
      if (displayName) displayName.textContent = personName + ' (Flat Seller)';
      // Admin only sees Seller Console
      clientLinks.forEach(function(l) { l.style.display = 'none'; });
      if (adminLink) adminLink.style.display = 'inline-block';
      setViewMode('admin');
    } else {
      if (displayName) displayName.textContent = personName + ' (Customer)';
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

// ===== LOCAL STORAGE DATA PERSISTENCE HELPERS =====
function getCustomListingsFromStorage() {
  try {
    var raw = localStorage.getItem('rentright_custom_listings');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCustomListingsToStorage(list) {
  try {
    localStorage.setItem('rentright_custom_listings', JSON.stringify(list));
  } catch (e) {}
}

function mergeCustomListingsIntoAll() {
  var custom = getCustomListingsFromStorage();
  custom.forEach(function(item) {
    var city = (item.city || 'bengaluru').toLowerCase();
    if (!ALL_LISTINGS[city]) ALL_LISTINGS[city] = [];
    var idx = ALL_LISTINGS[city].findIndex(function(x) { return String(x.id) === String(item.id); });
    if (idx !== -1) {
      ALL_LISTINGS[city][idx] = item;
    } else {
      ALL_LISTINGS[city].unshift(item);
    }
  });
}

function getCustomInquiriesFromStorage() {
  try {
    var raw = localStorage.getItem('rentright_custom_inquiries');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCustomInquiriesToStorage(list) {
  try {
    localStorage.setItem('rentright_custom_inquiries', JSON.stringify(list));
  } catch (e) {}
}

function getCurrentUserEmail() {
  if (authState.user && authState.user.email) {
    return String(authState.user.email).trim().toLowerCase();
  }
  try {
    var raw = localStorage.getItem('rentright_user');
    if (raw) {
      var u = JSON.parse(raw);
      if (u && u.email) return String(u.email).trim().toLowerCase();
    }
  } catch(e) {}
  return '';
}

async function handleAddNewProperty(event) {
  event.preventDefault();
  
  var currentEmail = getCurrentUserEmail();
  var currentUserId = (authState.user && authState.user.id) ? String(authState.user.id).trim() : '';
  if (!currentEmail && !currentUserId) {
    alert("Please sign in as an Administrator before posting a property.");
    return;
  }
  
  var name = document.getElementById('admin-name').value;
  var city = document.getElementById('admin-city').value;
  var area = document.getElementById('admin-area').value;
  var price = Number(document.getElementById('admin-price').value);
  var type = document.getElementById('admin-type').value;
  var commute = document.getElementById('admin-commute').value + " min";
  var distance = document.getElementById('admin-distance').value + " km";
  var safety = Number(document.getElementById('admin-safety').value) || 85;
  var lat = Number(document.getElementById('admin-lat').value) || 12.9716;
  var lng = Number(document.getElementById('admin-lng').value) || 77.5946;
  var amenities = getAdminSelectedAmenities();

  var newId = Date.now();
  var listingPayload = {
    id: newId,
    name: name,
    city: city,
    area: area,
    price: price,
    type: type,
    commute: commute,
    distance: distance,
    ownerId: currentUserId,
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
    reviews: []
  };

  // 1. Immediately persist to localStorage
  var custom = getCustomListingsFromStorage();
  custom.unshift(listingPayload);
  saveCustomListingsToStorage(custom);

  // 2. Put into in-memory ALL_LISTINGS
  if (!ALL_LISTINGS[city]) ALL_LISTINGS[city] = [];
  ALL_LISTINGS[city].unshift(listingPayload);

  alert("Property published successfully!");
  document.getElementById('add-property-form').reset();
  document.querySelectorAll('#admin-amenities .chip.active').forEach(function(c) {
    c.classList.remove('active');
  });
  loadAdminListings();

  // 3. Sync to API in background
  try {
    fetch(getApiUrl('/api/listings'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (authState.token || '')
      },
      body: JSON.stringify(listingPayload)
    });
  } catch (err) {}
}

async function fetchAndUpdateLocalListings() {
  try {
    var currentEmail = getCurrentUserEmail();
    var currentUserId = (authState.user && authState.user.id) ? String(authState.user.id).trim() : '';
    var url = getApiUrl('/api/listings');
    if (currentUserId || currentEmail) {
      url += '?mine=true&ownerId=' + encodeURIComponent(currentUserId) + '&ownerEmail=' + encodeURIComponent(currentEmail);
    }
    var response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + (authState.token || '')
      }
    });
    var data = await response.json();
    if (data.listings) {
      ALL_LISTINGS = data.listings;
    }
  } catch(e) {
    console.error("Failed updating list from server.", e);
  } finally {
    mergeCustomListingsIntoAll();
    loadAdminListings();
  }
}

function loadAdminListings() {
  var tbody = document.getElementById('admin-listings-table-body');
  var totalCount = document.getElementById('admin-total-count');
  
  if (typeof loadAdminInquiries === 'function') {
    loadAdminInquiries();
  }

  if (!tbody) return;

  var currentAdminEmail = getCurrentUserEmail();
  var currentAdminId = (authState.user && authState.user.id) ? String(authState.user.id).trim() : '';

  // If no admin is logged in, show clear empty state
  if (!currentAdminEmail && !currentAdminId) {
    if (totalCount) totalCount.textContent = '0';
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-muted); font-size:0.95rem;">' +
      '🏢 Please log in with your Administrator account to view and manage your properties.' +
      '</td></tr>';
    return;
  }

  // Guarantee custom listings from storage are merged into in-memory ALL_LISTINGS
  mergeCustomListingsIntoAll();

  var allItems = [];
  Object.keys(ALL_LISTINGS).forEach(function (city) {
    ALL_LISTINGS[city].forEach(function (item) {
      if (!allItems.some(function(existing) { return String(existing.id) === String(item.id); })) {
        allItems.push(item);
      }
    });
  });

  // Strict ownership: ONLY properties whose ownerId or ownerEmail strictly matches this logged-in admin
  var myItems = allItems.filter(function(item) {
    var itemOwnerId = String(item.ownerId || item.userId || '').trim();
    var itemOwnerEmail = String(item.ownerEmail || '').trim().toLowerCase();

    if (currentAdminId && itemOwnerId && itemOwnerId === currentAdminId) return true;
    if (currentAdminEmail && itemOwnerEmail && itemOwnerEmail === currentAdminEmail) return true;
    return false;
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
    var cityName = item.city ? cap(item.city) : 'Bengaluru';
    var priceNum = Number(item.price) || 0;
    var priceStr = '₹' + priceNum.toLocaleString('en-IN');
    var commuteStr = (item.commute || '10 min') + (item.distance ? ' (' + item.distance + ')' : '');
    var safetyScore = (item.scores && item.scores.safety != null) ? item.scores.safety : (item.safety || 85);
    var ownerDisplay = item.ownerEmail ? '<div style="font-size:0.7rem; color:var(--accent-primary); margin-top:2px;">👤 ' + item.ownerEmail + '</div>' : '';

    tr.innerHTML = 
      '<td>' +
        '<div style="font-weight:600;">' + (item.name || 'Property') + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted);">' + (item.area || '') + '</div>' +
        ownerDisplay +
      '</td>' +
      '<td>' + cityName + '</td>' +
      '<td>' + (item.type || '1BHK') + '</td>' +
      '<td>' + priceStr + '</td>' +
      '<td>' + commuteStr + '</td>' +
      '<td>' + safetyScore + '/100</td>' +
      '<td>' +
        '<button class="btn-outline" style="color:var(--accent-red);border-color:rgba(239,68,68,0.3);padding:0.35rem 0.75rem;cursor:pointer;" onclick="handleDeleteListing(' + item.id + ')">Delete</button>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

async function handleDeleteListing(id) {
  if (!confirm("Are you sure you want to delete this listing?")) return;
  
  // 1. Remove from localStorage
  var custom = getCustomListingsFromStorage();
  custom = custom.filter(function(x) { return String(x.id) !== String(id); });
  saveCustomListingsToStorage(custom);

  // 2. Remove from in-memory ALL_LISTINGS
  Object.keys(ALL_LISTINGS).forEach(function(city) {
    ALL_LISTINGS[city] = ALL_LISTINGS[city].filter(function(x) { return String(x.id) !== String(id); });
  });

  loadAdminListings();

  // 3. Sync to API in background
  try {
    fetch(getApiUrl('/api/listings/') + id, {
      method: 'DELETE'
    });
  } catch (e) {}
}

// ===== TENANT INQUIRIES & INTEREST MANAGERS =====
function openInquiryModal(listingId, flatName, ownerEmail) {
  var overlay = document.getElementById('inquiry-overlay');
  if (!overlay) return;

  document.getElementById('inquiry-listing-id').value = listingId || '';
  document.getElementById('inquiry-owner-email').value = ownerEmail || '';
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
  if (!alertEl) alertEl.style.display = 'none';
}

async function handleInquirySubmit(event) {
  event.preventDefault();
  hideInquiryAlert();

  var payload = {
    id: 'inq_' + Date.now(),
    listingId: document.getElementById('inquiry-listing-id').value,
    listingName: document.getElementById('inquiry-flat-name').textContent,
    ownerEmail: document.getElementById('inquiry-owner-email').value,
    userName: document.getElementById('inquiry-user-name').value,
    phone: document.getElementById('inquiry-phone').value,
    userEmail: document.getElementById('inquiry-user-email').value,
    moveInDate: document.getElementById('inquiry-move-date').value,
    message: document.getElementById('inquiry-message').value,
    createdAt: new Date().toISOString()
  };

  // 1. Save to localStorage
  var inqs = getCustomInquiriesFromStorage();
  inqs.unshift(payload);
  saveCustomInquiriesToStorage(inqs);

  showInquiryAlert('Success! Your interest has been sent to the property owner.', true);
  setTimeout(function() {
    closeInquiryModal();
    alert('Your contact details have been sent to the landlord. They will reach out to you shortly!');
  }, 800);

  // 2. Sync to API in background
  try {
    fetch(getApiUrl('/api/inquiries'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {}
}

async function loadAdminInquiries() {
  var tbody = document.getElementById('admin-inquiries-table-body');
  var countEl = document.getElementById('admin-inquiries-count');
  if (!tbody) return;

  var currentAdminEmail = getCurrentUserEmail();
  if (!currentAdminEmail) {
    if (countEl) countEl.textContent = '0';
    tbody.innerHTML = '';
    return;
  }

  var inquiries = [];

  try {
    var response = await fetch(getApiUrl('/api/inquiries?ownerEmail=') + encodeURIComponent(currentAdminEmail), {
      headers: { 'Authorization': 'Bearer ' + (authState.token || '') }
    });
    var data = await response.json();
    if (data.inquiries && Array.isArray(data.inquiries)) {
      inquiries = data.inquiries;
    }
  } catch(err) {}

  // Merge ONLY local inquiries strictly belonging to this admin's email
  var localInqs = getCustomInquiriesFromStorage().filter(function(i) {
    var inqOwner = String(i.ownerEmail || '').trim().toLowerCase();
    return inqOwner === currentAdminEmail;
  });

  localInqs.forEach(function(li) {
    if (!inquiries.some(function(i) { return i.id === li.id; })) {
      inquiries.unshift(li);
    }
  });

  // Strict filter on final inquiries list
  inquiries = inquiries.filter(function(inq) {
    var inqOwner = String(inq.ownerEmail || '').trim().toLowerCase();
    return inqOwner === currentAdminEmail;
  });

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
}

async function handleDeleteInquiry(id) {
  if (!confirm("Are you sure you want to remove this lead?")) return;
  var inqs = getCustomInquiriesFromStorage().filter(function(i) { return i.id !== id; });
  saveCustomInquiriesToStorage(inqs);
  try {
    fetch(getApiUrl('/api/inquiries/') + id, { method: 'DELETE' });
  } catch(e) {}
  loadAdminInquiries();
}

// Initial fetch from server and local merge
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
