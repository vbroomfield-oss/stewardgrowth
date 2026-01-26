/**
 * StewardGrowth Tracking SDK
 *
 * Simple drop-in analytics for SaaS products.
 * Just add the snippet to your site - no configuration needed.
 */

(function(window, document) {
  'use strict';

  var SG_ENDPOINT = 'https://api.stewardgrowth.com/events/ingest';
  var SG_VERSION = '1.0.0';

  // Get tracking ID from script tag
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];
  var trackingId = currentScript.src.split('id=')[1]?.split('&')[0] || '';

  // Initialize
  var sg = window.sg = window.sg || {};
  sg.queue = sg.queue || [];
  sg.trackingId = trackingId;
  sg.userId = null;
  sg.anonymousId = getAnonymousId();
  sg.sessionId = getSessionId();

  // Generate anonymous ID (persisted in localStorage)
  function getAnonymousId() {
    var id = localStorage.getItem('sg_anonymous_id');
    if (!id) {
      id = 'anon_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('sg_anonymous_id', id);
    }
    return id;
  }

  // Generate session ID (persisted in sessionStorage)
  function getSessionId() {
    var id = sessionStorage.getItem('sg_session_id');
    if (!id) {
      id = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      sessionStorage.setItem('sg_session_id', id);
    }
    return id;
  }

  // Get UTM parameters
  function getUTMParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),
    };
  }

  // Get device info
  function getDeviceInfo() {
    var ua = navigator.userAgent;
    return {
      device_type: /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop',
      browser: getBrowser(ua),
      os: getOS(ua),
      screen_width: window.screen.width,
      screen_height: window.screen.height,
    };
  }

  function getBrowser(ua) {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  function getOS(ua) {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
    return 'Other';
  }

  // Send event to StewardGrowth
  function sendEvent(eventName, properties) {
    var payload = {
      tracking_id: sg.trackingId,
      event_name: eventName,
      timestamp: new Date().toISOString(),
      user_id: sg.userId,
      anonymous_id: sg.anonymousId,
      session_id: sg.sessionId,
      page_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer,
      ...getUTMParams(),
      ...getDeviceInfo(),
      properties: properties || {},
    };

    // Use sendBeacon for reliability, fallback to fetch
    var data = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(SG_ENDPOINT, data);
    } else {
      fetch(SG_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(function() {});
    }
  }

  // Public API
  sg.track = function(eventName, properties) {
    sendEvent(eventName, properties);
  };

  sg.identify = function(userId, traits) {
    sg.userId = userId;
    if (userId) {
      localStorage.setItem('sg_user_id', userId);
    }
    sendEvent('identify', { user_id: userId, ...traits });
  };

  sg.page = function(pageName, properties) {
    sendEvent('page_view', { page_name: pageName, ...properties });
  };

  // Auto-track page views
  sg.page();

  // Track when user leaves
  window.addEventListener('beforeunload', function() {
    sendEvent('session_end', {
      duration: Math.round((Date.now() - parseInt(sg.sessionId.split('_')[1], 36)) / 1000)
    });
  });

  // Process any queued events (from before SDK loaded)
  if (window.sgLayer && window.sgLayer.length) {
    window.sgLayer.forEach(function(item) {
      if (item.event === 'identify') {
        sg.identify(item.userId, item);
      } else if (item.event) {
        sg.track(item.event, item);
      }
    });
  }

  console.log('[StewardGrowth] Tracking initialized:', trackingId);

})(window, document);
