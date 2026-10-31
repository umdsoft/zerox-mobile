// Notification ro'yxati testlari uchun bola komponent mock'i: nomi + oddiy proplar (funksiyalar '[fn]', `navigation` tashlanadi).
const React = require('react');

const strip = p => {
  const o = {};
  Object.keys(p).forEach(k => {
    if (k === 'navigation') return;
    o[k] = typeof p[k] === 'function' ? '[fn]' : p[k];
  });
  return o;
};

exports.makeChild = name => p => {
  global.__notifChild = global.__notifChild || {};
  global.__notifChild[name] = p;
  global.__notifChildNavigationProp = global.__notifChildNavigationProp || {};
  global.__notifChildNavigationProp[name] = Object.prototype.hasOwnProperty.call(p, 'navigation');
  return React.createElement('NotifChild', { name, ...strip(p) });
};
