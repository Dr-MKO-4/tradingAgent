// src/components/Layout/Footer.jsx
import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      © {new Date().getFullYear()} TradingAgent
      <a href="https://github.com/ton-repo" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
    </footer>
  );
}