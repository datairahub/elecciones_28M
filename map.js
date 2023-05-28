class ElectionMap {
  fillLayerId = 'fillLayer';
  lineLayerId = 'lineLayer';
  sourceId = 'adm7';
  hoveredStateId = null;
  currentYear = '2023';
  currentFill = 'winner';
  scales = {
    lastWhite: [
      {value: 0,    color: '#ffffff', label: '0',},
      {value: 12.5, color: '#cccccc', label: '',},
      {value: 25,   color: '#888888', label: '',},
      {value: 37.5, color: '#444444', label: '',},
      {value: 50,   color: '#000000', label: '50+',},
    ],
  };
  legendLabels = {
    lastWhite: 'Votos en blanco (2019)',
  };
  fillLayerFillOpacity = {
    lastWhite: 0.7,
    winner2019: ['interpolate', ["linear", 1], ["get", "last_winner1_val"], 0, 0, 50, 0.9],
    winner2023: ['interpolate', ["linear", 1], ["get", "curr_winner1_val"], 0, 0, 50, 0.9],
    pp2019: ['interpolate', ['linear', 1], ['get', 'last_PP'], 9.99, 0.05, 10, 0.2, 19.9, 0.2, 20, 0.4, 29.99, 0.4, 30, 0.6, 39.99, 0.6, 40, 0.8],
    pp2023: ['interpolate', ['linear', 1], ['get', 'curr_PP'], 9.99, 0.05, 10, 0.2, 19.9, 0.2, 20, 0.4, 29.99, 0.4, 30, 0.6, 39.99, 0.6, 40, 0.8],
    psoe2019: ['interpolate', ['linear', 1], ['get', 'last_PSOE'], 9.99, 0.05, 10, 0.2, 19.9, 0.2, 20, 0.4, 29.99, 0.4, 30, 0.6, 39.99, 0.6, 40, 0.8],
    psoe2023: ['interpolate', ['linear', 1], ['get', 'curr_PSOE'], 9.99, 0.05, 10, 0.2, 19.9, 0.2, 20, 0.4, 29.99, 0.4, 30, 0.6, 39.99, 0.6, 40, 0.8],
    podemos2019: ['interpolate', ['linear', 1], ['get', 'last_UP'], 0.00, 0.05, 9.99, 0.05, 10, 0.4, 19.9, 0.4, 20, 0.6, 29.9, 0.6, 30, 0.8, 39., 0.8, 40, 0.9],
    podemos2023: ['interpolate', ['linear', 1], ['get', 'curr_UP'], 0.00, 0.05, 9.99, 0.05, 10, 0.4, 19.9, 0.4, 20, 0.6, 29.9, 0.6, 30, 0.8, 39., 0.8, 40, 0.9],
    vox2019: ['interpolate', ['linear', 1], ['get', 'last_VOX'], 0.00, 0.05, 9.99, 0.05, 10, 0.4, 19.9, 0.4, 20, 0.6, 29.9, 0.6, 30, 0.8, 39., 0.8, 40, 0.9],
    vox2023: ['interpolate', ['linear', 1], ['get', 'curr_VOX'], 0.00, 0.05, 9.99, 0.05, 10, 0.4, 19.9, 0.4, 20, 0.6, 29.9, 0.6, 30, 0.8, 39., 0.8, 40, 0.9],
  };
  fillLayerFilter = {
    lastWhite: ['has', 'last_results'],
    winner2019: ['has', 'last_winner1_val'],
    winner2023: ['has', 'curr_winner1_val'],
  };
  partyColors = {};
  initialCenter = null;
  initialZoom = null;

  constructor(accessToken, {
    container,
    style,
    source,
    sourceLayer,
    center,
    zoom,
    minZoom,
    initialSelect,
    hash,
    partyColors,
    scrollZoom,
  }) {
    this.source = source;
    this.sourceLayer = sourceLayer;
    this.initialSelect = initialSelect || '2023winner';
    this.initialCenter = [...center];
    this.initialZoom = zoom;
    this.partyColors = partyColors;

    mapboxgl.accessToken = accessToken;
    mapboxgl.clearStorage();

    this.map = new mapboxgl.Map({
      container,
      style,
      center,
      zoom: zoom || 5,
      minZoom: minZoom || 5,
      hash: Boolean(hash),
      attributionControl: false,
    });

    if (!scrollZoom) {
      this.map.scrollZoom.disable();
    }

    this.popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    this.setLayerOptions();
    this.map.on('load', () => {
      this.onMapLoaded();
    });
    this.map.on('mousemove', this.fillLayerId, (e) => {
      this.onMouseMove(e);
    });
    this.map.on('mouseleave', this.fillLayerId, (e) => {
      this.onMouseLeave(e);
    });
    this.map.on('click', this.fillLayerId, (e) => {
      this.onMouseClick(e);
    });
  }

  setLayerOptions() {
    this.fillLayerFillColor = {
      lastWhite: ['interpolate', ['linear', 1], ['get', 'last_votes_white'],
        ...this.scales.lastWhite.map((d) => [d.value, d.color]).flat(),
      ],
      winner2019: ["match", ["get", "last_winner1_key"],
        ...Object.entries(this.partyColors).flat(),
        "#999"
      ],
      winner2023: ["match", ["get", "curr_winner1_key"],
        ...Object.entries(this.partyColors).flat(),
        "#999"
      ],
      pp2019: ["case", ["has", "last_PP"], this.partyColors.PP, "#F7F7F7"],
      pp2023: ["case", ["has", "curr_PP"], this.partyColors.PP, "#F7F7F7"],
      psoe2019: ["case", ["has", "last_PSOE"], this.partyColors.PSOE, "#F7F7F7"],
      psoe2023: ["case", ["has", "curr_PSOE"], this.partyColors.PSOE, "#F7F7F7"],
      podemos2019: ["case", ["has", "last_UP"], this.partyColors.UP, "#F7F7F7"],
      podemos2023: ["case", ["has", "curr_UP"], this.partyColors.UP, "#F7F7F7"],
      vox2019: ["case", ["has", "last_VOX"], this.partyColors.VOX, "#F7F7F7"],
      vox2023: ["case", ["has", "curr_VOX"], this.partyColors.VOX, "#F7F7F7"],
    };
  }

  onMapLoaded() {
    // Add layer source
    this.map.addSource(this.sourceId, { type: 'vector', url: this.source });

    // Fill layer used to show results
    this.map.addLayer({
      id: this.fillLayerId,
      source: this.sourceId,
      type: 'fill',
      'source-layer': this.sourceLayer,
      filter: this.fillLayerFilter[this.initialSelect],
      layout: {
        visibility: 'visible',
      },
      paint: {
        'fill-color': this.fillLayerFillColor[this.initialSelect],
        'fill-opacity': this.fillLayerFillOpacity[this.initialSelect],
        'fill-outline-color': this.fillLayerFillColor[this.initialSelect],
      },
    }, 'road-simple');

    // Line layer used to show hover effects
    this.map.addLayer({
      id: this.lineLayerId,
      source: this.sourceId,
      type: 'line',
      'source-layer': this.sourceLayer,
      paint: {
        'line-color': 'black',
        'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0],
      },
    });

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    // Add search box
    this.map.addControl(new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      language: 'es',
      country: 'es',
      placeholder: 'Busca tu municipio',
    }));

    // Display custom controls and add event listeners
    document.getElementById('custom-controls').classList.remove('hidden');
    document.getElementById('custom-buttons').classList.remove('hidden');
    document.querySelectorAll('.js-control').forEach((control) => {
      control.addEventListener('click', (e) => {
        this.onControlButtonClick(e);
      });
    });
    document.querySelectorAll('.js-year').forEach((control) => {
      control.addEventListener('click', (e) => {
        this.onYearButtonClick(e);
      });
    });
    document.getElementById('zoom-out').addEventListener('click', (e) => {
      this.map.easeTo({
        center: this.initialCenter,
        zoom: this.initialZoom,
        duration: 1600,
        });
    });

    // Set default legend and display it
    this.setLegend(this.initialSelect);
  }

  onMouseMove(e) {
    if (!e.features.length) return;
    if (this.hoveredStateId) {
      this.map.setFeatureState({
        source: this.sourceId,
        sourceLayer: this.sourceLayer,
        id: this.hoveredStateId,
      }, { hover: false });
    }
    this.hoveredStateId = e.features[0].id;
    this.map.setFeatureState({
      source: this.sourceId,
      sourceLayer: this.sourceLayer,
      id: this.hoveredStateId,
    }, { hover: true });

    this.map.getCanvas().style.cursor = 'pointer';
    this.popup.setLngLat(e.lngLat).setHTML(this.popupHtml(e.features[0].properties)).addTo(this.map);
  }

  onMouseLeave(e) {
    this.map.getCanvas().style.cursor = '';
    this.popup.remove();
    if (this.hoveredStateId) {
      this.map.setFeatureState({
        source: this.sourceId,
        sourceLayer: this.sourceLayer,
        id: this.hoveredStateId,
      }, { hover: false });
      this.hoveredStateId = null;
    }
  }

  onMouseClick(e) {
    console.log(e.features[0].properties);
  }

  popupHtml(section) {
    return `
      <div class="mappop-wrapper">
        ${this.popupHeader(section)}
        <div class="mappop-body">
          ${this.popupMetaTable(section)}
          ${this.popupResultsTable(section)}
        </div>
      </div>
    `;
  }

  popupHeader(section) {
    if (!section.CDIS) {
      return `
        <header class="mappop-header">
          <h3>${section.NMUN}</h3>
        </header>
      `;
    }
    return `
      <header class="mappop-header">
        <h3>${section.NMUN}</h3>
        <span></span>
      </header>
    `;
  }

  popupMetaTable(section) {
    return `
      <table class="mappop-table mappop-table--meta">
        <thead>
          <tr>
            <th></th>
            <th class="cr">2019</th>
            <th class="cr">2023</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Participación</td>
            <td class="cr">${section.last_turnout}%</td>
            <td class="cr">${section.curr_turnout}%</td>
          </tr>
          <tr>
            <td>Votos en blanco</td>
            <td class="cr">${section.last_votes_white}</td>
            <td class="cr">${section.curr_votes_white}</td>
          </tr>
          <tr>
            <td>Votos nulos</td>
            <td class="cr">${section.last_votes_null}</td>
            <td class="cr">${section.curr_votes_null}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  popupResultsTable(p) {
    if (!p.curr_results) return '';
    const results = this.popupStrResultsToObj(p.curr_results);
    const rows = Object.keys(results)
      .sort((a, b) => results[b].votes - results[a].votes)
      .map((d) => `
        <tr>
          <td>
            <span class="mappop-partycolor" style="background: ${this.partyColors[d]}"></span>
            <span class="mappop-partyname">${results[d].name}</span>
          </td>
          <td class="cr">${results[d].votes}</td>
          <td class="cr">${results[d].percent}%</td>
        </tr>
      `);
    return `
      <table class="mappop-table mappop-table--results">
        <thead>
          <tr>
            <th></th>
            <th class="cr">Votos</th>
            <th class="cr">% Voto</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    `;
  }

  popupStrResultsToObj(strResults) {
    return strResults.split('~').reduce((acc, curr) => {
      const vals = curr.split('|');
      acc[vals[0]] = {
        name: vals[1],
        votes: +vals[2],
        percent: (+vals[3]).toFixed(2),
      };
      return acc;
    }, {})
  }

  setLegend(scaleName) {
    if (!this.legendLabels[scaleName]) {
      // if clicked legend it's empty, hide legends box
      document.getElementById('legends').classList.add('hidden');
      return;
    }
  
    document.getElementById('legends').classList.remove('hidden');
    document.getElementById('legends-head').innerHTML = this.legendLabels[scaleName];
    const container = document.getElementById('legends-body');
    container.innerHTML = '';
  
    this.scales[scaleName].filter((d) => !d.hideLegend).forEach((l) => {
      container.innerHTML += `
        <div class="map-legend">
          <div class="map-legend-color" style="background-color: ${l.color}"></div>
          <div class="map-legend-label">${l.label}</div>
        </div>
      `;
    });
  };

  setMapFill() {
    const fillName = `${this.currentFill}${this.currentYear}`;

    this.map.setFilter(this.fillLayerId, this.fillLayerFilter[fillName]);
    this.map.setPaintProperty(this.fillLayerId, 'fill-color', this.fillLayerFillColor[fillName]);
    this.map.setPaintProperty(this.fillLayerId, 'fill-opacity', this.fillLayerFillOpacity[fillName]);
    this.map.setPaintProperty(this.fillLayerId, 'fill-outline-color', this.fillLayerFillColor[fillName]);

    // Set map legend
    this.setLegend(this.currentFill);
  }

  onControlButtonClick(e) {
    // If clicked button is currently active don't do anything
    if (e.target.classList.contains('is-active')) return;
  
    // Remove other buttons class is-active
    document.querySelectorAll('.js-control').forEach((control) => {
      control.classList.remove('is-active');
    });
  
    // Apply change
    this.currentFill = e.target.dataset.fill;
    this.setMapFill();

    // Add class to current button
    e.target.classList.add('is-active');
  };

  onYearButtonClick(e) {
    // If clicked button is currently active don't do anything
    if (e.target.classList.contains('is-active')) return;
  
    // Remove other buttons class is-active
    document.querySelectorAll('.js-year').forEach((control) => {
      control.classList.remove('is-active');
    });

    // Apply change
    this.currentYear = e.target.dataset.year
    this.setMapFill();

    // Add class to current button
    e.target.classList.add('is-active');
  };
};
