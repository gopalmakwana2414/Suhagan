"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully!");
      setShowForm(false);
      setImageFile(null);
      setImagePreview(null);
      setForm({ name: "", slug: "", description: "" });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.put(`/categories/${editingCategory._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully!");
      setShowForm(false);
      setEditingCategory(null);
      setImageFile(null);
      setImagePreview(null);
      setForm({ name: "", slug: "", description: "" });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    if (form.slug.trim()) {
      formData.append("slug", form.slug.trim());
    }
    if (imageFile) {
      formData.append("image", imageFile);
    }

    if (editingCategory) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#b8860b]">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Manage saree categories</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCategory(null);
            setImageFile(null);
            setImagePreview(null);
            setForm({ name: "", slug: "", description: "" });
          }}
          className="flex items-center gap-2 bg-[#d4af37] text-white px-4 py-2 rounded-xl hover:bg-[#b8860b] transition"
          suppressHydrationWarning
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold">
              {editingCategory ? "Edit Category" : "New Category"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingCategory(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Category Image (Optional)
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl h-36 cursor-pointer hover:border-[#d4af37] transition overflow-hidden relative bg-gray-50">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <ImageIcon size={24} className="mx-auto mb-2" />
                    <p className="text-xs">Click to upload category image</p>
                  </div>
                )}
                {imagePreview && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    Change image
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Banarasi Silk"
                  className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Slug (Auto-generated if empty)
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. banarasi-silk"
                  className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] transition font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
                className="w-full border p-3 rounded-xl outline-none focus:border-[#d4af37] transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#d4af37] text-white px-6 py-2.5 rounded-xl hover:bg-[#b8860b] transition disabled:opacity-60"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Category"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                }}
                className="border px-6 py-2.5 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No categories yet. Add your first category above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">Image</th>
                <th className="p-4">Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Description</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat: any, index: number) => (
                <tr key={cat._id} className="border-t hover:bg-gray-50">
                  <td className="p-4 text-gray-400">{index + 1}</td>
                  <td className="p-4">
                    {cat.image ? (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No Img
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-semibold">{cat.name}</td>
                  <td className="p-4 text-gray-500 font-mono text-xs">
                    {cat.slug}
                  </td>
                  <td className="p-4 text-gray-500">
                    {cat.description || "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setImageFile(null);
                          setImagePreview(cat.image || null);
                          setForm({
                            name: cat.name || "",
                            slug: cat.slug || "",
                            description: cat.description || "",
                          });
                          setShowForm(true);
                        }}
                        className="text-[#d4af37] hover:text-[#b8860b] transition"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(cat._id);
                        }}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-3">Delete Category?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently delete this category. Products assigned to
              this category may be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl hover:bg-red-600 transition disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border py-2.5 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
