import React, { useState, useEffect } from "react";
import { X, Search, Edit2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  getData,
  updateData,
  deleteData,
} from "../../../../utils/axiosInstance";

const UpdateDocumentsModal = ({ isOpen, onClose }) => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      if (!isOpen) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getData("document-type/all-document-types");
        if (data.success && Array.isArray(data.data.results)) {
          setDocumentTypes(data.data.results);
          setFilteredDocs(data.data.results);
        } else {
          throw new Error("Invalid data structure from API.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentTypes();
  }, [isOpen]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = documentTypes.filter((item) =>
      item.name.toLowerCase().includes(lowercasedFilter),
    );
    setFilteredDocs(filteredData);
  }, [searchTerm, documentTypes]);

  const openEditModal = (doc) => {
    setSelectedDoc(doc);
    setEditName(doc.name);
    setIsEditModalOpen(true);
  };

  const handleEditConfirm = async () => {
    if (!selectedDoc) return;

    try {
      await updateData("document-type/update-document-type", selectedDoc.id, {
        name: editName,
      });
      toast.success("Document updated successfully!");
      const updatedDocs = documentTypes.map((doc) =>
        doc.id === selectedDoc.id ? { ...doc, name: editName } : doc,
      );
      setDocumentTypes(updatedDocs);
      setIsEditModalOpen(false);
      setSelectedDoc(null);
    } catch (err) {
      console.error("Error updating document:", err);
    }
  };

  const openDeleteModal = (doc) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDoc) return;
    try {
      await deleteData("document-type/delete-document-type", selectedDoc.id);
      toast.success("Document deleted successfully!");
      setDocumentTypes(documentTypes.filter((d) => d.id !== selectedDoc.id));
      setIsDeleteModalOpen(false);
      setSelectedDoc(null);
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className="relative flex w-full max-w-4xl flex-col rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={22} />
        </button>

        <h2 className="mb-4 text-center text-2xl font-bold text-black">
          Update Document Types
        </h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by document name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-9 text-sm text-black focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Table */}
        <div className="flex-grow overflow-x-auto">
          {loading ? (
            <p className="text-center text-gray-500">Loading data...</p>
          ) : error ? (
            <p className="text-center text-red-500">Error: {error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] table-fixed border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="w-1/3 px-4 py-3 text-left text-black">
                      Name
                    </th>
                    <th className="w-1/3 px-4 py-3 text-left text-black">
                      Created At
                    </th>
                    <th className="w-1/3 px-4 py-3 text-left text-black">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b border-gray-200 bg-white transition-all last:border-b-0"
                      >
                        <td className="px-4 py-2 text-black">{doc.name}</td>
                        <td className="px-4 py-2 text-black">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="flex gap-2 px-4 py-2">
                          <button
                            onClick={() => openEditModal(doc)}
                            className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-700"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(doc)}
                            className="flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white transition-colors hover:bg-red-700"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="py-4 text-center text-gray-500"
                      >
                        No document types found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900">
                Edit Document Type
              </h3>
              <div className="my-4">
                <label
                  htmlFor="docName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  id="docName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-black outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditConfirm}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900">
                Confirm Deletion
              </h3>
              <p className="my-4 text-sm text-gray-600">
                Are you sure you want to delete this document type? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateDocumentsModal;
