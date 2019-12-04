const { merge } = require("lodash");
const getQueryBuilder = require("./query-builder");
const { serializeCursor } = require("./lib/serialize");

const mixin = options => {
	options = merge(
		{
			limit: 50,
			pageInfo: {
				total: true,
				remaining: true,
				remainingBefore: false,
				remainingAfter: false,
				hasNext: true,
				hasPrevious: true
			}
		},
		options
	);

	return Base => {
		const CursorQueryBuilder = modifyCursorQueryBuilder(
			getQueryBuilder(options, Base)
		);

		return class extends Base {
			static get QueryBuilder() {
				return CursorQueryBuilder;
			}
		};
	};
};

const modifyCursorQueryBuilder = CursorQueryBuilder => {
	return class extends CursorQueryBuilder {
		async cursorPage(cursor, before = false) {
			const { results, pageInfo } = await super.cursorPage(cursor, before);

			const cursorPaginationResult = {
				edges: [],
				nodes: [],
				pageInfo: {
					startCursor: null,
					hasNextPage: false,
					hasPreviousPage: false,
					endCursor: null
				},
				totalCount: 0
			};

			const orderByOps = super._getOrderByOperations(before);

			// Handle edges
			cursorPaginationResult.edges = results.map(result => ({
				cursor: serializeCursor(orderByOps, result),
				node: result
			}));

			// Handle nodes
			cursorPaginationResult.nodes = results;

			// Handle pageInfo
			cursorPaginationResult.pageInfo = {
				endCursor: pageInfo.next,
				startCursor: pageInfo.previous,
				hasNextPage: pageInfo.hasNext,
				hasPreviousPage: pageInfo.hasPrevious
			};

			// Handle totalCount
			cursorPaginationResult.totalCount = pageInfo.total;
		}
	};
};

module.exports = (options = {}) => {
	if (typeof options === "function") {
		return mixin({})(options);
	}

	return mixin(options);
};
