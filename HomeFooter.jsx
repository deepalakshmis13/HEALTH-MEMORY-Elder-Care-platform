import { Link } from 'react-router-dom';
import { BrandMark } from './illustrations';
import { scrollToSection } from './HomeNav';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Health Memory', section: 'health-memory' },
      { label: 'How It Works', section: 'how-it-works' },
      { label: 'AI Assistance', section: 'intelligence' },
      { label: 'Emergency Card', section: 'emergency' },
    ],
  },
  {
    title: 'For Care Teams',
    links: [
      { label: 'Doctors', section: 'for-doctors' },
      { label: 'Caregivers', section: 'for-caregivers' },
      { label: 'Old Age Homes', section: 'for-caregivers' },
      { label: 'Pharmacists', section: 'for-pharmacists' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', section: 'about' },
      { label: 'Contact', section: 'about' },
      { label: 'Privacy', section: 'about' },
      { label: 'Terms', section: 'about' },
    ],
  },
];

export function HomeFooter() {
  return (
    <footer className="hp-footer" id="about">
      <div className="hp-shell">
        <div className="hp-footer-top">
          <div className="hp-footer-about">
            <div className="hp-brand">
              <span className="hp-brand-mark">
                <BrandMark size={22} />
              </span>
              <span className="hp-brand-text">
                <span className="hp-brand-name">Health Memory</span>
                <span className="hp-brand-sub">Elder Care Platform</span>
              </span>
            </div>
            <p>
              A persistent, consent-aware health memory that keeps an elderly
              patient&rsquo;s health story connected across every doctor, caregiver
              and pharmacy that supports them.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h4>{column.title}</h4>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(link.section)}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hp-footer-bottom">
          <span>
            © {new Date().getFullYear()} Health Memory · Built for connected elder
            care
          </span>
          <span style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Link to="/login">Login</Link>
            <Link to="/register">Get Started</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default HomeFooter;
