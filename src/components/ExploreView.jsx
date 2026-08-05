import React, { useContext, useState } from 'react';
import { MINDFUL_BOOKS } from '../context/AppContext';
import { 
  ChevronLeft, Settings, Volume2, Play, Pause, 
  Sun, Moon, AlignLeft, AlignJustify, AlignRight, Heart 
} from 'lucide-react';

const AUTHORS = [
  { name: 'Agus S', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Agus' },
  { name: 'Ani A', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ani' },
  { name: 'Budi O', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Budi' },
  { name: 'Susi', avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Susi' }
];

const ExploreView = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeBook, setActiveBook] = useState(null); // Selected book for reading
  const [readMode, setReadMode] = useState('text'); // 'text' or 'audio'
  const [isPlaying, setIsPlaying] = useState(false); // Audio player simulation
  const [fontSize, setFontSize] = useState(16); // px font size control
  const [readerTheme, setReaderTheme] = useState('beige'); // 'beige', 'dark', 'slate'
  const [textAlign, setTextAlign] = useState('left'); // 'left', 'justify', 'right'
  const [brightness, setBrightness] = useState(100); // 0-100%

  // Category filter
  const categories = ['All', 'Fantasy', 'Fiction', 'Mystery'];
  
  const filteredBooks = selectedCategory === 'All'
    ? MINDFUL_BOOKS
    : MINDFUL_BOOKS.filter(b => b.category === selectedCategory);

  // Theme styling definitions for reader modal
  const getThemeStyles = () => {
    switch (readerTheme) {
      case 'dark':
        return { background: '#3d2e2c', color: '#fdf8f5', border: '#5c4845' };
      case 'slate':
        return { background: '#475569', color: '#f8fafc', border: '#64748b' };
      case 'beige':
      default:
        return { background: '#fdf8f5', color: '#3d2e2c', border: '#f3eae3' };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div className="container">
      {/* Search / Header Category selection */}
      <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '8px' }}>E-book Recommendations</h2>
      
      <div className="pill-row">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Book Grid */}
      <div className="book-grid" style={{ marginBottom: '24px' }}>
        {filteredBooks.map((book) => (
          <div key={book.id} className="book-card" onClick={() => setActiveBook(book)}>
            <img src={book.coverUrl} alt={book.title} className="book-cover" />
            <div style={{ padding: '0 4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '700' }}>{book.category}</span>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px', lineBreak: 'anywhere' }}>
                {book.title}
              </h4>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {book.episodes}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Top Authors Section */}
      <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>Top Authors</h2>
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
        {AUTHORS.map((auth) => (
          <div key={auth.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <img 
              src={auth.avatar} 
              alt={auth.name} 
              style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f3eae3', border: '2.5px solid #ffffff', boxShadow: '0 4px 10px rgba(61,46,44,0.04)' }} 
            />
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>{auth.name}</span>
          </div>
        ))}
      </div>

      {/* Fully Immersive E-Reader Modal */}
      {activeBook && (
        <div 
          className="reader-overlay" 
          style={{ 
            background: themeStyles.background,
            filter: `brightness(${brightness}%)`
          }}
        >
          <div className="reader-content" style={{ color: themeStyles.color }}>
            {/* Modal Header */}
            <div className="flex-row" style={{ width: '100%', marginBottom: '24px', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  setActiveBook(null);
                  setIsPlaying(false);
                }} 
                className="btn btn-secondary flex-center"
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  padding: 0, 
                  minHeight: '36px',
                  background: 'transparent',
                  color: themeStyles.color,
                  borderColor: themeStyles.border
                }}
              >
                <ChevronLeft size={20} />
              </button>

              {/* Audio/Text Toggle */}
              <div 
                style={{ 
                  background: readerTheme === 'beige' ? '#f3eae3' : 'rgba(255,255,255,0.08)', 
                  borderRadius: '20px', 
                  padding: '3px',
                  display: 'flex',
                  gap: '2px'
                }}
              >
                <button
                  onClick={() => setReadMode('audio')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: readMode === 'audio' ? '#3d2e2c' : 'transparent',
                    color: readMode === 'audio' ? '#ffffff' : themeStyles.color
                  }}
                >
                  Audio
                </button>
                <button
                  onClick={() => setReadMode('text')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: readMode === 'text' ? '#3d2e2c' : 'transparent',
                    color: readMode === 'text' ? '#ffffff' : themeStyles.color
                  }}
                >
                  Text
                </button>
              </div>

              <button 
                className="btn btn-secondary flex-center"
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  padding: 0, 
                  minHeight: '36px',
                  background: 'transparent',
                  color: themeStyles.color,
                  borderColor: themeStyles.border
                }}
              >
                <Settings size={18} />
              </button>
            </div>

            {/* Book Info Panel */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', opacity: 0.7 }}>Chapter 1</span>
              <h1 style={{ fontSize: '22px', fontWeight: '800', marginTop: '6px', color: themeStyles.color }}>{activeBook.title}</h1>
              <span style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px', display: 'block' }}>by {activeBook.author}</span>
            </div>

            {/* Reading View / Audio Simulation */}
            {readMode === 'text' ? (
              <div 
                style={{ 
                  fontSize: `${fontSize}px`, 
                  lineHeight: '1.6', 
                  textAlign: textAlign,
                  paddingBottom: '40px' 
                }}
              >
                {/* Simulated Drop-Cap letter */}
                <span 
                  style={{ 
                    fontSize: `${fontSize * 2.2}px`, 
                    fontWeight: '900', 
                    float: 'left', 
                    marginRight: '6px', 
                    marginTop: '-2px',
                    lineHeight: '1.0',
                    color: readerTheme === 'beige' ? 'var(--accent-color)' : '#fbbf24'
                  }}
                >
                  {activeBook.content[0]}
                </span>
                {activeBook.content.substring(1)}
              </div>
            ) : (
              <div className="flex-center" style={{ flexDirection: 'column', gap: '20px', margin: '40px 0' }}>
                {/* Illustrated Cover disk */}
                <div 
                  style={{ 
                    width: '140px', 
                    height: '140px', 
                    borderRadius: '50%', 
                    backgroundImage: `url(${activeBook.coverUrl})`,
                    backgroundSize: 'cover',
                    border: '5px solid #ffffff',
                    boxShadow: '0 10px 25px rgba(61,46,44,0.15)',
                    animation: isPlaying ? 'spin 12s linear infinite' : 'none'
                  }}
                ></div>

                {/* Audio Controls */}
                <div className="flex-center" style={{ gap: '14px', marginTop: '10px' }}>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="btn btn-primary flex-center"
                    style={{ width: '56px', height: '56px', borderRadius: '50%', padding: 0, background: '#fbbf24' }}
                  >
                    {isPlaying ? <Pause size={24} color="#3d2e2c" /> : <Play size={24} color="#3d2e2c" style={{ marginLeft: '4px' }} />}
                  </button>
                </div>
                <div style={{ width: '80%', background: '#e2e8f0', height: '4px', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ width: isPlaying ? '35%' : '0%', background: '#fbbf24', height: '100%', borderRadius: '2px', transition: 'width 20s linear' }}></div>
                </div>
                <span style={{ fontSize: '11px', opacity: 0.6 }}>{isPlaying ? "Simulating audio playback..." : "Paused"}</span>
              </div>
            )}

            {/* Reader Settings Tray (Only shows in text mode) */}
            {readMode === 'text' && (
              <div className="reader-settings" style={{ background: themeStyles.background, borderColor: themeStyles.border }}>
                
                {/* Brightness Adjustment */}
                <div className="flex-row" style={{ gap: '12px', marginBottom: '14px' }}>
                  <Sun size={14} color={themeStyles.color} style={{ opacity: 0.6 }} />
                  <input 
                    type="range" 
                    min={40} 
                    max={120} 
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    style={{ margin: 0, flex: 1, background: readerTheme === 'beige' ? '#e2e8f0' : 'rgba(255,255,255,0.1)' }}
                  />
                  <Sun size={18} color={themeStyles.color} />
                </div>

                {/* Theme & Alignment Row */}
                <div className="flex-row" style={{ marginBottom: '14px' }}>
                  {/* Theme buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div 
                      className={`theme-circle ${readerTheme === 'beige' ? 'active' : ''}`}
                      onClick={() => setReaderTheme('beige')}
                      style={{ background: '#fdf8f5', border: '1px solid #cbd5e1' }}
                    ></div>
                    <div 
                      className={`theme-circle ${readerTheme === 'dark' ? 'active' : ''}`}
                      onClick={() => setReaderTheme('dark')}
                      style={{ background: '#3d2e2c' }}
                    ></div>
                    <div 
                      className={`theme-circle ${readerTheme === 'slate' ? 'active' : ''}`}
                      onClick={() => setReaderTheme('slate')}
                      style={{ background: '#475569' }}
                    ></div>
                  </div>

                  {/* Alignment selectors */}
                  <div style={{ display: 'flex', gap: '4px', background: readerTheme === 'beige' ? '#f3eae3' : 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '2px' }}>
                    <button 
                      onClick={() => setTextAlign('left')}
                      style={{ border: 'none', background: textAlign === 'left' ? '#3d2e2c' : 'transparent', color: textAlign === 'left' ? '#ffffff' : themeStyles.color, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button 
                      onClick={() => setTextAlign('justify')}
                      style={{ border: 'none', background: textAlign === 'justify' ? '#3d2e2c' : 'transparent', color: textAlign === 'justify' ? '#ffffff' : themeStyles.color, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      <AlignJustify size={14} />
                    </button>
                    <button 
                      onClick={() => setTextAlign('right')}
                      style={{ border: 'none', background: textAlign === 'right' ? '#3d2e2c' : 'transparent', color: textAlign === 'right' ? '#ffffff' : themeStyles.color, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      <AlignRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Font Resizing Tray */}
                <div className="flex-row">
                  <span style={{ fontSize: '12px', fontWeight: '700', color: themeStyles.color }}>Text size</span>
                  <div className="flex-center" style={{ gap: '12px' }}>
                    <button 
                      onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                      className="btn btn-secondary flex-center"
                      style={{ width: '32px', height: '32px', minHeight: '32px', padding: 0, borderRadius: '8px', fontSize: '16px', background: 'transparent', color: themeStyles.color, borderColor: themeStyles.border }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: '800' }}>{fontSize}px</span>
                    <button 
                      onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                      className="btn btn-secondary flex-center"
                      style={{ width: '32px', height: '32px', minHeight: '32px', padding: 0, borderRadius: '8px', fontSize: '16px', background: 'transparent', color: themeStyles.color, borderColor: themeStyles.border }}
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreView;
