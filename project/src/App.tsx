import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Landmark,
  MessageCircleMore,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { getSupabaseClient } from './lib/supabase';

const defaultProducts = [
  {
    id: 'growth-portfolio',
    name: 'Core Growth Portfolio',
    tag: 'Most popular',
    price: 25000,
    description: 'Balanced long-term equity and private-credit allocation with disciplined rebalancing.',
    category: 'Portfolio',
  },
  {
    id: 'income-reserve',
    name: 'Income Reserve',
    tag: 'Income Focus',
    price: 10000,
    description: 'Yield-first strategy built for cash flow, stability, and lower volatility exposure.',
    category: 'Income',
  },
  {
    id: 'private-circle',
    name: 'Private Access Circle',
    tag: 'VIP',
    price: 50000,
    description: 'Premium allocation strategy with curated opportunities and periodic investor reviews.',
    category: 'Private',
  },
];

const defaultMarket = [
  { symbol: 'BTC', name: 'Bitcoin', price: '$68,440.28', change: '+3.41%', trend: 'up' },
  { symbol: 'ETH', name: 'Ethereum', price: '$3,420.62', change: '+2.17%', trend: 'up' },
  { symbol: 'SOL', name: 'Solana', price: '$162.90', change: '+5.67%', trend: 'up' },
  { symbol: 'AAPL', name: 'Apple', price: '$214.16', change: '+1.12%', trend: 'up' },
  { symbol: 'NVDA', name: 'NVIDIA', price: '$128.42', change: '-0.34%', trend: 'down' },
];

const defaultPortfolio = [
  { name: 'Global Equity', value: '$48.8k', change: '+2.1%' },
  { name: 'Private Credit', value: '$12.3k', change: '+5.4%' },
  { name: 'Real Estate', value: '$18.9k', change: '+4.1%' },
  { name: 'Treasury', value: '$21.4k', change: '+0.12%' },
];

const testimonialData = [
  {
    quote: 'Vexel gave us clarity on performance, liquidity, and where to allocate next. It feels like a premium advisory desk in one interface.',
    name: 'Alicia M.',
    role: 'Founder, Northbridge Capital',
  },
  {
    quote: 'The experience feels polished, credible, and serious. It is exactly what our investor-facing brand needed.',
    name: 'Daniel R.',
    role: 'Private Client',
  },
  {
    quote: 'We moved from spreadsheets to a clear, strategic dashboard. The process feels more streamlined and far more trustworthy.',
    name: 'Sonia K.',
    role: 'Operations Lead, Aster Group',
  },
];

const faqs = [
  {
    question: 'What does Vexel specialize in?',
    answer: 'We help investors and clients manage diversified portfolios, improve decision-making, and access curated opportunities.',
  },
  {
    question: 'How quickly can I get started?',
    answer: 'Most onboarding starts with a consultation and portfolio review, followed by strategy alignment and activation in under a week.',
  },
  {
    question: 'Is this more than a dashboard?',
    answer: 'Yes. The platform blends advisory experience, portfolio visibility, and trust-building storefront presentation into one modern experience.',
  },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function App() {
  const [products] = useState(defaultProducts);
  const [marketData] = useState(defaultMarket);
  const [portfolioRows] = useState(defaultPortfolio);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    setIsSupabaseReady(Boolean(supabase));
  }, []);

  const cartItems = useMemo(
    () =>
      products
        .filter((product) => (cart[product.id] ?? 0) > 0)
        .map((product) => ({
          ...product,
          quantity: cart[product.id] ?? 0,
        })),
    [cart, products]
  );

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (productId: string) => {
    setCart((current) => ({
      ...current,
      [productId]: (current[productId] ?? 0) + 1,
    }));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((current) => {
      const nextQty = (current[productId] ?? 0) + delta;
      const nextState = { ...current };
      if (nextQty <= 0) {
        delete nextState[productId];
      } else {
        nextState[productId] = nextQty;
      }
      return nextState;
    });
  };

  return (
    <div className="store-shell">
      <header className="store-header">
        <div className="brand-wrap">
          <div className="brand-mark">V</div>
          <div>
            <div className="brand-name">Vexel Investment</div>
            <div className="brand-subtitle">Private wealth strategy</div>
          </div>
        </div>

        <nav className="store-nav" aria-label="Main navigation">
          <a href="#markets">Markets</a>
          <a href="#products">Offers</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="header-actions">
          <button className="icon-button" aria-label="Alerts">
            <Bell size={16} />
          </button>
          <button className="outline-button">Book consult</button>
        </div>
      </header>

      <main className="page-body">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">Private capital • smarter growth</span>
            <h1>Premium investment strategy for higher-conviction growth.</h1>
            <p>
              Build resilient wealth with a modern advisory experience, transparent portfolio reporting, and access to curated investment channels.
            </p>

            <div className="cta-row">
              <button className="primary-button">
                Get started <ArrowRight size={18} />
              </button>
              <button className="secondary-button">Explore portfolio</button>
            </div>

            <div className="stat-grid">
              <div className="stat-box">
                <strong>$182M+</strong>
                <span>Client assets guided</span>
              </div>
              <div className="stat-box">
                <strong>13.8%</strong>
                <span>Median return</span>
              </div>
              <div className="stat-box">
                <strong>96%</strong>
                <span>Retention</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="portfolio-panel">
              <div className="panel-header-row">
                <div>
                  <span className="tiny-label">Portfolio overview</span>
                  <h3>$184,240.32</h3>
                </div>
                <span className="positive-pill">+12.4%</span>
              </div>

              <div className="chart-bars" aria-hidden="true">
                <span style={{ height: '42%' }} />
                <span style={{ height: '58%' }} />
                <span style={{ height: '71%' }} />
                <span style={{ height: '67%' }} />
                <span style={{ height: '86%' }} />
                <span style={{ height: '94%' }} />
              </div>

              <div className="mini-metrics">
                <div className="mini-metric">
                  <span>Net inflow</span>
                  <strong>+$18.4k</strong>
                </div>
                <div className="mini-metric">
                  <span>Yield</span>
                  <strong>5.4%</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <span>Trusted by founders, families, and investment teams</span>
          <div className="brand-row">
            <div>Northbridge</div>
            <div>Helio</div>
            <div>Aster</div>
            <div>Summit</div>
            <div>Ledgerly</div>
          </div>
        </section>

        <section className="section-block" id="dashboard">
          <div className="section-header">
            <span className="eyebrow">Why clients choose us</span>
            <h2>Strategy, visibility, and execution built for modern wealth.</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon"><ShieldCheck size={20} /></div>
              <h3>Institutional-grade security</h3>
              <p>Protected custody and transparent reporting built for confidence and long-term stability.</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon"><TrendingUp size={20} /></div>
              <h3>Clear growth strategy</h3>
              <p>Disciplined portfolio design focused on compounding returns and diversified opportunity.</p>
            </article>
            <article className="feature-card">
              <div className="feature-icon"><Wallet size={20} /></div>
              <h3>Smarter cash flow</h3>
              <p>Understand liquidity, optimize rebalancing, and monitor what is driving your portfolio.</p>
            </article>
          </div>
        </section>

        <section className="section-block" id="markets">
          <div className="section-header split-header">
            <div>
              <span className="eyebrow">Market watch</span>
              <h2>Current market pulse.</h2>
            </div>
            <a href="#products" className="text-link">See offers <ChevronRight size={16} /></a>
          </div>

          <div className="market-grid">
            <div className="panel-card market-panel">
              <table className="market-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Price</th>
                    <th>Move</th>
                  </tr>
                </thead>
                <tbody>
                  {marketData.map((market) => (
                    <tr key={market.symbol}>
                      <td>
                        <div className="asset-name">
                          <span className="asset-badge">{market.symbol.slice(0, 2)}</span>
                          <div>
                            <strong>{market.symbol}</strong>
                            <span>{market.name}</span>
                          </div>
                        </div>
                      </td>
                      <td>{market.price}</td>
                      <td className={market.trend === 'up' ? 'positive-text' : 'negative-text'}>{market.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="panel-card summary-panel">
              <div className="summary-head">
                <span className="tiny-label">Live allocation</span>
                <strong>Portfolio mix</strong>
              </div>
              {portfolioRows.map((row) => (
                <div key={row.name} className="summary-row">
                  <div>
                    <strong>{row.name}</strong>
                    <span>{row.value}</span>
                  </div>
                  <span className="positive-text">{row.change}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-block" id="products">
          <div className="section-header center-header">
            <span className="eyebrow">Investment offerings</span>
            <h2>Choose the strategy that fits your next move.</h2>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-topline">
                  <span className="tag-badge">{product.tag}</span>
                  <div className="mini-icon"><Sparkles size={15} /></div>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="price-row">
                  <strong>{formatMoney(product.price)}</strong>
                  <span>starting at</span>
                </div>
                <button className="cta-button" onClick={() => addToCart(product.id)}>
                  Add to cart <Plus size={16} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <div className="store-lower-grid">
          <section className="section-block left-block">
            <div className="section-header">
              <span className="eyebrow">Performance</span>
              <h2>Investor-grade reporting made readable.</h2>
            </div>

            <div className="insight-box">
              <div className="insight-head">
                <div>
                  <span className="tiny-label">Monthly return</span>
                  <strong>+8.7%</strong>
                </div>
                <span className="positive-pill">Up</span>
              </div>

              <div className="mini-bars" aria-hidden="true">
                <span style={{ height: '38%' }} />
                <span style={{ height: '52%' }} />
                <span style={{ height: '46%' }} />
                <span style={{ height: '68%' }} />
                <span style={{ height: '80%' }} />
                <span style={{ height: '90%' }} />
              </div>
            </div>
          </section>

          <aside className="cart-panel">
            <div className="cart-header">
              <div>
                <span className="tiny-label">Cart</span>
                <h3>{itemCount} items</h3>
              </div>
              <div className="cart-icon"><ShoppingCart size={18} /></div>
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <p>Your cart is empty.</p>
                <span>Add an offering to start building your strategy.</span>
              </div>
            ) : (
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{formatMoney(item.price)} each</span>
                    </div>
                    <div className="quantity-controls">
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name}`}>
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name}`}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal)}</strong>
              </div>
              <button className="primary-button checkout-button">Checkout</button>
            </div>
          </aside>
        </div>

        <section className="section-block">
          <div className="auth-card">
            <div className="section-header left-header">
              <span className="eyebrow">Account access</span>
              <h2>Supabase-ready login</h2>
            </div>
            <div className="connection-status">
              <span className={`status-dot ${isSupabaseReady ? 'online' : 'offline'}`} />
              {isSupabaseReady ? 'Supabase connected' : 'Demo mode (Supabase not configured)'}
            </div>
          </div>
        </section>

        <section className="section-block contact-block" id="contact">
          <div className="cta-panel">
            <div className="cta-copy">
              <span className="eyebrow">Ready to build with confidence?</span>
              <h2>Let’s shape a portfolio strategy that feels premium and practical.</h2>
            </div>

            <form className="lead-form">
              <div className="form-row">
                <input type="text" placeholder="Full name" aria-label="Full name" />
                <input type="email" placeholder="Email address" aria-label="Email address" />
              </div>
              <textarea rows={4} placeholder="Tell us about your goals" aria-label="Your goals" />
              <button type="submit" className="primary-button">
                Request a consultation <MessageCircleMore size={18} />
              </button>
            </form>
          </div>
        </section>

        <section className="section-block">
          <div className="section-header">
            <span className="eyebrow">Client feedback</span>
            <h2>The trust and polish clients expect.</h2>
          </div>
          <div className="testimonial-grid">
            {testimonialData.map((item) => (
              <article key={item.name} className="testimonial-card">
                <div className="stars" aria-label="5 star rating">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={`${item.name}-${idx}`} size={14} fill="currentColor" />
                  ))}
                </div>
                <p>{item.quote}</p>
                <div className="person-block">
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-header">
            <span className="eyebrow">Questions</span>
            <h2>Everything you need to know before getting started.</h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question} className="faq-item" open>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="store-footer">
        <div>
          <strong>Vexel Investment</strong>
          <span>Private strategy • portfolio planning • modern advisory</span>
        </div>

        <div className="footer-meta">
          <span>hello@vexelinvestment.com</span>
          <span>© 2026 Vexel</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
