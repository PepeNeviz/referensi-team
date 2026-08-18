"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ArrowLeft, Plus, Image as ImageIcon, Loader2, UploadCloud, X, ChevronLeft, ChevronRight, Search, Download, Trash2, Pencil, Tag } from "lucide-react";

interface Reference {
  id: string;
  title: string;
  imageUrls: string[];
  tag?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [projectName, setProjectName] = useState("Loading...");
  const [references, setReferences] = useState<Reference[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("Semua");

  // State Modal Upload
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refTitle, setRefTitle] = useState("");
  const [refTag, setRefTag] = useState("UI/UX");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // State Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<Reference | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTag, setEditTag] = useState("");

  // State Gallery
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setIsLoadingAuth(false);

      if (projectId) {
        const projectDoc = await getDoc(doc(db, "projects", projectId));
        if (projectDoc.exists()) setProjectName(projectDoc.data().name);

        const q = query(
          collection(db, "references"),
          where("projectId", "==", projectId),
          orderBy("createdAt", "desc")
        );

        const unsubscribeData = onSnapshot(q, (snapshot) => {
          const refList = snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            imageUrls: doc.data().imageUrls || [],
            tag: doc.data().tag || "UI/UX",
          }));
          setReferences(refList);
        });

        return () => unsubscribeData();
      }
    });
    return () => unsubscribeAuth();
  }, [projectId, router]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refTitle.trim() || !selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      const cloudName = "msekrhyq"; 
      const uploadPreset = "referensi_preset"; 

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (data.secure_url) uploadedUrls.push(data.secure_url);
      }

      await addDoc(collection(db, "references"), {
        projectId,
        title: refTitle,
        tag: refTag,
        imageUrls: uploadedUrls,
        createdAt: serverTimestamp(),
      });

      setRefTitle("");
      setSelectedFiles(null);
      setIsModalOpen(false);
    } catch (error) {
      alert("Gagal mengupload gambar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, refId: string) => {
    e.stopPropagation();
    if (window.confirm("Yakin ingin menghapus referensi ini?")) {
      try {
        await deleteDoc(doc(db, "references", refId));
      } catch (error) {
        alert("Gagal menghapus referensi.");
      }
    }
  };

  const openEditModal = (e: React.MouseEvent, item: Reference) => {
    e.stopPropagation();
    setEditingRef(item);
    setEditTitle(item.title);
    setEditTag(item.tag || "UI/UX");
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRef || !editTitle.trim()) return;

    try {
      await updateDoc(doc(db, "references", editingRef.id), {
        title: editTitle,
        tag: editTag,
      });
      setIsEditModalOpen(false);
      setEditingRef(null);
    } catch (error) {
      alert("Gagal mengubah data.");
    }
  };

  const handleDownloadImage = async () => {
    if (!selectedRef) return;
    const imageUrl = selectedRef.imageUrls[currentImgIndex];
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${selectedRef.title}_${currentImgIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert("Gagal mendownload gambar.");
    }
  };

  // Filter Search & Tag
  const filteredReferences = references.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTagFilter === "Semua" || item.tag === selectedTagFilter;
    return matchesSearch && matchesTag;
  });

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-10">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="font-bold text-lg text-gray-900 line-clamp-1">{projectName}</h1>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Tambah Referensi</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        {/* Search & Filter Tag */}
        {references.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari judul referensi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm"
              />
            </div>
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm font-medium shadow-sm"
            >
              <option value="Semua">Semua Tag</option>
              <option value="UI/UX">UI/UX</option>
              <option value="Karakter">Karakter</option>
              <option value="Environment">Environment</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        )}

        {filteredReferences.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <ImageIcon className="w-12 h-12 mb-3 text-gray-300" />
            <p>Referensi tidak ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReferences.map((item) => (
              <div 
                key={item.id} 
                onClick={() => { setSelectedRef(item); setCurrentImgIndex(0); }}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col relative"
              >
                {/* Badge Tag */}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm z-10 text-gray-800">
                  {item.tag}
                </span>

                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {item.imageUrls[0] ? (
                    <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  ) : (
                    <div className="flex items-center justify-center h-full"><ImageIcon className="text-gray-300" /></div>
                  )}
                  {item.imageUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md font-medium">
                      +{item.imageUrls.length - 1} Gambar
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex items-start justify-between gap-2 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => openEditModal(e, item)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDelete(e, item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Gallery */}
      {selectedRef && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center animate-in fade-in" onClick={() => setSelectedRef(null)}>
          <div className="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
            <h3 className="text-white font-medium">{selectedRef.title}</h3>
            <div className="flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); handleDownloadImage(); }} className="p-2 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full" title="Download">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={() => setSelectedRef(null)} className="p-2 text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="relative w-full max-w-6xl max-h-[80vh] flex items-center justify-center p-4">
            <img src={selectedRef.imageUrls[currentImgIndex]} alt="Full view" className="max-w-full max-h-[80vh] object-contain rounded-md" onClick={(e) => e.stopPropagation()} />
          </div>
          {selectedRef.imageUrls.length > 1 && (
            <>
              {currentImgIndex > 0 && (
                <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => prev - 1); }} className="absolute left-4 md:left-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full">
                  <ChevronLeft className="w-8 h-8" />
                </button>
              )}
              {currentImgIndex < selectedRef.imageUrls.length - 1 && (
                <button onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(prev => prev + 1); }} className="absolute right-4 md:right-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full">
                  <ChevronRight className="w-8 h-8" />
                </button>
              )}
              <div className="absolute bottom-6 text-white bg-black/50 px-4 py-1.5 rounded-full text-sm font-medium">
                {currentImgIndex + 1} / {selectedRef.imageUrls.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal Edit */}
      {isEditModalOpen && editingRef && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Referensi</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400" required />
              <select value={editTag} onChange={(e) => setEditTag(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400">
                <option value="UI/UX">UI/UX</option>
                <option value="Karakter">Karakter</option>
                <option value="Environment">Environment</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-semibold text-black bg-yellow-400 rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tambah Referensi Baru</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                <input type="text" value={refTitle} onChange={(e) => setRefTitle(e.target.value)} placeholder="Contoh: Style Menu Utama..." className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori / Tag</label>
                <select value={refTag} onChange={(e) => setRefTag(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400">
                  <option value="UI/UX">UI/UX</option>
                  <option value="Karakter">Karakter</option>
                  <option value="Environment">Environment</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Gambar</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50">
                  <input type="file" multiple accept="image/*" onChange={(e) => setSelectedFiles(e.target.files)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                  <UploadCloud className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">{selectedFiles && selectedFiles.length > 0 ? `${selectedFiles.length} file dipilih` : "Klik atau seret gambar ke sini"}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl">Batal</button>
                <button type="submit" disabled={isUploading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-black bg-yellow-400 rounded-xl flex items-center justify-center gap-2">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}