/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	testPathIgnorePatterns: [
		"/node_modules/",
		"\\.ci\\.test\\.ts$",
		"/tests/contexts/legacy/",
	],
};
