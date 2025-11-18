/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: 'node',
	testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.test.js', '**/studentVerification.test.js'],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
	setupFilesAfterEnv: [],
	verbose: true,
	forceExit: true,
};


