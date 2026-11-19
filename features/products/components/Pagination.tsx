import Link from "next/link";

export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="catalog-pagination" aria-label="Paginación del catálogo">
      {page > 1 ? (
        <Link className="catalog-button" href={`/?page=${page - 1}`}>
          Página anterior
        </Link>
      ) : (
        <span aria-disabled="true" className="catalog-button catalog-button--disabled">
          Página anterior
        </span>
      )}

      <span className="catalog-pagination__count">
        Página {page} de {totalPages}
      </span>

      {page < totalPages ? (
        <Link className="catalog-button" href={`/?page=${page + 1}`}>
          Página siguiente
        </Link>
      ) : (
        <span aria-disabled="true" className="catalog-button catalog-button--disabled">
          Página siguiente
        </span>
      )}
    </nav>
  );
}
