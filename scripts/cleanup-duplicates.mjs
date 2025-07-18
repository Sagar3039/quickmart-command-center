import { cleanupDuplicateSubcategories } from '../src/lib/cleanupDuplicateSubcategories.ts';

async function runCleanup() {
  try {
    console.log('Starting duplicate subcategory cleanup...');
    await cleanupDuplicateSubcategories();
    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

runCleanup(); 