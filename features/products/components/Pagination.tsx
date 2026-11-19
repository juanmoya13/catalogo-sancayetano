export function Pagination({
  isLoading,
  onPageChange,
  page,
  totalPages,
}: {
  isLoading: boolean;
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="catalog-pagination" aria-label="Paginación del catálogo">
      <button
        className="catalog-button"
        disabled={page <= 1 || isLoading}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        Página anterior
      </button>

      <span className="catalog-pagination__count">
        Página {page} de {totalPages}
      </span>

      <button
        className="catalog-button"
        disabled={page >= totalPages || isLoading}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        Página siguiente
      </button>
    </nav>
  );
}
