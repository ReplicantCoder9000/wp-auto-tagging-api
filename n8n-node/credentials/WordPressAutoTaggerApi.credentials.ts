import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WordPressAutoTaggerApi implements ICredentialType {
	name = 'wordPressAutoTaggerApi';
	displayName = 'WordPress Auto-Tagger API';
	documentationUrl = 'https://github.com/your-org/wp-auto-tagging-api';
	properties: INodeProperties[] = [
		{
			displayName: 'WordPress Site URL',
			name: 'wpUrl',
			type: 'string',
			default: '',
			placeholder: 'https://yoursite.com',
			description: 'The full URL of your WordPress site (including https://)',
			required: true,
		},
		{
			displayName: 'WordPress Username',
			name: 'wpUsername',
			type: 'string',
			default: '',
			description: 'WordPress username for authentication',
			required: true,
		},
		{
			displayName: 'WordPress Application Password',
			name: 'wpPassword',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'WordPress Application Password (not your regular password)',
			required: true,
		},
		{
			displayName: 'API Endpoint',
			name: 'apiEndpoint',
			type: 'string',
			default: 'https://api.processfy.ai/api/auto-tag',
			description: 'WordPress Auto-Tagging API endpoint URL',
			required: true,
		},
	];

	// Test the credentials by making a simple request
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.wpUrl}}',
			url: '/wp-json/wp/v2/users/me',
			method: 'GET',
			auth: {
				username: '={{$credentials.wpUsername}}',
				password: '={{$credentials.wpPassword}}',
			},
		},
	};

	// Generate the base64 encoded auth string for the API
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			body: {
				wp_auth: '={{Buffer.from($credentials.wpUsername + ":" + $credentials.wpPassword).toString("base64")}}',
			},
		},
	};
}