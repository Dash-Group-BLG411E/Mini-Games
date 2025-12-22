function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must contain at least one letter'
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }
  
  const forbiddenChars = /[!@#$%^&*(),.'"?/]/
  if (forbiddenChars.test(password)) {
    return 'Password cannot contain special characters (! @ # $ % ^ & * ( ) , . \' " ? /)'
  }
  
  return null
}

module.exports = { validatePassword }
