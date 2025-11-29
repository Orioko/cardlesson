export interface PaginationState {
  first: number;
  rows: number;
}

export const calculateAdjustedFirst = (first: number, totalRecords: number): number => {
  if (first >= totalRecords && totalRecords > 0) {
    return 0;
  }
  return first;
};

export const getPaginatedItems = <T>(items: T[], first: number, rows: number): T[] => {
  const adjustedFirst = calculateAdjustedFirst(first, items.length);
  return items.slice(adjustedFirst, adjustedFirst + rows);
};

export const handlePageChange = (
  event: { first: number; rows: number },
  totalRecords: number
): PaginationState => {
  const newFirst = event.first >= totalRecords && totalRecords > 0 ? 0 : event.first;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return {
    first: newFirst,
    rows: event.rows,
  };
};

export const adjustPaginationAfterDelete = (
  currentFirst: number,
  currentRows: number,
  totalRecords: number
): number => {
  if (currentFirst >= totalRecords - 1) {
    return Math.max(0, currentFirst - currentRows);
  }
  return currentFirst;
};

export const adjustPaginationAfterAdd = (currentFirst: number, totalRecords: number): number => {
  if (currentFirst >= totalRecords) {
    return 0;
  }
  return currentFirst;
};
