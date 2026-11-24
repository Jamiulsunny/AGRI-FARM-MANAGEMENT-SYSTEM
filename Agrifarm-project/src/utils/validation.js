export function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [year, month, day] = dateString.split('-').map(Number);
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const daysInMonth = [
    31,
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
}

export function validateAnimalRecord(record, existingRecords = [], currentId = null) {
  const errors = {};

  // Tag validation
  const tag = (record.tag || '').trim();
  if (!tag) {
    errors.tag = 'Tag number is required';
  } else if (tag.length > 50) {
    errors.tag = 'Tag must not exceed 50 characters';
  } else {
    const isDuplicate = existingRecords.some(
      (a) => a.tag.toLowerCase() === tag.toLowerCase() && a.id !== currentId
    );
    if (isDuplicate) {
      errors.tag = 'Tag must be unique across all records';
    }
  }

  // Type validation
  const type = (record.type || '').trim();
  if (!type) {
    errors.type = 'Animal type is required';
  } else if (type.length > 30) {
    errors.type = 'Type must not exceed 30 characters';
  }

  // Breed validation
  const breed = (record.breed || '').trim();
  if (!breed) {
    errors.breed = 'Breed is required';
  } else if (breed.length > 40) {
    errors.breed = 'Breed must not exceed 40 characters';
  }

  // Gender validation
  if (!['Male', 'Female'].includes(record.gender)) {
    errors.gender = 'Gender must be either Male or Female';
  }

  // Birth Date validation
  if (!record.birthDate || !isValidDate(record.birthDate)) {
    errors.birthDate = 'Please specify a valid calendar date in YYYY-MM-DD format';
  }

  // Weight validation
  const weight = Number(record.weight);
  if (isNaN(weight) || !isFinite(weight) || weight <= 0) {
    errors.weight = 'Weight must be a positive number';
  }

  // Health Status validation
  const healthStatus = (record.healthStatus || '').trim();
  if (!healthStatus) {
    errors.healthStatus = 'Health status is required';
  } else if (healthStatus.length > 30) {
    errors.healthStatus = 'Health status must not exceed 30 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}