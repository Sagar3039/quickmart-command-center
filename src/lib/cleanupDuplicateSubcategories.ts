import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';

type SubcatDoc = {
  id: string;
  category: string;
  name: string;
  displayName?: string;
  icon?: string;
  createdAt?: any;
  updatedAt?: any;
};

export async function cleanupDuplicateSubcategories() {
  console.log('Starting duplicate subcategory cleanup...');
  
  const snapshot = await getDocs(collection(db, 'categories'));
  const all: SubcatDoc[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  console.log(`Found ${all.length} total subcategories`);

  // Group by category+name (case-insensitive)
  const map = new Map<string, SubcatDoc[]>();
  for (const subcat of all) {
    if (!subcat.category || !subcat.name) {
      console.log(`Skipping invalid subcategory: ${JSON.stringify(subcat)}`);
      continue;
    }
    const key = `${subcat.category.toLowerCase()}|${subcat.name.toLowerCase()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(subcat);
  }

  let totalDeleted = 0;
  const batch = writeBatch(db);

  for (const [key, group] of map.entries()) {
    if (group.length > 1) {
      console.log(`Found ${group.length} duplicates for key: ${key}`);
      
      // Sort by updatedAt (or createdAt) descending, keep the newest
      group.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.updatedAt || a.createdAt?.toMillis?.() || a.createdAt || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.updatedAt || b.createdAt?.toMillis?.() || b.createdAt || 0;
        return bTime - aTime;
      });
      
      const [keep, ...toDelete] = group;
      console.log(`Keeping: ${keep.category} - ${keep.name} (id: ${keep.id})`);
      
      for (const del of toDelete) {
        console.log(`Marking for deletion: ${del.category} - ${del.name} (id: ${del.id})`);
        batch.delete(doc(db, 'categories', del.id));
        totalDeleted++;
      }
    }
  }

  if (totalDeleted > 0) {
    console.log(`Committing batch deletion of ${totalDeleted} duplicate subcategories...`);
    await batch.commit();
    console.log(`Successfully deleted ${totalDeleted} duplicate subcategories.`);
  } else {
    console.log('No duplicate subcategories found.');
  }
  
  console.log('Cleanup complete.');
  return totalDeleted;
} 