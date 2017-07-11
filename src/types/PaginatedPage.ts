export type PaginatedPage<T> =
	{
		items: T[],
		page: number,
		maxPage: number,
		pageLength: number,
	};
