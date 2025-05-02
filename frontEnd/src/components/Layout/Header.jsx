import React from 'react';
import { Navbar, Container, Nav, Button, Image } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { BsMoon, BsSun } from 'react-icons/bs'; // Import Bootstrap Icons

export default function Header({ onMenuToggle }) {
  const { theme, toggle } = useTheme();

  return (
    <Navbar 
      bg="danger" // Change the background to red
      variant="dark" 
      expand="sm" 
      className="shadow-sm" 
      style={{ backgroundColor: '#DC3545', fontFamily: 'Inter, sans-serif' }} // Set background to red
    >
      <Container fluid>
        {/* Mobile menu toggle */}
        <Button
          variant="outline-secondary"
          size="sm"
          className="d-sm-none me-2"
          onClick={onMenuToggle}
        >
          ☰
        </Button>

        {/* Logo (replace with your logo image) */}
        <Navbar.Brand as={NavLink} to="/" className="fw-bold text-white d-flex align-items-center">
  <Image
    src="./logo1.png"
    alt="Logo"
    roundedCircle
    className="border border-white shadow-sm me-2"
    style={{
      height: '48px',
      width: '48px',
      objectFit: 'cover',
      backgroundColor: '#fff',
    }}
  />
  <span className="d-none d-md-inline">TA</span> {/* Facultatif : nom à côté du logo */}
</Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-nav" />
        <Navbar.Collapse id="basic-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end className="text-white">
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/simulation" className="text-white">
              Simulation
            </Nav.Link>
            <Nav.Link as={NavLink} to="/results" className="text-white">
              Results
            </Nav.Link>
          </Nav>
          
          {/* Light/Dark mode toggle button */}
          <Button variant="outline-warning" onClick={toggle}> {/* Yellow secondary color */}
            {theme === 'light' ? <BsMoon /> : <BsSun />} {/* Use Bootstrap Icons */}
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
