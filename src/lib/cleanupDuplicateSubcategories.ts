import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

type SubcatDoc = {
  id: string;
  category: string;
  name: string;
  createdAt?: any;
  updatedAt?: any;
};

async function cleanupDuplicateSubcategories() {
  const snapshot = await getDocs(collection(db, 'categories'));
  const all: SubcatDoc[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

  // Group by category+name (case-insensitive)
  const map = new Map<string, SubcatDoc[]>();
  for (const subcat of all) {
    if (!subcat.category || !subcat.name) continue;
    const key = `${subcat.category.toLowerCase()}|${subcat.name.toLowerCase()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(subcat);
  }

  let totalDeleted = 0;
  for (const [key, group] of map.entries()) {
    if (group.length > 1) {
      // Sort by updatedAt (or createdAt) descending, keep the newest
      group.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || a.updatedAt || a.createdAt?.toMillis?.() || a.createdAt || 0;
        const bTime = b.updatedAt?.toMillis?.() || b.updatedAt || b.createdAt?.toMillis?.() || b.createdAt || 0;
        return bTime - aTime;
      });
      const [keep, ...toDelete] = group;
      console.log(`Keeping: ${keep.category} - ${keep.name} (id: ${keep.id})`);
      for (const del of toDelete) {
        await deleteDoc(doc(db, 'categories', del.id));
        console.log(`Deleted duplicate: ${del.category} - ${del.name} (id: ${del.id})`);
        totalDeleted++;
      }
    }
  }
  console.log(`Cleanup complete. Deleted ${totalDeleted} duplicate subcategories.`);
}

cleanupDuplicateSubcategories().then(() => process.exit(0)); 