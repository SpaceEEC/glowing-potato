import { UrbanDefinition } from './UrbanDefinition';

export type UrbanResponse = {
	tags: string[];
	result_type: string;
	list: UrbanDefinition[];
	sounds: string[];
};
