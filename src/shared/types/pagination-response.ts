export type PaginationResponse<T> = {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};
