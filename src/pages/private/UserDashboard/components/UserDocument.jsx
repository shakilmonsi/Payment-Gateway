import { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Search,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import { FiChevronDown, FiChevronUp, FiFilter } from "react-icons/fi";
import Dropzone from "./Dropzone";
import { deleteData, getData } from "../../../../utils/axiosInstance";
import { useAuth } from "../../../../featured/auth/AuthContext";
import { UserDocumentTable } from "./components/UserDocumentTable";
import { DocumentStorageCard } from "./components/DocumentStorageCard/DocumentStorageCard";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-blue-500";
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bgColor} animate-slide-in flex items-center gap-2 rounded-lg px-6 py-3 text-white shadow-lg`}
    >
      <span className="text-lg font-bold">{icon}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-xl leading-none font-bold text-white hover:text-gray-200"
      >
        ×
      </button>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export const UserDocument = () => {
  // Main state
  const [document, setDocument] = useState([]);
  const [type, setType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    documentId: null,
    documentName: "",
  });

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  // ADDED: Missing selectedDocuments state
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  // API-based dropdown states
  const [documentTypes, setDocumentTypes] = useState([]);

  // Type dropdown search states
  const [typeSearchQuery, setTypeSearchQuery] = useState("");
  const [filteredTypes, setFilteredTypes] = useState([]);

  // Modal and UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpenBtn, setIsOpenBtn] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("allRoleOpen") === "true";
    }
    return false;
  });

  // Dropdown states - ALL DECLARED HERE BEFORE useEffect
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("All Types");

  const [isOpenStatus, setIsOpenStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All Status");

  const [isOpenAllStatus, setIsOpenAllStatus] = useState(false);
  const [selectedAllStatus, setSelectedAllStatus] = useState("All Users");

  // Constants
  const optionsStatus = [
    "All Status",
    "Subscriber",
    "Expiring Soon",
    "Expired",
  ];

  const { user, isAuthenticated } = useAuth();

  // ONLY CHANGE: Filter documents to show only current user's documents
  const doc = (document.results || []).filter((docItem) => {
    if (!user) return false;

    // Check if document belongs to current user
    const documentUserId =
      docItem.user?.id || docItem.uploaded_by?.id || docItem.user_id;
    const currentUserId = user.id;

    return documentUserId === currentUserId;
  });

  // Modal functions
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const toggleDiv = () => {
    setIsOpenBtn((prev) => {
      localStorage.setItem("allRoleOpen", !prev);
      return !prev;
    });
  };

  // ADDED: Handle document selection
  const handleSelectDocument = (documentId) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId],
    );
  };

  // Fetch documents
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const [documents, type] = await Promise.all([
          getData("document/all-documents"),
          getData("document-type/all-document-types"),
        ]);
        setDocument(documents?.data || []);
        setType(type?.data || []);
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  // Extract document types from API data (type state) - FIXED
  useEffect(() => {
    if (!type || !Array.isArray(type.results)) {
      // Set default types when no API data
      const defaultTypes = [{ id: "all", name: "All Types" }];
      setDocumentTypes(defaultTypes);
      setFilteredTypes(defaultTypes);
      return;
    }

    const apiTypes = type.results.map((typeItem) => ({
      id: typeItem.id || typeItem.name?.toLowerCase().replace(/\s+/g, "_"),
      name: typeItem.name || typeItem.type_name || typeItem.document_type,
    }));

    const allTypes = [{ id: "all", name: "All Types" }, ...apiTypes];
    setDocumentTypes(allTypes);
    setFilteredTypes(allTypes);
  }, [type]);

  // Enhanced search and filter logic - NOW selected is properly declared above
  useEffect(() => {
    if (!doc || doc.length === 0) return;

    let filtered = doc; // don't spread unnecessarily

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((document) => {
        const documentName = (
          document.file ||
          document.document_name ||
          ""
        ).toLowerCase();
        const documentType = (
          document.type ||
          document.document_type ||
          ""
        ).toLowerCase();
        const userName = (
          document.user?.name ||
          document.uploaded_by?.name ||
          ""
        ).toLowerCase();

        return (
          documentName.includes(query) ||
          documentType.includes(query) ||
          userName.includes(query)
        );
      });
    }

    // Document type filter
    if (selected !== "All Types") {
      filtered = filtered.filter((document) => {
        const documentType = (
          document.type ||
          document.document_type ||
          ""
        ).toLowerCase();
        return documentType === selected.toLowerCase();
      });
    }

    // Status filter
    if (selectedStatus !== "All Status") {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      filtered = filtered.filter((document) => {
        if (selectedStatus === "Subscriber")
          return document.status === "Subscriber";
        if (selectedStatus === "Expiring Soon") {
          if (!document.expiryDate) return false;
          const expiryDate = new Date(document.expiryDate);
          return expiryDate <= thirtyDaysFromNow && expiryDate > today;
        }
        if (selectedStatus === "Expired") {
          if (!document.expiryDate) return false;
          const expiryDate = new Date(document.expiryDate);
          return expiryDate < today;
        }
        return true;
      });
    }

    // User filter
    if (selectedAllStatus !== "All Users") {
      filtered = filtered.filter((document) => {
        const userName =
          document.user?.name || document.uploaded_by?.name || "";
        return userName === selectedAllStatus;
      });
    }

    setFilteredDocuments(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selected, selectedStatus, selectedAllStatus, doc.length]);
  // <-- use doc.length instead of doc itself to avoid infinite loop

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Type search filter effect - NEW
  useEffect(() => {
    if (!typeSearchQuery.trim()) {
      setFilteredTypes(documentTypes);
    } else {
      const query = typeSearchQuery.toLowerCase().trim();
      const filtered = documentTypes.filter((type) =>
        type.name.toLowerCase().includes(query),
      );
      setFilteredTypes(filtered);
    }
  }, [typeSearchQuery, documentTypes]);

  // Handle type search input - NEW
  const handleTypeSearchChange = (e) => {
    setTypeSearchQuery(e.target.value);
  };

  // Clear type search - NEW
  const clearTypeSearch = () => {
    setTypeSearchQuery("");
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Show toast function
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  // Hide toast function
  const hideToast = () => {
    setToast({ show: false, message: "", type: "" });
  };

  // Handle delete click - ADDED: User ownership check
  const handleDeleteClick = (documentId, documentName) => {
    // Security check - ensure document belongs to current user
    const documentToDelete = doc.find((d) => d.id === documentId);
    if (!documentToDelete) {
      showToast("Document not found or access denied.", "error");
      return;
    }

    const documentUserId =
      documentToDelete.user?.id ||
      documentToDelete.uploaded_by?.id ||
      documentToDelete.user_id;
    if (documentUserId !== user.id) {
      showToast("You can only delete your own documents.", "error");
      return;
    }

    setConfirmModal({
      show: true,
      documentId,
      documentName,
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      const documentId = confirmModal.documentId;
      // const documentName = confirmModal.documentName;

      await deleteData(`document/delete-document`, documentId);

      const updatedResults = document.results.filter(
        (document) => document.id !== documentId,
      );
      setDocument({
        ...document,
        results: updatedResults,
      });

      showToast(`Document has been deleted successfully!`, "success");

      setConfirmModal({ show: false, documentId: null, documentName: "" });
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete document. Please try again.", "error");
      setConfirmModal({ show: false, documentId: null, documentName: "" });
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setConfirmModal({ show: false, documentId: null, documentName: "" });
  };

  return (
    <div className="mt-[78px] min-h-screen w-full bg-white font-['Roboto'] sm:p-5 md:mt-0 md:p-10">
      {/* Toast */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.show}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${confirmModal.documentName}"? This action cannot be undone.`}
      />

      <div className="mx-auto max-w-full rounded-xl border border-gray-300 px-4 pt-6 sm:px-6 md:px-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h1 className="font-['Roboto'] text-xl font-[700] text-[#212121] sm:text-2xl">
                Document Storage
              </h1>
            </div>
            <p className="font-['Roboto'] text-base font-[400] text-[#555555]">
              Manage compliance documents and track expiry dates
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={openModal}
              className="flex h-12 items-center justify-center gap-2.5 rounded-lg bg-blue-600 px-4 py-2.5 transition-colors hover:bg-blue-700 sm:h-14"
            >
              <Upload className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              <span className="font-['Roboto'] text-sm font-[600] text-white sm:text-base">
                Upload Document
              </span>
            </button>
          </div>

          {isModalOpen && <Dropzone closeModal={closeModal} />}
        </div>

        {/* Stats Cards */}
        <DocumentStorageCard doc={doc} />

        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-col gap-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg flex-1">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-neutral-600" />
              <input
                type="text"
                placeholder="Search documents, users, or file names..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="h-10 w-full rounded-lg border border-gray-200 py-1.5 pr-4 pl-10 font-['Roboto'] text-base font-normal text-neutral-600 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              <ArrowDownTrayIcon className="h-5 w-5 text-[#555555]" />
              CSV
            </button>

            <button className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              <ArrowDownTrayIcon className="h-5 w-5 text-[#555555]" />
              PDF
            </button>

            <div className="relative w-full lg:w-52">
              <button
                onClick={toggleDiv}
                className="flex w-full appearance-none items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-['Segoe_UI'] text-base font-[500] text-gray-500 shadow-sm"
              >
                <FiFilter /> All Role
                {isOpenBtn ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns */}
        {isOpenBtn && (
          <div className="flex w-full items-center gap-4 pb-10 sm:gap-5 md:gap-6">
            {/* Document Types Dropdown with Search - SAME AS USERS DROPDOWN */}
            <div className="relative w-full">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full appearance-none items-center justify-between rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 font-['Segoe_UI'] text-base font-[500] text-gray-500 shadow-sm"
              >
                {selected}
                <ChevronDown className="h-5 w-5 text-zinc-500" />
              </button>

              {isOpen && (
                <div className="absolute z-10 -mt-12 w-full rounded-[8px] bg-white shadow-[12px_12px_24px_0_rgba(18,118,249,0.16)]">
                  {/* Search Input inside dropdown */}
                  <div className="border-b border-gray-200 p-3">
                    <div className="relative">
                      <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search types..."
                        value={typeSearchQuery}
                        onChange={handleTypeSearchChange}
                        className="w-full rounded-md border border-gray-400 py-1.5 pr-8 pl-7 text-sm text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {typeSearchQuery && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearTypeSearch();
                          }}
                          className="absolute top-1/2 right-2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dropdown list with scroll */}
                  <div className="max-h-[300px] overflow-y-auto">
                    {/* Loading state */}
                    {loading ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Loading types...
                      </div>
                    ) : (
                      <ul>
                        {filteredTypes.length > 0 ? (
                          filteredTypes.map((type) => (
                            <li
                              key={type.id}
                              onClick={() => {
                                setSelected(type.name);
                                setIsOpen(false);
                                clearTypeSearch();
                              }}
                              className="cursor-pointer px-4 py-2 text-gray-700 transition-colors hover:bg-blue-50"
                            >
                              {type.name}
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-2 text-sm text-gray-500">
                            No types found
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative w-full">
              <button
                onClick={() => setIsOpenStatus(!isOpenStatus)}
                className="flex w-full appearance-none items-center justify-between rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 font-['Segoe_UI'] text-base font-[500] text-gray-500 shadow-sm"
              >
                {selectedStatus}
                <ChevronDown className="h-5 w-5 text-zinc-500" />
              </button>

              {isOpenStatus && (
                <div className="absolute z-10 mt-2 max-h-[300px] w-full overflow-y-auto rounded-[8px] bg-white shadow-[12px_12px_24px_0_rgba(18,118,249,0.16)]">
                  <ul>
                    {optionsStatus.map((option) => (
                      <li
                        key={option}
                        onClick={() => {
                          setSelectedStatus(option);
                          setIsOpenStatus(false);
                        }}
                        className="cursor-pointer px-4 py-2 text-gray-700 hover:bg-blue-50"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Users Dropdown with Search - EXISTING */}
            <div className="relative w-[300px]">
              <h2
                onClick={() => setIsOpenAllStatus(!isOpenAllStatus)}
                className="flex w-full appearance-none items-center justify-between rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 font-['Segoe_UI'] text-base font-[500] text-gray-500 shadow-sm"
              >
                User By: {user?.name || ""}
              </h2>
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div className="mb-9 rounded-lg border border-gray-300 bg-white p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading documents...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500">{error}</div>
            </div>
          )}

          {/* No Results State */}
          {!loading &&
            !error &&
            filteredDocuments.length === 0 &&
            (searchQuery ||
              selected !== "All Types" ||
              selectedStatus !== "All Status" ||
              selectedAllStatus !== "All Users") && (
              <div className="flex flex-col items-center justify-center py-12">
                <Search className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No documents found
                </h3>
                <p className="mb-4 max-w-md text-center text-gray-500">
                  No documents match your current filters. Try adjusting your
                  search or filters.
                </p>
                <button
                  onClick={() => {
                    clearSearch();
                    setSelected("All Types");
                    setSelectedStatus("All Status");
                    setSelectedAllStatus("All Users");
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              </div>
            )}

          {/* Empty State when no documents at all */}
          {!loading && !error && doc.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No documents available
              </h3>
              <p className="max-w-md text-center text-gray-500">
                Upload your first document to get started.
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && filteredDocuments.length > 0 && (
            <UserDocumentTable
              user={user}
              handleDeleteClick={handleDeleteClick}
              filteredDocuments={filteredDocuments}
              selectedDocuments={selectedDocuments}
              handleSelectDocument={handleSelectDocument}
            />
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }

      /* Custom scrollbar for dropdown */
      .max-h-[300px]::-webkit-scrollbar {
        width: 6px;
      }
      .max-h-[300px]::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      .max-h-[300px]::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      .max-h-[300px]::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      `}</style>
    </div>
  );
};
