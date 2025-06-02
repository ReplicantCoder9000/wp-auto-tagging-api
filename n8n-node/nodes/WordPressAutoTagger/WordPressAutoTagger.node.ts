import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class WordPressAutoTagger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WordPress Auto-Tagger',
		name: 'wordPressAutoTagger',
		icon: 'file:wordpressAutoTagger.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Automatically generate and assign AI-powered tags to WordPress posts',
		defaults: {
			name: 'WordPress Auto-Tagger',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'wordPressAutoTaggerApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Auto-Tag Post',
						value: 'autoTag',
						description: 'Generate and assign AI-powered tags to a WordPress post',
						action: 'Auto-tag a WordPress post',
					},
				],
				default: 'autoTag',
			},
			{
				displayName: 'Post ID',
				name: 'postId',
				type: 'number',
				default: 0,
				placeholder: '123',
				description: 'WordPress post ID to auto-tag',
				required: true,
				displayOptions: {
					show: {
						operation: ['autoTag'],
					},
				},
			},
			{
				displayName: 'Post Title',
				name: 'title',
				type: 'string',
				default: '',
				placeholder: 'Enter post title for better AI context',
				description: 'Post title to provide context for AI tagging (optional but recommended)',
				displayOptions: {
					show: {
						operation: ['autoTag'],
					},
				},
			},
			{
				displayName: 'Post Content',
				name: 'content',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				placeholder: 'Enter post content for AI analysis',
				description: 'Post content to analyze for tag generation (optional but recommended)',
				displayOptions: {
					show: {
						operation: ['autoTag'],
					},
				},
			},
			{
				displayName: 'Sports Context',
				name: 'sportsContext',
				type: 'collection',
				placeholder: 'Add Sports Context',
				default: {},
				description: 'Additional sports-related context for better tagging',
				options: [
					{
						displayName: 'League',
						name: 'league',
						type: 'string',
						default: '',
						placeholder: 'Premier League, NBA, NFL, etc.',
						description: 'Sports league name for context',
					},
					{
						displayName: 'Home Team',
						name: 'homeTeam',
						type: 'string',
						default: '',
						placeholder: 'Arsenal, Lakers, etc.',
						description: 'Home team name',
					},
					{
						displayName: 'Away Team',
						name: 'awayTeam',
						type: 'string',
						default: '',
						placeholder: 'Chelsea, Warriors, etc.',
						description: 'Away team name',
					},
				],
				displayOptions: {
					show: {
						operation: ['autoTag'],
					},
				},
			},
			{
				displayName: 'Advanced Options',
				name: 'advancedOptions',
				type: 'collection',
				placeholder: 'Add Advanced Option',
				default: {},
				options: [
					{
						displayName: 'Force Processing',
						name: 'forceProcessing',
						type: 'boolean',
						default: false,
						description: 'Whether to force processing even if post already has tags',
					},
					{
						displayName: 'Timeout (seconds)',
						name: 'timeout',
						type: 'number',
						default: 30,
						description: 'Request timeout in seconds',
						typeOptions: {
							minValue: 5,
							maxValue: 120,
						},
					},
				],
				displayOptions: {
					show: {
						operation: ['autoTag'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'autoTag') {
					const credentials = await this.getCredentials('wordPressAutoTaggerApi');
					
					// Get parameters
					const postId = this.getNodeParameter('postId', i) as number;
					const title = this.getNodeParameter('title', i, '') as string;
					const content = this.getNodeParameter('content', i, '') as string;
					const sportsContext = this.getNodeParameter('sportsContext', i, {}) as any;
					const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as any;

					// Validate required fields
					if (!postId || postId <= 0) {
						throw new NodeOperationError(this.getNode(), 'Post ID is required and must be a positive number', {
							itemIndex: i,
						});
					}

					// Build request payload
					const requestBody: any = {
						wp_url: credentials.wpUrl,
						wp_auth: Buffer.from(`${credentials.wpUsername}:${credentials.wpPassword}`).toString('base64'),
						post_id: postId,
						is_live: 'yes',
						tags: advancedOptions.forceProcessing ? null : '',
					};

					// Add optional fields
					if (title) {
						requestBody.title = title;
					}
					if (content) {
						requestBody.content = content;
					}
					if (sportsContext.league) {
						requestBody.league = sportsContext.league;
					}
					if (sportsContext.homeTeam) {
						requestBody.home_team = sportsContext.homeTeam;
					}
					if (sportsContext.awayTeam) {
						requestBody.away_team = sportsContext.awayTeam;
					}

					// Make API request
					const timeout = (advancedOptions.timeout || 30) * 1000;
					const response = await this.helpers.request({
						method: 'POST',
						url: credentials.apiEndpoint as string,
						body: requestBody,
						json: true,
						timeout,
						headers: {
							'Content-Type': 'application/json',
							'User-Agent': 'n8n-wordpress-auto-tagger/1.0.0',
						},
					});

					// Handle response
					if (response.status === 'success') {
						returnData.push({
							json: {
								success: true,
								postId: response.post_id,
								assignedTags: response.assigned_tags || [],
								tagIds: response.tag_ids || [],
								createdTags: response.created_tags || [],
								processingTimeMs: response.processing_time_ms || 0,
								requestId: response.request_id || '',
								timestamp: new Date().toISOString(),
							},
							pairedItem: {
								item: i,
							},
						});
					} else {
						// Handle API error response
						throw new NodeOperationError(this.getNode(), 
							`API Error: ${response.message || 'Unknown error'}`, {
							itemIndex: i,
							description: `Error Code: ${response.error_code || 'UNKNOWN'}\nRequest ID: ${response.request_id || 'N/A'}`,
						});
					}
				}
			} catch (error) {
				// Handle network or other errors
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: error.message,
							postId: this.getNodeParameter('postId', i, 0),
							timestamp: new Date().toISOString(),
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}