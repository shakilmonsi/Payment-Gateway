import {
  ArrowDownTrayIcon,
  IdentificationIcon,
} from "@heroicons/react/24/solid";
import { CreditCardIcon, EyeIcon, TruckIcon } from "lucide-react";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineCalendarToday } from "react-icons/md";
import { DocumentTextIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { BiShield } from "react-icons/bi";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

const docIcons = {
  badge: BiShield,
  insurance: CreditCardIcon,
  mot: TruckIcon,
  licence: IdentificationIcon,
};

const memoizedFileSizes = new Map();

const getConsistentFileSize = (document) => {
  const key =
    (document.id || "") + (document.file || document.document_name || "");
  if (memoizedFileSizes.has(key)) {
    return memoizedFileSizes.get(key);
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) & 0xffffffff;
  }
  const seedValue = Math.abs(hash);
  const fileName = document.file || document.document_name || "";
  const extension = fileName.split(".").pop()?.toLowerCase();
  let minSize, maxSize;
  switch (extension) {
    case "pdf":
      minSize = 100000;
      maxSize = 5000000;
      break;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      minSize = 50000;
      maxSize = 2000000;
      break;
    case "doc":
    case "docx":
      minSize = 20000;
      maxSize = 1000000;
      break;
    case "txt":
      minSize = 1000;
      maxSize = 50000;
      break;
    case "mp4":
    case "avi":
      minSize = 5000000;
      maxSize = 100000000;
      break;
    default:
      minSize = 10000;
      maxSize = 3000000;
  }
  const sizeRange = maxSize - minSize;
  const randomBytes = minSize + (seedValue % sizeRange);
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(randomBytes) / Math.log(1024));
  let formattedSize;
  if (i === 0) {
    formattedSize = randomBytes + " " + sizes[i];
  } else {
    formattedSize =
      (randomBytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
  }
  memoizedFileSizes.set(key, formattedSize);
  return formattedSize;
};

const getDocumentStatus = (document) => {
  if (document.status === "Subscriber") return "Subscriber";
  if (document.status === "Pending") return "Pending";
  const expiryDate = new Date(
    document.expiryDate || document.expiry_date || document.expires_at,
  );
  if (!expiryDate.getDate()) return document.status || "N/A";
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  if (expiryDate < today) return "Expired";
  if (expiryDate <= thirtyDaysFromNow && expiryDate > today)
    return "Expiring Soon";
  return document.status || "Subscriber";
};

const renderStatus = (document) => {
  const status = getDocumentStatus(document);
  switch (status) {
    case "Subscriber":
      return (
        <span className="flex w-fit items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-sm font-normal text-blue-700">
          <BiShield className="h-4 w-4" /> {status}
        </span>
      );
    case "Expiring Soon":
      return (
        <span className="flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-sm font-normal text-amber-700">
          <ExclamationTriangleIcon className="h-4 w-4" /> {status}
        </span>
      );
    case "Expired":
      return (
        <span className="flex w-fit items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-sm font-normal text-rose-700">
          <XCircleIcon className="h-4 w-4" /> {status}
        </span>
      );
    case "Pending":
      return (
        <span className="flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-sm font-normal text-amber-700">
          <ExclamationTriangleIcon className="h-4 w-4" /> {status}
        </span>
      );
    default:
      return (
        <span className="flex w-fit items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-sm font-normal text-gray-600">
          {status}
        </span>
      );
  }
};

export const UserDocumentTable = ({
  handleDeleteClick,
  filteredDocuments = [],
  selectedDocuments = [],
  handleSelectDocument,
  handleDownloadSingle, // Add this prop to handle individual document downloads
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  const openModal = (doc) => {
    setSelectedDoc(doc);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedDoc(null);
    setIsModalOpen(false);
  };

  // Handle select all functionality
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      filteredDocuments.forEach((doc) => {
        if (selectedDocuments.includes(doc.id)) {
          handleSelectDocument(doc.id);
        }
      });
    } else {
      // Select all
      filteredDocuments.forEach((doc) => {
        if (!selectedDocuments.includes(doc.id)) {
          handleSelectDocument(doc.id);
        }
      });
    }
    setSelectAll(!selectAll);
  };

  return (
    <div className="overflow-x-auto">
      <h2 className="mb-4 text-base font-semibold text-[#212121]">
        Documents ({filteredDocuments?.length || 0})
      </h2>
      <table className="min-w-full table-fixed border-collapse">
        <thead className="bg-[#FDFCFC]">
          <tr className="text-base font-semibold text-[#555555]">
            <th className="px-4 py-2 text-left text-base font-[600] text-[#212121] sm:px-5 sm:py-3 md:px-6 md:py-4">
              Document
            </th>
            <th className="px-4 py-2 text-left text-base font-[600] text-[#212121] sm:px-5 sm:py-3 md:px-6 md:py-4">
              User
            </th>
            <th className="px-4 py-2 text-left text-base font-[600] text-[#212121] sm:px-5 sm:py-3 md:px-6 md:py-4">
              Upload Date
            </th>
            <th className="px-4 py-2 text-left text-base font-[600] text-[#212121] sm:px-5 sm:py-3 md:px-6 md:py-4">
              Expiry Date
            </th>
            <th className="px-4 py-2 text-left text-base font-[600] text-[#212121] sm:px-5 sm:py-3 md:px-6 md:py-4">
              Status
            </th>
            <th className="px-4 py-2 text-left text-base font-[600] text-[#212121] sm:px-5 sm:py-3 md:px-6 md:py-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="">
          {filteredDocuments.map((document, index) => {
            const Icon = docIcons[document.type] || DocumentTextIcon;
            const documentName =
              document.file || document.document_name || "N/A";

            return (
              <tr
                key={document.id || index}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="flex items-center gap-2 px-4 py-1 whitespace-nowrap md:px-5 md:py-2">
                  <div className="rounded-md bg-gray-100 p-1">
                    <Icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h4 className="font-['Roboto'] text-base font-normal text-[#555555]">
                      {documentName.length > 27
                        ? documentName.slice(0, 27) + "..."
                        : documentName}
                    </h4>
                    <p className="font-['Roboto'] text-xs font-normal text-[#555555]">
                      {getConsistentFileSize(document)}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-1 text-sm whitespace-nowrap text-[#555555] md:px-5 md:py-2">
                  <span className="flex items-center gap-2 p-3">
                    <img
                      src={
                        document.user?.avatar ||
                        document.uploaded_by?.avatar ||
                        "https://i.pravatar.cc/40?img=1"
                      }
                      alt={
                        document.user?.name ||
                        document.uploaded_by?.name ||
                        "User"
                      }
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <p className="text-base font-normal">
                        {document.user?.name ||
                          document.uploaded_by?.name ||
                          "N/A"}
                      </p>
                      <p className="text-xs text-[#A09C9C]">
                        {document.user?.role || "N/A"}
                      </p>
                    </div>
                  </span>
                </td>
                <td className="px-4 py-1 text-sm whitespace-nowrap text-gray-500 md:px-5 md:py-2">
                  <div className="flex items-center gap-2">
                    <MdOutlineCalendarToday className="text-gray-600" />
                    {(
                      document.uploadDate ||
                      document.upload_date ||
                      document.createdAt ||
                      document.created_at ||
                      "N/A"
                    ).slice(0, 10)}
                  </div>
                </td>
                <td className="px-4 py-1 text-sm whitespace-nowrap text-gray-500 md:px-5 md:py-2">
                  <div className="flex items-center gap-2">
                    <MdOutlineCalendarToday className="text-gray-600" />
                    {(
                      document.expiryDate ||
                      document.expiry_date ||
                      document.expires_at ||
                      "N/A"
                    ).slice(0, 10)}
                  </div>
                </td>
                <td className="max-w-[160px] truncate overflow-hidden px-4 py-1 whitespace-nowrap md:px-5 md:py-2">
                  {renderStatus(document)}
                </td>
                <td className="flex gap-3 px-4 py-1 md:px-5 md:py-2">
                  <EyeIcon
                    className="h-5 w-5 cursor-pointer text-[#1276F9] transition-colors hover:text-blue-800"
                    onClick={() => openModal(document)}
                    title="View Details"
                  />
                  <ArrowDownTrayIcon
                    className="h-5 w-5 cursor-pointer text-blue-600 transition-colors hover:text-blue-800"
                    onClick={() =>
                      handleDownloadSingle && handleDownloadSingle(document)
                    }
                    title="Download Document"
                  />
                  <FaRegTrashAlt
                    className="h-5 w-5 cursor-pointer text-[#555555] transition-colors hover:text-red-600"
                    onClick={() => handleDeleteClick(document.id, documentName)}
                    title="Delete Document"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {isModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 text-black/80 shadow-lg">
            <div className="flex items-center justify-between border-b border-black/20 pb-2">
              <h2 className="text-lg font-semibold">Document Details</h2>
              <button
                className="text-gray-500 transition-colors hover:text-gray-700"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2 text-base">
              <p className="border-b border-black/10 pb-2">
                <strong>Name:</strong>{" "}
                {selectedDoc.user?.name ||
                  selectedDoc.uploaded_by?.name ||
                  "N/A"}
              </p>
              <p className="border-b border-black/10 pb-2">
                <strong>Role:</strong> {selectedDoc.user?.role || "N/A"}
              </p>
              <p className="border-b border-black/10 pb-2">
                <strong>Document:</strong>{" "}
                {selectedDoc.file || selectedDoc.document_name ? (
                  <a
                    href={selectedDoc.file || selectedDoc.document_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {selectedDoc.file?.split("/").pop() ||
                      selectedDoc.document_name}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
              <p className="border-b border-black/20 pb-2">
                <strong>Type:</strong>{" "}
                {selectedDoc.type || selectedDoc.document_type || "N/A"}
              </p>
              <p className="border-b border-black/10 pb-2">
                <strong>Upload Date:</strong>{" "}
                {(
                  selectedDoc.uploadDate ||
                  selectedDoc.upload_date ||
                  selectedDoc.createdAt ||
                  "N/A"
                ).slice(0, 10)}
              </p>
              <p className="border-b border-black/10 pb-2">
                <strong>Expiry Date:</strong>{" "}
                {(
                  selectedDoc.expiryDate ||
                  selectedDoc.expiry_date ||
                  selectedDoc.expires_at ||
                  "N/A"
                ).slice(0, 10)}
              </p>
              <p className="border-b border-black/10 pb-2">
                <strong>Status:</strong> {getDocumentStatus(selectedDoc)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
