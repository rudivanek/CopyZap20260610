window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Google Analytics stores nothing until the visitor accepts analytics cookies in
// the cookie banner (components/CookieConsent.tsx). Before 2026-10-20 there was
// no default here, so analytics cookies were set before anyone was asked.
var analyticsAccepted = false;
try {
  analyticsAccepted = localStorage.getItem('copyZap_cookieConsent') === 'accepted';
} catch (e) {
  analyticsAccepted = false;
}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: analyticsAccepted ? 'granted' : 'denied'
});

gtag('js', new Date());
gtag('config', 'G-LEMLSR6SM2');
