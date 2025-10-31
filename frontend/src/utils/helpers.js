/**
 * Format timestamp to relative time
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get urgency color classes
 */
export const getUrgencyColor = (urgency) => {
  const colors = {
    High: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    Low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  };
  return colors[urgency] || colors.Medium;
};

/**
 * Get category color classes
 */
export const getCategoryColor = (category) => {
  const colors = {
    Work: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    Personal: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    Promotion: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    Other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  };
  return colors[category] || colors.Other;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Calculate estimated time saved
 */
export const calculateTimeSaved = (emailCount) => {
  const secondsPerEmail = 54; // Average time to read an email
  const totalSeconds = emailCount * secondsPerEmail;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Format large numbers
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};