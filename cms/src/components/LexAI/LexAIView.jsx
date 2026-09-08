import React, { useState, useEffect } from 'react';
import { api } from '../../api';

export default function LexAIView({ initialCaseId, initialPrompt }) {
  // Empty state container prepared for backend API integration
  // You can connect your local Lex AI model or Python backend here

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Lex AI
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0.4rem auto 0 auto' }}>
          Execute the legal prompt designated by the SMS specialist, generate case law synthesis, and transmit results back for final SMS approval.
        </p>
      </div>

      {/* Main Workspace Card (Empty Container for future Integration) */}
      <div className="glass-box" style={{ padding: '3rem 2.25rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/lex%20ai%20icon.jpeg"
            alt="Lex AI"
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'contain',
              filter: 'grayscale(100%) contrast(120%) opacity(80%)',
              mixBlendMode: 'multiply'
            }}
          />
        </div>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Lex AI Integration Container</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
          This dashboard has been left empty and prepared for integration.
          You can inject your local Lex AI Application via API, iframe, or source code directly into this component.
        </p>
      </div>
    </div>
  );
}
