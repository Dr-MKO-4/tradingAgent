// src/components/Layout/Navbar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <NavLink to="/">🚀 TradingAgent</NavLink>
      </div>
      <ul className={styles.links}>
        <li><NavLink to="/dashboard">Dashboard</NavLink></li>
        <li><NavLink to="/history">History</NavLink></li>
        <li><NavLink to="/about">About</NavLink></li>
      </ul>
    </nav>
  );
}