class PasswordValidator {
    constructor() {}

    validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (!/[a-zA-Z]/.test(password)) {
            errors.push('Password must contain at least one letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        const forbiddenChars = /[!@#$%^&*(),.'"?/]/;
        if (forbiddenChars.test(password)) {
            errors.push('Password cannot contain special characters (! @ # $ % ^ & * ( ) , . \' " ? /)');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    displayPasswordError(input, errorElement, errors) {
        if (errors.length > 0) {
            input.classList.remove('valid');
            input.classList.add('invalid');
            errorElement.textContent = errors[0];
        } else {
            input.classList.remove('invalid');
            input.classList.add('valid');
            errorElement.textContent = '';
        }
    }

    validateConfirmPassword(password, confirmPassword) {
        const errors = [];
        
        if (confirmPassword && confirmPassword !== password) {
            errors.push('Passwords do not match');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}
