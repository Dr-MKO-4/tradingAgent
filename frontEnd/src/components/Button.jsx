// Button.jsx
export default function Button({ children, onClick }) {
    return (
      <button
        onClick={onClick}
        style={{
          backgroundColor: 'var(--btn-primary)',
          color: 'var(--text-main)',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer'
        }}
        onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--btn-hover)'}
        onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--btn-primary)'}
      >
        {children}
      </button>
    );
  }
  