// components/admin/ProductForm.tsx
'use client';
import { useState, useEffect } from 'react';
import type { Product } from '../../../types/product';

export default function ProductForm({
  initial,
  onSubmit,
  categories,
}: {
  initial?: Partial<Product>;
  categories?: { id: string; name: string }[];
  onSubmit: (form: FormData) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || ''); // Changed from title to name
  const [slug, setSlug] = useState(initial?.slug || '');
  const [price, setPrice] = useState(initial?.price || 0);
  const [description, setDescription] = useState(initial?.description || '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId || '');
  const [images, setImages] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId && categories?.length) setCategoryId(categories[0].id);
  }, [categories]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', name); // Changed from title to name
    fd.append('slug', slug);
    fd.append('price', String(price));
    fd.append('description', description);
    fd.append('categoryId', categoryId);
    if (images) {
      Array.from(images).forEach((f) => fd.append('images', f));
    }
    setLoading(true);
    try {
      await onSubmit(fd);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm">Name</label> {/* Changed from Title to Name */}
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="mt-1 p-2 border rounded w-full" 
          required
        />
      </div>
      <div>
        <label className="block text-sm">Slug</label>
        <input 
          value={slug} 
          onChange={(e) => setSlug(e.target.value)} 
          className="mt-1 p-2 border rounded w-full" 
          required
        />
      </div>
      <div>
        <label className="block text-sm">Price</label>
        <input 
          type="number" 
          value={price} 
          onChange={(e) => setPrice(Number(e.target.value))} 
          className="mt-1 p-2 border rounded w-full" 
          required
          min="0"
          step="0.01"
        />
      </div>
      <div>
        <label className="block text-sm">Category</label>
        <select 
          value={categoryId} 
          onChange={(e) => setCategoryId(e.target.value)} 
          className="mt-1 p-2 border rounded w-full"
          required
        >
          <option value="">Select Category</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm">Description</label>
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          className="mt-1 p-2 border rounded w-full" 
          rows={4}
          required
        />
      </div>
      <div>
        <label className="block text-sm">Images (multiple)</label>
        <input 
          type="file" 
          multiple 
          onChange={(e) => setImages(e.target.files)} 
          className="mt-1" 
          accept="image/*"
        />
      </div>
      <div>
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}