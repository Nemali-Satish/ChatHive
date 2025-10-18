// Email validation
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Username validation (3-30 chars, letters/numbers/underscore/dot)
export const validateUsername = (username) => {
  const re = /^[a-z][a-z0-9_-]{2,29}$/;
  return re.test(username);
};

// Password validation
export const validatePassword = (password) => {
  return password.length >= 6;
};

// Name validation
export const validateName = (name) => {
  return name.trim().length >= 2;
};

// File validation
export const validateFile = (file, maxSize = 10 * 1024 * 1024) => {
  if (!file) return { valid: false, error: 'No file selected' };
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB' };
  }
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only images allowed' };
  }
  
  return { valid: true };
};

// Form validation
export const validateLoginForm = (identifier, password) => {
  const errors = {};
  
  if (!identifier) {
    errors.identifier = 'Username or Email is required';
  } else {
    if (identifier.includes('@')) {
      if (!validateEmail(identifier)) {
        errors.identifier = 'Invalid email format';
      }
    } else {
      if (!validateUsername(identifier)) {
        errors.identifier = 'Invalid username format';
      }
    }
  }
  
  if (!password) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateRegisterForm = (firstName, lastName, username, email, password, confirmPassword) => {
  const errors = {};
  
  if (!firstName) {
    errors.firstName = 'First name is required';
  } else if (!validateName(firstName)) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  if (lastName && !validateName(lastName)) {
    errors.lastName = 'Last name must be at least 2 characters';
  }

  if (!username) {
    errors.username = 'Username is required';
  } else if (!validateUsername(username)) {
    errors.username = 'Username must be 3-30 chars, letters/numbers/._';
  }
  
  if (!email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  } else if (!validatePassword(password)) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
