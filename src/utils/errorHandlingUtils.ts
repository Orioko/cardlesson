export const isAuthenticationError = (error: unknown): boolean => {
  return error instanceof Error && error.message === 'User not authenticated';
};

export const isInvalidFileFormatError = (error: unknown): boolean => {
  return error instanceof Error && error.message === 'Invalid file format: expected array of words';
};
