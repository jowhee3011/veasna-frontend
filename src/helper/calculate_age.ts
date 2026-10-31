/**
 * Whole years elapsed since a date of birth.
 *
 * The single implementation for the whole app: age appears on the queue, the
 * patient list, the record page and referral exports, and those must agree.
 * Counting calendar years (rather than dividing elapsed milliseconds by 365.25
 * days, as one earlier copy did) is what keeps them consistent on and around a
 * patient's birthday.
 *
 * Returns null when the date is missing or unparseable, so callers choose their
 * own placeholder.
 */
export function calculateAge(dateOfBirth?: string | Date | null): number | null {
  if (!dateOfBirth) return null;

  const birthDate = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  const years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const beforeBirthday =
    monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate());

  const age = beforeBirthday ? years - 1 : years;
  return age >= 0 ? age : null;
}

export default calculateAge;
