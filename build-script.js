const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Checking installation requirements...');

// Check if node_modules exists
if (!fs.existsSync('./node_modules')) {
  console.log('❌ node_modules not found. Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}

// Check if react-native-purchases is installed
try {
  require('react-native-purchases');
  console.log('✅ react-native-purchases is installed');
} catch (error) {
  console.log('❌ react-native-purchases not found. Installing...');
  execSync('npx expo install react-native-purchases', { stdio: 'inherit' });
}

// Check TypeScript compilation
console.log('🔍 Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation passed');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  process.exit(1);
}

console.log('🚀 All checks passed! Ready to build.');
console.log('📱 Run: eas build --platform android --profile preview');