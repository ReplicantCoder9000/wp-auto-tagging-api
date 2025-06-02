# WordPress Auto-Tagger n8n Node Package Contents

This document provides an overview of all files included in the n8n custom node package.

## Package Structure

```
n8n-node/
├── package.json                           # Node package configuration
├── tsconfig.json                          # TypeScript configuration
├── gulpfile.js                           # Build configuration for icons
├── .eslintrc.js                          # ESLint configuration
├── .gitignore                            # Git ignore rules
├── README.md                             # Main documentation
├── INSTALLATION.md                       # Installation guide
├── LICENSE.md                            # MIT license
├── PACKAGE_CONTENTS.md                   # This file
├── credentials/
│   └── WordPressAutoTaggerApi.credentials.ts  # API credentials handling
├── nodes/
│   └── WordPressAutoTagger/
│       ├── WordPressAutoTagger.node.ts   # Main node implementation
│       ├── WordPressAutoTagger.node.json # Node definition
│       └── wordpressAutoTagger.svg       # Node icon (if created)
└── examples/
    └── basic-workflow.json               # Example n8n workflow
```

## Core Files

### package.json
- **Purpose**: Defines the npm package with dependencies and n8n configuration
- **Key Features**: 
  - n8n community node package setup
  - TypeScript build configuration
  - Proper peer dependencies for n8n-workflow

### tsconfig.json
- **Purpose**: TypeScript compiler configuration
- **Features**: ES2019 target, CommonJS modules, strict type checking

### Credentials File
**File**: `credentials/WordPressAutoTaggerApi.credentials.ts`
- **Purpose**: Handles secure storage and validation of API credentials
- **Features**:
  - WordPress site URL validation
  - Application password secure storage
  - Credential testing functionality
  - Base64 encoding for API authentication

### Main Node Implementation
**File**: `nodes/WordPressAutoTagger/WordPressAutoTagger.node.ts`
- **Purpose**: Core node functionality and API integration
- **Features**:
  - Complete API parameter support
  - Input validation and error handling
  - Sports context support
  - Advanced configuration options
  - Comprehensive error messages

### Node Definition
**File**: `nodes/WordPressAutoTagger/WordPressAutoTagger.node.json`
- **Purpose**: n8n node metadata and categorization
- **Features**: Proper categorization and documentation links

## Configuration Files

### .eslintrc.js
- **Purpose**: Code quality and n8n standards enforcement
- **Features**: n8n-specific linting rules and TypeScript support

### gulpfile.js
- **Purpose**: Build process for copying icons and assets
- **Features**: Automated icon copying to dist folder

### .gitignore
- **Purpose**: Excludes build artifacts and dependencies from version control
- **Features**: Standard Node.js and TypeScript exclusions

## Documentation

### README.md
- **Purpose**: Comprehensive user documentation
- **Sections**:
  - Installation instructions
  - Configuration guide
  - Usage examples
  - API reference
  - Troubleshooting
  - Error handling

### INSTALLATION.md
- **Purpose**: Detailed installation guide
- **Sections**:
  - Multiple installation methods
  - WordPress setup instructions
  - Credential configuration
  - Troubleshooting guide

### LICENSE.md
- **Purpose**: MIT license for open source distribution

## Examples

### basic-workflow.json
- **Purpose**: Example n8n workflow demonstrating node usage
- **Features**:
  - Scheduled execution
  - WordPress post fetching
  - Filtering untagged posts
  - Auto-tagging integration

## Node Features

### Supported Operations
- **Auto-Tag Post**: Generate and assign AI-powered tags

### Input Parameters
- **Required**: Post ID
- **Optional**: Title, Content, Sports Context
- **Advanced**: Force Processing, Timeout settings

### Sports Context Support
- League name
- Home team
- Away team

### Error Handling
- Comprehensive validation
- User-friendly error messages
- Detailed debugging information
- Continue-on-fail support

### Output Format
- Success/failure status
- Assigned tags array
- Tag IDs
- Processing metrics
- Request tracking

## Build Process

### Development
```bash
npm run dev          # Watch mode compilation
npm run lint         # Code quality checks
npm run format       # Code formatting
```

### Production
```bash
npm run build        # Full build with icons
npm run prepublishOnly  # Pre-publish validation
```

### Installation Requirements
- **Node.js**: >= 18.10
- **n8n**: Compatible with n8n workflow engine
- **TypeScript**: For development and building

## Integration Points

### WordPress API
- REST API v2 compatibility
- Application Password authentication
- Post and tag management

### Auto-Tagging API
- ProcessFy.ai API integration
- Rate limiting awareness
- Error handling and retries

### n8n Ecosystem
- Standard node interface
- Credential management
- Workflow integration
- Community node standards

## Security Features

### Credential Protection
- Secure password storage
- Base64 encoding
- No plain text credentials in logs

### Input Validation
- Parameter type checking
- Required field validation
- URL format validation

### Error Handling
- No sensitive data in error messages
- Request ID tracking for support
- Graceful failure modes

## Performance Considerations

### API Efficiency
- Configurable timeouts
- Rate limit awareness
- Minimal data transfer

### Resource Usage
- Lightweight implementation
- Efficient memory usage
- Proper async handling

This package provides a complete, production-ready n8n custom node for WordPress Auto-Tagging API integration with comprehensive documentation, examples, and best practices.