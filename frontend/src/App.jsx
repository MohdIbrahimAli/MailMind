import React, { useState, useEffect } from 'react';
import { Mail, Brain, Settings, LogOut, RefreshCw, Zap, Clock, Tag, Search, Moon, Sun, Trash2, ChevronRight } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { emailAPI } from './services/api';

// ============================================
// MAIN APP COMPONENT
// ============================================

export default function MailMindApp() {
  const auth = useAuth();
  const theme = useTheme();

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={theme.darkMode ? 'dark' : ''}>
      {auth.user ? <Dashboard /> : <AuthPage />}
    </div>
  );
}

// ============================================
// AUTHENTICATION PAGE
// ============================================

function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      alert('Authentication failed: ' + error.message);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      alert('Google sign-in failed: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
            <Brain className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">MailMind</h1>
          <p className="text-indigo-100">AI-Powered Email Intelligence</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition shadow disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-600 hover:text-indigo-700 font-medium transition"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD LAYOUT
// ============================================

function Dashboard() {
  const [currentPage, setCurrentPage] = useState('inbox');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-y-auto">
        {currentPage === 'inbox' && <InboxPage />}
        {currentPage === 'summaries' && <SummariesPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

// ============================================
// SIDEBAR COMPONENT
// ============================================

function Sidebar({ currentPage, setCurrentPage }) {
  const { user, signOut } = useAuth();
  const { darkMode } = useTheme();

  const menuItems = [
    { id: 'inbox', icon: Mail, label: 'Inbox' },
    { id: 'summaries', icon: Brain, label: 'Summaries' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${darkMode ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-600 to-purple-600'} rounded-xl flex items-center justify-center`}>
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>MailMind</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition ${
                isActive
                  ? darkMode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : darkMode
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`flex items-center gap-3 mb-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {user?.displayName || 'User'}
            </p>
            <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition ${
            darkMode
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-red-50 hover:bg-red-100 text-red-600'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// ============================================
// INBOX PAGE
// ============================================

function InboxPage() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const fetchEmails = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setLoadingMessage('Connecting to backend...');
    
    try {
      // First check if backend is running
      setLoadingMessage('Checking backend status...');
      const health = await emailAPI.healthCheck();
      console.log('Backend health:', health);
      
      // Try to fetch emails from Gmail
      setLoadingMessage('Fetching emails from Gmail (this may take a minute)...');
      const response = await emailAPI.fetchEmails(user.uid, 5); // Limit to 5 emails
      
      setLoadingMessage('Processing emails with AI...');
      
      if (response.success && response.emails) {
        setEmails(response.emails);
        setLoadingMessage('');
      } else {
        setLoadingMessage('');
        setEmails(getMockEmails());
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. Gmail authentication may be needed. Check backend terminal.');
      } else if (err.response?.status === 401) {
        setError('Gmail not authorized. Please complete OAuth flow in backend terminal.');
      } else {
        setError('Unable to fetch emails. Using demo data.');
      }
      
      // Fallback to mock data
      setEmails(getMockEmails());
      setLoadingMessage('');
    } finally {
      setLoading(false);
    }
  };

  const getMockEmails = () => {
    return [
      {
        id: '1',
        from: 'john.doe@company.com',
        subject: 'Q4 Performance Review Meeting',
        body_preview: 'Hi team, I wanted to schedule our quarterly performance review...',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        summary: 'Performance review meeting scheduled for next week. Need to prepare quarterly reports and discuss team objectives.',
        urgency: 'High',
        tone: 'Formal',
        category: 'Work',
        unread: true
      },
      {
        id: '2',
        from: 'notifications@github.com',
        subject: 'New pull request on your repository',
        body_preview: 'user123 opened a pull request in your mailmind-app repository...',
        date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        summary: 'New pull request submitted with bug fixes for the email parser module. Requires code review.',
        urgency: 'Medium',
        tone: 'Neutral',
        category: 'Work',
        unread: true
      },
      {
        id: '3',
        from: 'deals@amazon.com',
        subject: '50% Off Electronics - Limited Time!',
        body_preview: "Don't miss out on our biggest electronics sale of the year...",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Promotional email advertising electronics sale with various discounts on laptops, phones, and accessories.',
        urgency: 'Low',
        tone: 'Informal',
        category: 'Promotion',
        unread: false
      }
    ];
  };

  useEffect(() => {
    fetchEmails();
  }, [user]);

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

   return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Inbox
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              {emails.length} emails found
            </p>
            {error && (
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                ⚠️ {error}
              </p>
            )}
            {loadingMessage && (
              <p className="text-blue-600 dark:text-blue-400 text-sm mt-1 animate-pulse">
                ⏳ {loadingMessage}
              </p>
            )}
          </div>
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Processing...' : 'Refresh'}
          </button>
        </div>

        <div className="relative">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails..."
            className={`w-full pl-12 pr-4 py-3 ${
              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
            } border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEmails.map((email) => (
            <EmailCard key={email.id} email={email} />
          ))}
        </div>
      )}
    </div>
    
  );
}

// ============================================
// EMAIL CARD COMPONENT
// ============================================

function EmailCard({ email }) {
  const { darkMode } = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Define color mappings BEFORE using them
  const urgencyColors = {
    High: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    Low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  };

  const categoryColors = {
    Work: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    Personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    Promotion: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    Other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Handle both 'preview' and 'body_preview' from different data sources
  const preview = email.preview || email.body_preview || '';
  const timestamp = email.timestamp || email.date;

  return (
    <div
      className={`${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border rounded-2xl p-6 hover:shadow-xl transition cursor-pointer ${
        email.unread ? 'border-l-4 border-l-indigo-600' : ''
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {email.from[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {email.from}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatTime(timestamp)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${urgencyColors[email.urgency]}`}>
                {email.urgency}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[email.category]}`}>
                {email.category}
              </span>
            </div>
          </div>

          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {email.subject}
          </h3>

          {!expanded ? (
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
              {preview}
            </p>
          ) : (
            <div className={`mt-4 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
              <div className="flex items-start gap-2 mb-3">
                <Brain className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <p className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    AI Summary
                  </p>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {email.summary}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Tone: {email.tone}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'} transition ${expanded ? 'rotate-90' : ''}`} />
      </div>
    </div>
  );
}
// ============================================
// SUMMARIES PAGE
// ============================================

function SummariesPage() {
  const { darkMode } = useTheme();

  const stats = [
    { label: 'Total Emails', value: '1,247', icon: Mail, color: 'from-blue-500 to-cyan-500' },
    { label: 'Summarized', value: '1,189', icon: Brain, color: 'from-purple-500 to-pink-500' },
    { label: 'High Urgency', value: '23', icon: Zap, color: 'from-red-500 to-orange-500' },
    { label: 'Saved Time', value: '18h', icon: Clock, color: 'from-green-500 to-emerald-500' }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Email Summaries
        </h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
          Your AI-powered email insights
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-2xl p-6 shadow-lg hover:shadow-xl transition`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                {stat.value}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>
          Email Categories
        </h2>
        <div className="space-y-4">
          {[
            { name: 'Work', count: 687, color: 'bg-blue-500', percentage: 55 },
            { name: 'Personal', count: 312, color: 'bg-purple-500', percentage: 25 },
            { name: 'Promotions', count: 190, color: 'bg-pink-500', percentage: 15 },
            { name: 'Other', count: 58, color: 'bg-gray-500', percentage: 5 }
          ].map((category, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {category.name}
                </span>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {category.count} emails
                </span>
              </div>
              <div className={`h-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                <div
                  className={`h-full ${category.color} rounded-full transition-all duration-500`}
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SETTINGS PAGE
// ============================================

function SettingsPage() {
  const { darkMode, setDarkMode } = useTheme();
  const [summaryLength, setSummaryLength] = useState('Medium');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all saved summaries? This cannot be undone.')) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleSaveSettings = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Settings
        </h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
          Customize your MailMind experience
        </p>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-green-800 dark:text-green-200 font-medium">
            Settings saved successfully!
          </span>
        </div>
      )}

      <div className="space-y-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
            Appearance
          </h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Dark Mode
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Toggle between light and dark theme
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-14 h-8 rounded-full transition ${
                darkMode ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-0'
                } flex items-center justify-center`}
              >
                {darkMode ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-yellow-500" />}
              </div>
            </button>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
            Summary Preferences
          </h2>
          
          <div>
            <label className={`block font-medium ${darkMode ? 'text-white' : 'text-gray-800'} mb-3`}>
              Summary Length
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Short', 'Medium', 'Detailed'].map((option) => (
                <button
                  key={option}
                  onClick={() => setSummaryLength(option)}
                  className={`px-4 py-3 rounded-xl font-medium transition ${
                    summaryLength === option
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-3`}>
              {summaryLength === 'Short' && 'Concise 1-2 sentence summaries'}
              {summaryLength === 'Medium' && 'Balanced 2-3 sentence summaries'}
              {summaryLength === 'Detailed' && 'Comprehensive 3-4 sentence summaries'}
            </p>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
            Email Integration
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Gmail Connected
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Last synced: 2 minutes ago
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Disconnect
              </button>
            </div>

            <button className={`w-full px-4 py-3 border-2 border-dashed rounded-xl font-medium transition ${
              darkMode
                ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
            }`}>
              + Connect Another Account
            </button>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
            Data Management
          </h2>
          
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Clear All Summaries
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Remove all saved email summaries and analytics
              </p>
            </div>
            <button
              onClick={handleClearData}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-800 transition"
            >
              <Trash2 className="w-4 h-4" />
              Clear Data
            </button>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}