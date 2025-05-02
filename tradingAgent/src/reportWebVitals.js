// src/reportWebVitals.js
import * as webVitals from 'web-vitals';

const reportWebVitals = (onPerfEntry) => {
  if (typeof onPerfEntry === 'function') {
    webVitals.getCLS(onPerfEntry);
    webVitals.getFID(onPerfEntry);
    webVitals.getFCP(onPerfEntry);
    webVitals.getLCP(onPerfEntry);
    webVitals.getTTFB(onPerfEntry);
  }
};

export default reportWebVitals;
