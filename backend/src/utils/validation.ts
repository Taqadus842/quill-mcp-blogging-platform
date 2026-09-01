export function isValidEmail(
    email: string
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }
  
  export function isValidSlug(
    slug: string
  ) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      slug
    );
  }
  
  export function isValidPostStatus(
    status: string
  ) {
    return [
      "draft",
      "published",
      "scheduled",
    ].includes(status);
  }