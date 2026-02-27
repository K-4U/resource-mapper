// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

console.log('Adding virtual:mapper-data module declaration');
declare global {
	declare module 'virtual:mapper-data' {
		import type {GroupInfo, GroupConnection, ServiceDefinition, ExternalGroupServices, Team} from '$shared/types';

		const bakedData: {
			groups: Record<string, GroupInfo>;
			services: Record<string, ServiceDefinition>;
			teams: Record<string, Team>;
			groupConnections: GroupConnection[];
			servicesByGroup: Record<string, ServiceDefinition[]>;
			externalServices: Record<string, ExternalGroupServices[]>;
			generatedAt: Date
		}
		export default bakedData;
	}
}

export {};
