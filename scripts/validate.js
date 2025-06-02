/**
 * WordPress Auto-Tagging API Validation Script
 * This script performs basic validation of the worker code
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 WordPress Auto-Tagging API Validation');
console.log('=========================================');

// Check if required files exist
const requiredFiles = [
  'src/index.js',
  'wrangler.toml',
  'package.json',
  '.env.example',
  'README.md'
];

console.log('\n📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Validate worker code structure
console.log('\n🔧 Validating worker code structure...');

const workerCode = fs.readFileSync('src/index.js', 'utf8');

const requiredFunctions = [
  'handleRequest',
  'validateInput',
  'fetchWordPressTags',
  'generateTagsWithAI',
  'processAndAssignTags',
  'handleError',
  'logToGoogleSheets'
];

const requiredConstants = [
  'CIRCUIT_BREAKER_THRESHOLD',
  'CIRCUIT_BREAKER_TIMEOUT',
  'MAX_RETRY_DELAY',
  'INITIAL_RETRY_DELAY',
  'CACHE_TTL'
];

console.log('\n🔍 Checking required functions...');
requiredFunctions.forEach(func => {
  if (workerCode.includes(`function ${func}`) || workerCode.includes(`async function ${func}`)) {
    console.log(`✅ ${func}()`);
  } else {
    console.log(`❌ ${func}() - MISSING`);
  }
});

console.log('\n🔍 Checking required constants...');
requiredConstants.forEach(constant => {
  if (workerCode.includes(constant)) {
    console.log(`✅ ${constant}`);
  } else {
    console.log(`❌ ${constant} - MISSING`);
  }
});

// Validate architectural layers
console.log('\n🏗️  Checking architectural layers...');
const layers = [
  { name: 'Layer 1: Input Validation', pattern: 'validateInput' },
  { name: 'Layer 2: WordPress Integration', pattern: 'fetchWordPressTags' },
  { name: 'Layer 3: AI Processing', pattern: 'generateTagsWithAI' },
  { name: 'Layer 4: Tag Management', pattern: 'processAndAssignTags' },
  { name: 'Layer 5: Error Handling', pattern: 'handleError' },
  { name: 'Layer 6: Google Sheets Integration', pattern: 'logToGoogleSheets' }
];

layers.forEach(layer => {
  if (workerCode.includes(layer.pattern)) {
    console.log(`✅ ${layer.name}`);
  } else {
    console.log(`❌ ${layer.name} - MISSING`);
  }
});

// Check circuit breaker implementation
console.log('\n⚡ Checking circuit breaker implementation...');
const circuitBreakerFeatures = [
  'circuitBreakerState',
  'isCircuitBreakerOpen',
  'recordCircuitBreakerFailure',
  'openCircuitBreaker',
  'resetCircuitBreaker'
];

circuitBreakerFeatures.forEach(feature => {
  if (workerCode.includes(feature)) {
    console.log(`✅ ${feature}`);
  } else {
    console.log(`❌ ${feature} - MISSING`);
  }
});

// Check retry logic
console.log('\n🔄 Checking retry logic...');
const retryFeatures = [
  'exponential backoff',
  'jitter',
  'sleep(',
  'retryCount'
];

retryFeatures.forEach(feature => {
  if (workerCode.toLowerCase().includes(feature.toLowerCase())) {
    console.log(`✅ ${feature}`);
  } else {
    console.log(`❌ ${feature} - MISSING`);
  }
});

// Validate wrangler.toml
console.log('\n⚙️  Validating wrangler.toml...');
const wranglerConfig = fs.readFileSync('wrangler.toml', 'utf8');

const wranglerRequirements = [
  'name = "wp-auto-tagging-api"',
  'main = "src/index.js"',
  'compatibility_date',
  '[vars]',
  '[env.development]',
  '[env.staging]'
];

wranglerRequirements.forEach(req => {
  if (wranglerConfig.includes(req)) {
    console.log(`✅ ${req}`);
  } else {
    console.log(`❌ ${req} - MISSING`);
  }
});

// Validate package.json
console.log('\n📦 Validating package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredScripts = ['dev', 'deploy', 'deploy:staging', 'deploy:production'];
const requiredDevDeps = ['wrangler', '@cloudflare/workers-types'];

console.log('\n🔍 Checking npm scripts...');
requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ ${script}`);
  } else {
    console.log(`❌ ${script} - MISSING`);
  }
});

console.log('\n🔍 Checking dev dependencies...');
requiredDevDeps.forEach(dep => {
  if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
  }
});

// Check environment template
console.log('\n🌍 Validating .env.example...');
const envExample = fs.readFileSync('.env.example', 'utf8');

const requiredEnvVars = [
  'CHATWITH_API_KEY',
  'CHATWITH_CHATBOT_ID',
  'GOOGLE_SHEETS_API_KEY',
  'GOOGLE_SHEETS_ID'
];

requiredEnvVars.forEach(envVar => {
  if (envExample.includes(envVar)) {
    console.log(`✅ ${envVar}`);
  } else {
    console.log(`❌ ${envVar} - MISSING`);
  }
});

// Final validation summary
console.log('\n📋 Validation Summary');
console.log('====================');

const codeSize = workerCode.length;
const functionCount = (workerCode.match(/function /g) || []).length;
const asyncFunctionCount = (workerCode.match(/async function /g) || []).length;

console.log(`📊 Code Statistics:`);
console.log(`- Total code size: ${codeSize} characters`);
console.log(`- Function count: ${functionCount}`);
console.log(`- Async function count: ${asyncFunctionCount}`);

// Check for potential issues
console.log('\n⚠️  Potential Issues Check:');

if (workerCode.includes('console.log')) {
  console.log('⚠️  Found console.log statements (consider removing for production)');
}

if (!workerCode.includes('addEventListener')) {
  console.log('❌ Missing addEventListener for fetch events');
}

if (!workerCode.includes('event.respondWith')) {
  console.log('❌ Missing event.respondWith in main handler');
}

if (workerCode.includes('TODO') || workerCode.includes('FIXME')) {
  console.log('⚠️  Found TODO/FIXME comments');
}

console.log('\n✅ Validation completed!');
console.log('\n🚀 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: ./scripts/deploy.sh');
console.log('3. Test with: ./scripts/test-api.sh');
console.log('4. Monitor with: wrangler tail');