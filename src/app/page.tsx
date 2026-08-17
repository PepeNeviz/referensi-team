"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
// Tambahan deleteDoc, updateDoc, doc
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
// Tambahan icon Pencil dan Trash2
import { Plus, Folder, LogOut, Loader2, Pencil, Trash2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // State Modal Create Project
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // State Modal Edit Project
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setIsLoadingAuth(false);
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const unsubscribeData = onSnapshot(q, (snapshot) => {
          const projectList = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
          }));
          setProjects(projectList);
        });
        return () => unsubscribeData();
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // === FITUR BUAT PROJECT ===
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      await addDoc(collection(db, "projects"), {
        name: newProjectName,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewProjectName("");
    } catch (error) {
      alert("Gagal membuat project.");
    } finally {
      setIsCreating(false);
    }
  };

  // === FITUR HAPUS PROJECT ===
  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Mencegah klik masuk ke halaman detail
    const confirmDelete = window.confirm("Yakin ingin menghapus project ini? Semua referensi di dalamnya tidak akan ikut terhapus dari database namun project ini akan hilang.");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
      } catch (error) {
        alert("Gagal menghapus project.");
      }
    }
  };

  // === FITUR EDIT PROJECT ===
  const openEditModal = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditProjectName(project.name);
    setIsEditModalOpen(true);
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editProjectName.trim()) return;

    try {
      await updateDoc(doc(db, "projects", editingProject.id), {
        name: editProjectName,
      });
      setIsEditModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      alert("Gagal mengubah nama project.");
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-10">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-1.5 rounded-md">
              <Folder className="w-5 h-5 text-black" />
            </div>
            <h1 className="font-bold text-lg text-gray-900">Referensi Team</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Ruang Kerja Kita</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center justify-center h-40 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-yellow-50 hover:border-yellow-400 transition-all group"
          >
            <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform mb-3">
              <Plus className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-sm font-semibold text-gray-600 group-hover:text-yellow-600">Buat Project Baru</span>
          </button>

          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => router.push(`/project/${project.id}`)}
              className="group bg-white h-40 rounded-2xl border border-gray-200 p-5 flex flex-col justify-between cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all relative"
            >
              {/* TOMBOL EDIT & DELETE (Muncul saat Hover) */}
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => openEditModal(e, project)} 
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleDeleteProject(e, project.id)} 
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gray-50 w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-yellow-100 transition-colors mt-2">
                <Folder className="w-5 h-5 text-gray-500 group-hover:text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 line-clamp-2 pr-12">{project.name}</h3>
                <p className="text-xs text-gray-400 mt-1">Klik untuk buka referensi</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* === MODAL EDIT PROJECT === */}
      {isEditModalOpen && editingProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Nama Project</h2>
              <form onSubmit={handleEditProject}>
                <input type="text" autoFocus value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-6" required />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">Batal</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-semibold text-black bg-yellow-400 hover:bg-yellow-500 rounded-xl">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL CREATE PROJECT === */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Project Baru</h2>
              <p className="text-sm text-gray-500 mb-5">Apa yang sedang kita kerjakan kali ini?</p>
              <form onSubmit={handleCreateProject}>
                <input type="text" autoFocus value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Misal: Referensi Web Baju..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-6" required />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">Batal</button>
                  <button type="submit" disabled={isCreating} className="flex-1 px-4 py-2.5 text-sm font-semibold text-black bg-yellow-400 hover:bg-yellow-500 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buat Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}