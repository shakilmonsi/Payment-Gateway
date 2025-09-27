import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { FaPencilAlt, FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineCalendarToday, MdOutlinePushPin } from "react-icons/md";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { TbWorld } from "react-icons/tb";
import { getData } from "../../../../utils/axiosInstance";
import { useAuth } from "../../../../featured/auth/AuthContext";

export const UserLink = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("Category");
  const [searchQuery, setSearchQuery] = useState("");
  const [links, setLinks] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();
  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);

  const options = [
    "All Users",
    "Payments",
    "Compliance",
    "Dispute Resolution",
    " Industry Guides",
    "Resources",
  ];

  useEffect(() => {
    const fetchLinks = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const data = await getData("links");
        setLinks(data);
      } catch (err) {
        console.error("Failed to fetch links:", err);
        setError("Failed to load links data.");
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, [isAuthenticated]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  // Safe filter for search
  const filteredLinks = links.filter((link) => {
    const query = searchQuery.toLowerCase();
    const title = link.title?.toLowerCase() || "";
    const description = link.description?.toLowerCase() || "";
    const url = link.url?.toLowerCase() || "";
    return (
      title.includes(query) ||
      description.includes(query) ||
      url.includes(query)
    );
  });

  // open modal with selected link

  return (
    <div className="mt-16 min-h-screen w-full bg-white p-6 md:mt-0 md:p-8 lg:p-10">
      {/* Header */}
      <div>
        <h1 className="font-['Roboto'] text-xl font-bold text-[#212121] md:text-2xl">
          Useful Links Management
        </h1>
        <p className="my-1.5 text-base font-normal text-black/90">
          Curate helpful resources and guides for your users
        </p>
      </div>

      {/* Search + Dropdown */}
      <div className="mb-6 flex flex-col gap-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-lg flex-1">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-neutral-600" />
            <input
              type="text"
              placeholder="Search links, descriptions, or URLs..."
              className="h-10 w-full rounded-lg border border-gray-200 py-1.5 pr-4 pl-10 font-['Roboto'] text-base text-neutral-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="relative w-full lg:w-52">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 font-['Segoe_UI'] text-base font-medium text-gray-500 shadow-sm"
          >
            {selected}
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-zinc-500 transition-transform duration-200" />
            ) : (
              <ChevronDown className="h-5 w-5 text-zinc-500 transition-transform duration-200" />
            )}
          </button>

          {isOpen && (
            <ul className="absolute z-10 mt-2 w-full rounded-lg bg-white shadow-lg">
              {options.map((option) => (
                <li
                  key={option}
                  onClick={() => {
                    setSelected(option);
                    setIsOpen(false);
                  }}
                  className="cursor-pointer px-4 py-2 text-gray-700 hover:bg-blue-50"
                >
                  {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Loading/Error */}
      {loading && <p className="text-gray-500">Loading links...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Table */}
      {!loading && !error && (
        <div className="rounded-lg border border-gray-300 p-6">
          <div>
            <h3 className="font-['Roboto'] text-base font-semibold text-[#212121]">
              All Useful Links
            </h3>
            <p className="mt-1.5 text-sm font-normal text-gray-600">
              {filteredLinks.length} of {links.length} links
            </p>
          </div>

          <div className="mt-4 rounded-lg bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm text-gray-700">
                <thead>
                  <tr className="bg-[#FDFCFC] text-left">
                    <th className="px-4 py-2 text-base font-semibold text-neutral-800">
                      Link Information
                    </th>
                    <th className="px-4 py-2 text-base font-semibold text-neutral-800">
                      Category
                    </th>
                    <th className="px-4 py-2 text-base font-semibold text-neutral-800">
                      Status
                    </th>
                    <th className="px-4 py-2 text-base font-semibold text-neutral-800">
                      Last Updated
                    </th>
                    <th className="px-4 py-2 text-base font-semibold text-neutral-800">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.slice(0, visibleCount).map((link, idx) => (
                    <tr key={idx}>
                      {/* Link Info */}
                      <td className="px-4 py-2">
                        <div className="flex items-start gap-3">
                          <div className="my-auto rounded-sm bg-[#BDDAFF] p-1.5">
                            <TbWorld className="h-6 w-6 text-[#0259C9]" />
                          </div>
                          <div className="text-[#555555]">
                            <h2 className="text-base font-bold">
                              {link.title}
                            </h2>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-sm"
                            >
                              {link.url}
                            </a>
                            <p className="text-[12px] font-normal">
                              {link.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-2">
                        <span className="inline-block max-w-[120px] overflow-hidden rounded-full bg-[#E4F0FF] px-3 py-1 text-center text-base text-[#023E8C]">
                          {link.category || "Payment"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-1.5">
                          {(link.status && link.status.length > 0
                            ? link.status
                            : ["Visible"]
                          ).map((s, i) => {
                            let Icon = null;
                            if (s === "Visible") Icon = AiOutlineEye;
                            else if (s === "Featured" || s === "Regular")
                              Icon = MdOutlinePushPin;
                            else if (s === "Hidden")
                              Icon = AiOutlineEyeInvisible;

                            return (
                              <span
                                key={i}
                                className={`flex w-fit items-center gap-2 rounded-full px-3 py-1 text-base font-normal ${
                                  s === "Visible"
                                    ? "bg-[#C8FED2] text-[#076F1A]"
                                    : s === "Featured"
                                      ? "bg-[#FFF5E0] text-[#9A6D00]"
                                      : s === "Regular"
                                        ? "bg-gray-200 text-gray-600"
                                        : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                {Icon && <Icon className="h-4 w-4" />}
                                {s}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2 text-[13px]">
                          <MdOutlineCalendarToday className="h-4 w-4 text-gray-400" />
                          {link.updatedAt
                            ? new Date(link.updatedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "2-digit",
                                },
                              )
                            : "N/A"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              setSelectedLink(link); // pass the clicked link
                              setIsModalOpen(true); // open modal
                            }}
                            className="text-[#1276F9] hover:text-blue-800"
                          >
                            <AiOutlineEye className="h-5 w-5" />
                          </button>
                          {/* <button className="text-[#1276F9] hover:text-blue-800">
                            <FaPencilAlt className="h-4 w-4" />
                          </button> */}
                          {/* <button className="text-gray-600 hover:text-red-600">
                            <FaRegTrashAlt className="h-4 w-4" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Load More */}
          {visibleCount < filteredLinks.length && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleLoadMore}
                className="mx-auto flex items-center justify-center gap-2 rounded-lg border-2 border-blue-800 px-6 py-2 font-['Roboto'] text-base text-blue-800 transition-colors hover:bg-[#155DFC] hover:text-white"
              >
                Load More... ({filteredLinks.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <Modal
          report={selectedLink}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLink(null);
          }}
        />
      )}
    </div>
  );
};

const Modal = ({ report, onClose }) => {
  if (!report) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative mx-auto max-h-[90vh] w-full max-w-lg scale-95 transform overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 pb-2 shadow-xl transition-all duration-300 ease-in-out">
        <h3 className="mb-4 border-b border-gray-200 pb-2 text-xl font-bold text-black">
          Link Details
        </h3>

        <p className="mb-2 border-b border-gray-200 pb-2 text-black">
          <strong>Title:</strong> {report.title}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 break-words text-black">
          <strong>URL:</strong> {report.url}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 break-words text-black">
          <strong>Description:</strong>{" "}
          {report.description ||
            "Complete guide to handling payments and transactions"}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 text-black">
          <strong>Category:</strong> {report.category || "Payment"}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 text-black">
          <strong>Status:</strong>{" "}
          {Array.isArray(report.status)
            ? report.status.join(", ")
            : report.status || "Visible"}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 text-black">
          <strong>Last Updated:</strong>{" "}
          {report.updatedAt
            ? new Date(report.updatedAt).toLocaleDateString("en-US")
            : "N/A"}
        </p>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
