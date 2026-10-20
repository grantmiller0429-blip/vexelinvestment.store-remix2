import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Bell,
  Bitcoin,
  CheckCircle2,
  CreditCard,
  Landmark,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  getCurrentUser,
  getSession,
  getSupabaseClient,
  signInWithSupabase,
  signOutFromSupabase,
  signUpWithSupabase,
} from './lib/supabase';
import { getHostedPaymentCheckoutUrl, getPaymentProviderStatus } from './lib/payment';

type PaymentTab = 'crypto' | 'card' | 'bank';
type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'completed';
type TransactionType = 'deposit' | 'withdrawal';
type AuthMode = 'login' | 'signup';

type WalletAddress = {
  symbol: 'BTC' | 'USDT' | 'ETH';
  label: string;
  network: string;
  address: string;
};

type Transaction = {
  id: string;
  user: string;
  type: TransactionType;
  method: PaymentTab | 'crypto' | 'card' | 'bank';
  asset: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  reference: string;
};

const walletAddresses: WalletAddress[] = [
  {
    symbol: 'BTC',
    label: 'Bitcoin wallet',
    network: 'Bitcoin Network',
    address: 'bc1q7x9e5p2l4j8n5m6t2r7u0d9w4c1k2v',
  },
  {
    symbol: 'USDT',
    label: 'Tether wallet',
    network: 'TRC20 / ERC20',
    address: 'TQ2Qv8M7m4k3N6Z8q2mF3F9wK1Q3A8bYhL',
  },
  {
    symbol: 'ETH',
    label: 'Ethereum wallet',
    network: 'Ethereum Network',
    address: '0xA7E1fF5f80D8d2203bE2a91200B0B6Cd3BfA01b1',
  },
];

const initialTransactions: Transaction[] = [
  {
    id: 'TX-1024',
    user: 'Demo Investor',
    type: 'deposit',
    method: 'crypto',
    asset: 'BTC',
    amount: 0.18,
    status: 'pending',
    createdAt: '2026-10-18 09:40',
    reference: 'DEP-BTC-1024',
  },
  {
    id: 'TX-1021',
    user: 'Demo Investor',
    type: 'withdrawal',
    method: 'bank',
    asset: 'USD',
    amount: 2200,
    status: 'pending',
    createdAt: '2026-10-17 18:55',
    reference: 'WDL-BANK-1021',
  },
  {
    id: 'TX-1018',
    user: 'Demo Investor',
    type: 'deposit',
    method: 'card',
    asset: 'USD',
    amount: 1500,
    status: 'approved',
    createdAt: '2026-10-16 11:20',
    reference: 'DEP-CARD-1018',
  },
  {
    id: 'TX-1010',
    user: 'Demo Investor',
    type: 'deposit',
    method: 'crypto',
    asset: 'USDT',
    amount: 4500,
    status: 'completed',
    createdAt: '2026-10-14 08:10',
    reference: 'DEP-USDT-1010',
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);

export default function App() {
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [statusMessage, setStatusMessage] = useState('');
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('crypto');
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [cryptoForm, setCryptoForm] = useState({
    coin: 'BTC',
    amount: '',
    walletAddress: '',
    txHash: '',
  });
  const [cardForm, setCardForm] = useState({
    fullName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    amount: '',
  });
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    routing: '',
    amount: '',
    reference: '',
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    method: 'crypto',
    asset: 'BTC',
    amount: '',
    destination: '',
    note: '',
  });

  useEffect(() => {
    const supabaseClient = getSupabaseClient();
    setIsSupabaseReady(Boolean(supabaseClient));

    const hydrateSession = async () => {
      try {
        const { session, user } = await getSession();
        if (session && user) {
          setIsLoggedIn(true);
          setIsAdmin(Boolean(user.email?.toLowerCase().includes('admin')));
        }
      } catch {
        setIsLoggedIn(false);
      }
    };

    void hydrateSession();
  }, []);

  const dashboardStats = useMemo(() => {
    const deposits = transactions.filter((item) => item.type === 'deposit');
    const withdrawals = transactions.filter((item) => item.type === 'withdrawal');
    const pending = transactions.filter((item) => item.status === 'pending');
    const totalDeposits = deposits.reduce((sum, item) => sum + item.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, item) => sum + item.amount, 0);

    return {
      totalDeposits: formatCurrency(totalDeposits),
      totalWithdrawals: formatCurrency(totalWithdrawals),
      pendingCount: pending.length,
      availableBalance: formatCurrency(Math.max(totalDeposits - totalWithdrawals, 0)),
    };
  }, [transactions]);

  const paymentStatus = getPaymentProviderStatus();

  const addTransaction = (
    type: TransactionType,
    method: PaymentTab,
    asset: string,
    amount: number,
    status: TransactionStatus,
    reference: string
  ) => {
    const newTransaction: Transaction = {
      id: `TX-${Math.floor(Date.now() % 9000 + 1000)}`,
      user: authForm.email || 'Demo Investor',
      type,
      method,
      asset,
      amount,
      status,
      createdAt: new Date().toLocaleString(),
      reference,
    };

    setTransactions((current) => [newTransaction, ...current]);
  };

  const handleApproval = (transactionId: string, nextStatus: TransactionStatus) => {
    setTransactions((current) =>
      current.map((item) =>
        item.id === transactionId ? { ...item, status: nextStatus } : item
      )
    );
    setStatusMessage(`Transaction ${transactionId} marked as ${nextStatus}.`);
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isSupabaseReady) {
      const demoAdmin = authForm.email.toLowerCase().includes('admin') || authForm.fullName.toLowerCase().includes('admin');
      setIsAdmin(demoAdmin);
      setIsLoggedIn(true);
      setStatusMessage('Demo mode: session started locally because Supabase is not configured yet.');
      return;
    }

    try {
      if (authMode === 'signup') {
        const { error } = await signUpWithSupabase({
          email: authForm.email,
          password: authForm.password,
          fullName: authForm.fullName,
        });

        if (error) {
          throw error;
        }

        setStatusMessage('Signup successful. Please check your email to confirm your account.');
      } else {
        const { error } = await signInWithSupabase({
          email: authForm.email,
          password: authForm.password,
        });

        if (error) {
          throw error;
        }
      }

      const { user } = await getCurrentUser();
      const adminState = Boolean(user?.email?.toLowerCase().includes('admin'));
      setIsAdmin(adminState);
      setIsLoggedIn(true);
      setStatusMessage('Authenticated using Supabase.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      setStatusMessage(message);
    }
  };

  const handleLogout = async () => {
    try {
      if (isSupabaseReady) {
        await signOutFromSupabase();
      }
    } catch {
      // no-op fallback
    }

    setIsLoggedIn(false);
    setIsAdmin(false);
    setStatusMessage('Logged out successfully.');
  };

  const handleCryptoDeposit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(cryptoForm.amount);
    if (!cryptoForm.walletAddress || !amount || amount <= 0) {
      setStatusMessage('Please provide a valid amount and wallet address.');
      return;
    }

    addTransaction('deposit', 'crypto', cryptoForm.coin, amount, 'pending', `DEP-${cryptoForm.coin}-${Date.now()}`);
    setStatusMessage('Crypto deposit request submitted and is pending review.');
    setCryptoForm({ coin: 'BTC', amount: '', walletAddress: '', txHash: '' });
  };

  const handleCardDeposit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(cardForm.amount);
    if (!cardForm.cardNumber || !cardForm.expiry || !cardForm.cvv || !amount || amount <= 0) {
      setStatusMessage('Please complete the card form before submitting.');
      return;
    }

    addTransaction('deposit', 'card', 'USD', amount, 'pending', `DEP-CARD-${Date.now()}`);
    setStatusMessage('Card deposit submitted for review.');
    setCardForm({ fullName: '', cardNumber: '', expiry: '', cvv: '', amount: '' });
  };

  const handleBankDeposit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(bankForm.amount);
    if (!bankForm.bankName || !bankForm.accountHolder || !bankForm.accountNumber || !amount || amount <= 0) {
      setStatusMessage('Please complete the bank deposit fields correctly.');
      return;
    }

    addTransaction('deposit', 'bank', 'USD', amount, 'pending', `DEP-BANK-${Date.now()}`);
    setStatusMessage('Bank deposit request pending review.');
    setBankForm({ bankName: '', accountHolder: '', accountNumber: '', routing: '', amount: '', reference: '' });
  };

  const handleWithdrawal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(withdrawalForm.amount);
    if (!withdrawalForm.destination || !amount || amount <= 0) {
      setStatusMessage('Please provide a valid destination and withdrawal amount.');
      return;
    }

    addTransaction(
      'withdrawal',
      withdrawalForm.method as PaymentTab,
      withdrawalForm.asset,
      amount,
      'pending',
      `WDL-${withdrawalForm.method.toUpperCase()}-${Date.now()}`
    );
    setStatusMessage('Withdrawal request submitted and is pending approval.');
    setWithdrawalForm({ method: 'crypto', asset: 'BTC', amount: '', destination: '', note: '' });
  };

  const pendingTransactions = transactions.filter((item) => item.status === 'pending');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">V</div>
          <div>
            <div className="brand-name">Vexel Investment</div>
            <div className="brand-subtitle">Private wealth dashboard</div>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#overview">Overview</a>
          <a href="#deposits">Deposits</a>
          <a href="#history">History</a>
          <a href="#security">Security</a>
        </nav>

        {isLoggedIn ? (
          <div className="user-actions">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <button type="button" className="logout-button" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        ) : (
          <button type="button" className="primary-button" onClick={() => setAuthMode('login')}>
            Sign in
          </button>
        )}
      </header>

      {!isLoggedIn ? (
        <main className="auth-page">
          <section className="auth-panel">
            <div className="auth-copy">
              <span className="eyebrow">Secure access</span>
              <h1>Access your Vexel investment dashboard.</h1>
              <p>
                Manage deposits, withdrawals, wallet addresses, and account activity from one secure portal.
              </p>
              <div className="security-points">
                <div><ShieldCheck size={16} /> End-to-end protection</div>
                <div><TrendingUp size={16} /> Real-time tracking</div>
                <div><Wallet size={16} /> Multi-currency wallet support</div>
              </div>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <div className="segmented-control">
                <button type="button" className={authMode === 'login' ? 'segment active' : 'segment'} onClick={() => setAuthMode('login')}>
                  Login
                </button>
                <button type="button" className={authMode === 'signup' ? 'segment active' : 'segment'} onClick={() => setAuthMode('signup')}>
                  Sign up
                </button>
              </div>

              {authMode === 'signup' && (
                <label>
                  <span>Full name</span>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={authForm.fullName}
                    onChange={(event) => setAuthForm((current) => ({ ...current, fullName: event.target.value }))}
                  />
                </label>
              )}

              <label>
                <span>Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={authForm.email}
                  onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Your password"
                  value={authForm.password}
                  onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>

              <button type="submit" className="primary-button full-width">
                {authMode === 'login' ? 'Login to dashboard' : 'Create account'}
                <ArrowRight size={18} />
              </button>

              {statusMessage && <p className="status-text">{statusMessage}</p>}
            </form>
          </section>
        </main>
      ) : (
        <main className="dashboard-page">
          <section className="dashboard-hero" id="overview">
            <div>
              <span className="eyebrow">Portfolio overview</span>
              <h2>Welcome back, Demo Investor.</h2>
            </div>
            <div className="status-card">
              <span className={`status-dot ${isSupabaseReady ? 'online' : 'offline'}`} />
              {isSupabaseReady ? 'Supabase connected' : 'Demo mode enabled'}
            </div>
          </section>

          <section className="summary-grid">
            <article className="summary-card">
              <div className="summary-head">
                <span>Total deposits</span>
                <Wallet size={18} />
              </div>
              <strong>{dashboardStats.totalDeposits}</strong>
            </article>

            <article className="summary-card">
              <div className="summary-head">
                <span>Total withdrawals</span>
                <Landmark size={18} />
              </div>
              <strong>{dashboardStats.totalWithdrawals}</strong>
            </article>

            <article className="summary-card">
              <div className="summary-head">
                <span>Pending requests</span>
                <MessageSquareText size={18} />
              </div>
              <strong>{dashboardStats.pendingCount}</strong>
            </article>

            <article className="summary-card accent-card">
              <div className="summary-head">
                <span>Available balance</span>
                <CheckCircle2 size={18} />
              </div>
              <strong>{dashboardStats.availableBalance}</strong>
            </article>
          </section>

          <section className="panel-grid" id="deposits">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Deposit funds</span>
                  <h3>Funding methods</h3>
                </div>
                <div className="segmented-control compact">
                  <button type="button" className={paymentTab === 'crypto' ? 'segment active' : 'segment'} onClick={() => setPaymentTab('crypto')}>
                    Crypto
                  </button>
                  <button type="button" className={paymentTab === 'card' ? 'segment active' : 'segment'} onClick={() => setPaymentTab('card')}>
                    Card
                  </button>
                  <button type="button" className={paymentTab === 'bank' ? 'segment active' : 'segment'} onClick={() => setPaymentTab('bank')}>
                    Bank
                  </button>
                </div>
              </div>

              {paymentTab === 'crypto' && (
                <div className="payment-body">
                  <div className="wallet-list">
                    {walletAddresses.map((wallet) => (
                      <div className="wallet-item" key={wallet.symbol}>
                        <div className="wallet-meta">
                          <span className="coin-pill">{wallet.symbol}</span>
                          <div>
                            <strong>{wallet.label}</strong>
                            <small>{wallet.network}</small>
                          </div>
                        </div>
                        <code>{wallet.address}</code>
                      </div>
                    ))}
                  </div>

                  <form className="deposit-form" onSubmit={handleCryptoDeposit}>
                    <div className="grid-two">
                      <label>
                        <span>Coin</span>
                        <select value={cryptoForm.coin} onChange={(event) => setCryptoForm((current) => ({ ...current, coin: event.target.value }))}>
                          <option value="BTC">Bitcoin</option>
                          <option value="USDT">USDT</option>
                          <option value="ETH">Ethereum</option>
                        </select>
                      </label>

                      <label>
                        <span>Amount</span>
                        <input type="number" min="0" placeholder="0.00" value={cryptoForm.amount} onChange={(event) => setCryptoForm((current) => ({ ...current, amount: event.target.value }))} />
                      </label>
                    </div>

                    <label>
                      <span>Wallet address</span>
                      <input type="text" placeholder="Paste your wallet address" value={cryptoForm.walletAddress} onChange={(event) => setCryptoForm((current) => ({ ...current, walletAddress: event.target.value }))} />
                    </label>

                    <label>
                      <span>Transaction hash (optional)</span>
                      <input type="text" placeholder="Optional confirmation hash" value={cryptoForm.txHash} onChange={(event) => setCryptoForm((current) => ({ ...current, txHash: event.target.value }))} />
                    </label>

                    <button type="submit" className="primary-button full-width">
                      Submit crypto deposit
                    </button>
                  </form>
                </div>
              )}

              {paymentTab === 'card' && (
                <form className="deposit-form" onSubmit={handleCardDeposit}>
                  <div className="grid-two">
                    <label>
                      <span>Full name</span>
                      <input type="text" placeholder="Cardholder name" value={cardForm.fullName} onChange={(event) => setCardForm((current) => ({ ...current, fullName: event.target.value }))} />
                    </label>

                    <label>
                      <span>Amount</span>
                      <input type="number" min="0" placeholder="Amount in USD" value={cardForm.amount} onChange={(event) => setCardForm((current) => ({ ...current, amount: event.target.value }))} />
                    </label>
                  </div>

                  <label>
                    <span>Card number</span>
                    <input type="text" placeholder="1234 5678 9012 3456" value={cardForm.cardNumber} onChange={(event) => setCardForm((current) => ({ ...current, cardNumber: event.target.value }))} />
                  </label>

                  <div className="grid-two">
                    <label>
                      <span>Expiry date</span>
                      <input type="text" placeholder="MM/YY" value={cardForm.expiry} onChange={(event) => setCardForm((current) => ({ ...current, expiry: event.target.value }))} />
                    </label>

                    <label>
                      <span>CVV</span>
                      <input type="password" placeholder="***" value={cardForm.cvv} onChange={(event) => setCardForm((current) => ({ ...current, cvv: event.target.value }))} />
                    </label>
                  </div>

                  <div className="status-card compact">
                    <span className={`status-dot ${paymentStatus.ready ? 'online' : 'offline'}`} />
                    {paymentStatus.message}
                  </div>

                  <button type="submit" className="primary-button full-width">
                    <CreditCard size={18} />
                    Submit card deposit
                  </button>
                </form>
              )}

              {paymentTab === 'bank' && (
                <form className="deposit-form" onSubmit={handleBankDeposit}>
                  <div className="grid-two">
                    <label>
                      <span>Bank name</span>
                      <input type="text" placeholder="Bank name" value={bankForm.bankName} onChange={(event) => setBankForm((current) => ({ ...current, bankName: event.target.value }))} />
                    </label>

                    <label>
                      <span>Account holder</span>
                      <input type="text" placeholder="Account holder" value={bankForm.accountHolder} onChange={(event) => setBankForm((current) => ({ ...current, accountHolder: event.target.value }))} />
                    </label>
                  </div>

                  <div className="grid-two">
                    <label>
                      <span>Account number</span>
                      <input type="text" placeholder="Account number" value={bankForm.accountNumber} onChange={(event) => setBankForm((current) => ({ ...current, accountNumber: event.target.value }))} />
                    </label>

                    <label>
                      <span>Routing / SWIFT / sort code</span>
                      <input type="text" placeholder="Routing / SWIFT / sort code" value={bankForm.routing} onChange={(event) => setBankForm((current) => ({ ...current, routing: event.target.value }))} />
                    </label>
                  </div>

                  <div className="grid-two">
                    <label>
                      <span>Amount</span>
                      <input type="number" min="0" placeholder="USD amount" value={bankForm.amount} onChange={(event) => setBankForm((current) => ({ ...current, amount: event.target.value }))} />
                    </label>

                    <label>
                      <span>Reference</span>
                      <input type="text" placeholder="Optional reference" value={bankForm.reference} onChange={(event) => setBankForm((current) => ({ ...current, reference: event.target.value }))} />
                    </label>
                  </div>

                  <button type="submit" className="primary-button full-width">
                    <Landmark size={18} />
                    Submit bank deposit
                  </button>
                </form>
              )}

              {statusMessage && <p className="status-text">{statusMessage}</p>}
            </div>

            <aside className="panel sidebar-panel">
              <div className="panel-header compact-header">
                <div>
                  <span className="eyebrow">Withdraw</span>
                  <h3>Request payout</h3>
                </div>
              </div>

              <form className="withdrawal-form" onSubmit={handleWithdrawal}>
                <label>
                  <span>Method</span>
                  <select value={withdrawalForm.method} onChange={(event) => setWithdrawalForm((current) => ({ ...current, method: event.target.value }))}>
                    <option value="crypto">Crypto</option>
                    <option value="bank">Bank</option>
                    <option value="card">Card</option>
                  </select>
                </label>

                <label>
                  <span>Asset</span>
                  <select value={withdrawalForm.asset} onChange={(event) => setWithdrawalForm((current) => ({ ...current, asset: event.target.value }))}>
                    <option value="BTC">BTC</option>
                    <option value="USDT">USDT</option>
                    <option value="ETH">ETH</option>
                    <option value="USD">USD</option>
                  </select>
                </label>

                <label>
                  <span>Amount</span>
                  <input type="number" min="0" placeholder="0.00" value={withdrawalForm.amount} onChange={(event) => setWithdrawalForm((current) => ({ ...current, amount: event.target.value }))} />
                </label>

                <label>
                  <span>Destination</span>
                  <input type="text" placeholder="Wallet or bank destination" value={withdrawalForm.destination} onChange={(event) => setWithdrawalForm((current) => ({ ...current, destination: event.target.value }))} />
                </label>

                <label>
                  <span>Note</span>
                  <textarea rows={3} placeholder="Optional withdrawal note" value={withdrawalForm.note} onChange={(event) => setWithdrawalForm((current) => ({ ...current, note: event.target.value }))} />
                </label>

                <button type="submit" className="secondary-button full-width">
                  Submit withdrawal
                </button>
              </form>
            </aside>
          </section>

          <section className="admin-panel" id="history">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Transactions</span>
                <h3>Pending and completed activity</h3>
              </div>
            </div>

            <div className="transaction-toolbar">
              <div className="chip-row">
                <span className="chip pending-chip">{pendingTransactions.length} pending</span>
                <span className="chip success-chip">{transactions.filter((item) => item.status === 'completed').length} completed</span>
              </div>
            </div>

            <div className="transaction-table-wrap">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Asset</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reference</th>
                    <th>Date</th>
                    {isAdmin ? <th>Admin</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.type}</td>
                      <td>{transaction.method}</td>
                      <td>{transaction.asset}</td>
                      <td>{formatCurrency(transaction.amount)}</td>
                      <td>
                        <span className={`status-badge ${transaction.status}`}>{transaction.status}</span>
                      </td>
                      <td>{transaction.reference}</td>
                      <td>{transaction.createdAt}</td>
                      {isAdmin ? (
                        <td>
                          <div className="admin-actions">
                            <button type="button" className="mini-action approve" onClick={() => handleApproval(transaction.id, 'approved')}>
                              Approve
                            </button>
                            <button type="button" className="mini-action reject" onClick={() => handleApproval(transaction.id, 'rejected')}>
                              Reject
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="security-panel" id="security">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Security</span>
                <h3>Compliance and verification</h3>
              </div>
            </div>

            <div className="security-grid">
              <div className="security-item">
                <ShieldCheck size={18} />
                <div>
                  <strong>KYC verification</strong>
                  <p>Identity verification required before large withdrawals are approved.</p>
                </div>
              </div>

              <div className="security-item">
                <Bitcoin size={18} />
                <div>
                  <strong>Wallet tracking</strong>
                  <p>Crypto deposits are matched against wallet addresses and transaction hashes.</p>
                </div>
              </div>

              <div className="security-item">
                <CreditCard size={18} />
                <div>
                  <strong>Secure payment flow</strong>
                  <p>Card details should be processed with a hosted payment provider such as Stripe.</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
