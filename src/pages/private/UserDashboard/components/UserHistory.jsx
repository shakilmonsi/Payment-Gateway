import { ChevronDown, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { getData } from "../../../../utils/axiosInstance";

// Modal Component for View Report
const Modal = ({ report, onClose }) => {
  if (!report) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative mx-auto max-h-[90vh] w-full max-w-lg scale-95 transform overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 pb-2 shadow-xl transition-all duration-300 ease-in-out">
        <h3 className="mb-4 border-b border-gray-200 pb-2 text-xl font-bold text-black">
          Report Details
        </h3>
        <p className="mb-2 border-b border-gray-200 pb-2 text-black">
          <strong>Date:</strong> {new Date(report.date).toLocaleDateString()}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 text-black">
          <strong>Status:</strong> {report.status}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 break-words text-black">
          <strong>Details:</strong> {report.details}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 text-black">
          <strong>Vehicle Reg No:</strong> {report.vehicleRegNo}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 text-black">
          <strong>Plate No:</strong> {report.plateNo}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 text-black">
          <strong>Badge No:</strong> {report.badgeNo}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 text-black">
          <strong>Mileage:</strong> {report.mileage}
        </p>
        <p className="mb-2 border-b border-gray-200 pb-2 break-words text-black">
          <strong>Notes:</strong> {report.notes}
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

export const UserHistory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("All STATUS");
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const options = ["All STATUS", "Complete", "Failed"];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getData("checks");
        setHistoryData(data.checks);
      } catch (err) {
        console.error("Failed to fetch daily checks history:", err);
        setError("Failed to load history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filter the history data based on the selected dropdown option
  const filteredHistory = historyData.filter((report) => {
    if (selected === "All STATUS") {
      return true;
    }
    if (selected === "Complete" && report.status === "completed") {
      return true;
    }
    if (selected === "Failed" && report.status !== "completed") {
      return true;
    }
    return false;
  });

  const handleExportCSV = () => {
    const headers = "DATE,STATUS,DETAILS\n";

    // Use the filtered data for export
    const csvContent = filteredHistory
      .map((report) => {
        const date = new Date(report.date).toLocaleDateString();
        const status = report.status === "completed" ? "Complete" : "Failed";
        const details = report.details.replace(/,/g, "");
        return `${date},${status},"${details}"`;
      })
      .join("\n");

    const fullCsv = headers + csvContent;

    const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "daily_checks_history.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  return (
    <div className="mt-[72px] min-h-screen w-full bg-white font-[Inter] md:mt-0">
      <div className="p-6 md:p-8 lg:p-10">
        <div className="mt-1 rounded-2xl border border-gray-200 px-6 py-3 font-['Inter'] sm:mt-2 md:mt-0">
          <h2 className="text-xl font-bold text-gray-700 sm:text-2xl md:text-3xl">
            History
          </h2>
          <p className="my-1.5 text-sm font-normal text-[#9DA1AB]">
            View and manage past daily checks and records.
          </p>

          <div className="items-center justify-between md:flex">
            <div className="my-5 flex items-center gap-4 md:my-8">
              <div className="relative w-full lg:w-52">
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 font-['Segoe_UI'] text-base font-medium text-gray-500 shadow-sm"
                >
                  {selected}
                  <ChevronDown className="h-5 w-5 text-zinc-500" />
                </button>
                {isOpen && (
                  <ul className="absolute left-0 z-10 mt-2 w-full rounded-lg bg-white shadow-md">
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
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2.5 text-white transition-colors sm:h-14 sm:w-40"
                >
                  <Download className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="font-['Roboto'] text-sm font-semibold sm:text-base">
                    Export
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 px-6 py-2 sm:py-2.5 md:py-3">
            <h2 className="text-lg font-semibold text-gray-700 md:text-xl">
              Daily Checks History
            </h2>
            <p className="my-1.5 text-base font-normal text-[#9DA1AB]">
              View and manage past daily checks and records.
            </p>
          </div>

          <div className="mt-4 mb-2 overflow-x-auto rounded-md border border-gray-300 md:mt-14 md:mb-4">
            <table className="min-w-full border-collapse text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-50 text-left font-medium text-gray-700">
                  <th className="border border-gray-300 px-4 py-2 text-[12px] font-normal text-[#434549] sm:px-5 sm:py-2.5 md:px-6 md:py-3">
                    DATE
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-[12px] font-normal text-[#434549] sm:px-5 sm:py-2.5 md:px-6 md:py-3">
                    STATUS
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-[12px] font-normal text-[#434549] sm:px-5 sm:py-2.5 md:px-6 md:py-3">
                    DETAILS
                  </th>
                  <th className="border border-gray-300 px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center">
                      Loading history...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : (
                  // Use filteredHistory to render the table rows
                  filteredHistory.map((report) => (
                    <tr key={report.id}>
                      <td className="border border-gray-300 px-4 py-2 text-[12px] font-normal text-[#000000] sm:px-5 sm:py-2.5 md:py-3">
                        {new Date(report.date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-[12px] font-normal text-[#000000] sm:px-5 sm:py-2.5 md:py-3">
                        {report.status === "completed" ? (
                          <span className="inline-flex rounded-full bg-green-200 px-3 py-1 text-xs font-medium text-green-800">
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-orange-200 px-3 py-1 text-xs font-medium text-orange-800">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-[12px] font-normal text-[#000000] sm:px-5 sm:py-2.5 md:py-3">
                        {report.details}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-[12px] font-normal text-[#000000] sm:px-5 sm:py-2.5 md:py-3">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="text-blue-600 hover:underline"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <Modal report={selectedReport} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};
