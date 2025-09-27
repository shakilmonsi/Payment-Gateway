import React, { useState, useEffect, useRef } from "react";

import {
  FaDownload,
  FaEye,
  FaEllipsisH,
  FaFilter,
  FaSearch,
} from "react-icons/fa";
import { BiRefresh } from "react-icons/bi";
import {
  MdDocumentScanner,
  MdWarning,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";

import { getData } from "../../../utils/axiosInstance";
import { useAuth } from "../../../featured/auth/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const Records = () => {
  const { user } = useAuth();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    user: "All Users",
    vehicle: "All Vehicles",
    status: "All Status",
  });

  const [dropdownStates, setDropdownStates] = useState({
    user: false,
    vehicle: false,
    status: false,
  });

  const [checks, setChecks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const initialFetchRef = useRef(true);

  const toggleFilterSection = (e) => {
    e.stopPropagation();
    setIsFilterOpen(!isFilterOpen);
    setDropdownStates({
      user: false,
      vehicle: false,
      status: false,
    });
  };

  const toggleDropdown = (dropdownName) => {
    setDropdownStates((prev) => ({
      ...prev,
      [dropdownName]: !prev[dropdownName],
    }));
  };

  const closeAllDropdowns = () => {
    setDropdownStates({
      user: false,
      vehicle: false,
      status: false,
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { icon: <MdCheckCircle />, color: "green" },
      failed: { icon: <MdCancel />, color: "red" },
      warning: { icon: <MdWarning />, color: "amber" },
      expired: { icon: <MdCancel />, color: "red" },
      pending: { icon: <MdWarning />, color: "amber" },
    };

    const { icon, color } = statusMap[status?.toLowerCase()] || {
      icon: <MdWarning />,
      color: "amber",
    };

    const colorClasses = {
      green: "bg-green-200 text-green-700",
      amber: "bg-amber-100 text-amber-700",
      red: "bg-red-200 text-red-600",
    };

    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium sm:text-sm ${colorClasses[color]}`}
      >
        {icon}
        <span className="whitespace-nowrap capitalize">
          {status || "Unknown"}
        </span>
      </div>
    );
  };

  // API থেকে সমস্ত চেক রেকর্ড আনা - Fixed API call
  const fetchChecks = async (isSearch = false) => {
    if (isSearch) {
      setSearchLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let response;

      // যদি search term থাকে, তাহলে search API ব্যবহার করো
      if (searchTerm.trim()) {
        console.log("Searching for:", searchTerm);
        response = await getData(`checks/checks-search/${searchTerm}`);
        console.log("Search API Response:", response);
      } else {
        // নিয়মিত checks API call
        const queryParams = {};

        // Filter parameters তৈরি করো
        if (filters.user !== "All Users") {
          const selectedUser = users.find((u) => u.name === filters.user);
          if (selectedUser) {
            queryParams.userId = selectedUser.id;
          }
        }

        if (filters.vehicle !== "All Vehicles") {
          queryParams.vehicleRegNo = filters.vehicle;
        }

        if (filters.status !== "All Status") {
          queryParams.status = filters.status.toLowerCase();
        }

        console.log("Fetching checks with params:", queryParams);
        response = await getData("/checks/all-checks/", null, queryParams);
        console.log("Checks API Response:", response);
      }

      // API response থেকে checks data extract করো
      let checksData = [];

      if (response) {
        // Different possible response structures
        if (response.checks) {
          checksData = response.checks;
        } else if (response.data && response.data.checks) {
          checksData = response.data.checks;
        } else if (Array.isArray(response)) {
          checksData = response;
        } else if (response.data && Array.isArray(response.data)) {
          checksData = response.data;
        }
      }

      console.log("Extracted checks data:", checksData);
      setChecks(checksData || []);

      if (checksData.length === 0 && searchTerm) {
        toast.info(`No results found for "${searchTerm}"`);
      }
    } catch (err) {
      console.error("API Error:", err);
      setError("রেকর্ড আনতে ব্যর্থ। অনুগ্রহ করে আবার চেষ্টা করুন।");
      setChecks([]);
      toast.error("Failed to fetch records");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log("Fetching users...");
      const response = await getData("user");
      console.log("Users API Response:", response);

      let usersData = [];
      if (response && response.data && response.data.users) {
        usersData = response.data.users;
      } else if (response && response.users) {
        usersData = response.users;
      }

      console.log("Extracted users data:", usersData);
      setUsers(usersData || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to fetch users");
    }
  };

  // Search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchChecks(true); // isSearch = true
      } else if (!initialFetchRef.current) {
        fetchChecks(false); // Reset to normal fetch when search is cleared
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Filter change effect
  useEffect(() => {
    if (!initialFetchRef.current && !searchTerm.trim()) {
      fetchChecks(false);
    }
  }, [filters]);

  // Initial data fetch
  useEffect(() => {
    if (initialFetchRef.current) {
      fetchChecks(false);
      fetchUsers();
      initialFetchRef.current = false;
    }
  }, []);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
    closeAllDropdowns();
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setFilters({
      user: "All Users",
      vehicle: "All Vehicles",
      status: "All Status",
    });
    fetchChecks(false);
    fetchUsers();
    toast.success("Data refreshed successfully");
  };

  // ডাইনামিক স্ট্যাটাস কার্ডের জন্য ডেটা গণনা করা
  const totalChecks = checks.length;
  const completedChecks = checks.filter(
    (check) => check.status?.toLowerCase() === "completed",
  ).length;
  const expiredChecks = checks.filter(
    (check) => check.status?.toLowerCase() === "expired",
  ).length;

  const stats = [
    {
      title: "Total Checks",
      value: totalChecks,
      icon: <MdDocumentScanner className="h-6 w-6 text-blue-600" />,
      bgColor: "bg-blue-100",
    },
    {
      title: "Completed",
      value: completedChecks,
      icon: <MdCheckCircle className="h-6 w-6 text-green-600" />,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      title: "Expired",
      value: expiredChecks,
      icon: <MdCancel className="h-6 w-6 text-red-600" />,
      bgColor: "bg-red-100",
      textColor: "text-red-600",
    },
  ];

  // ফিল্টার ড্রপডাউনের অপশনগুলো ডাইনামিক করা
  const filterOptions = {
    user: ["All Users", ...users.map((u) => u.name).filter(Boolean)],
    vehicle: [
      "All Vehicles",
      ...Array.from(new Set(checks.map((c) => c.vehicleRegNo).filter(Boolean))),
    ],
    status: ["All Status", "completed", "expired"],
  };

  // CSV এক্সপোর্ট ফাংশন
  const handleExportCSV = () => {
    if (checks.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = "ID,User,Date,Time,VehicleReg,Status,PlateNo,BadgeNo\n";
    const csvContent = checks
      .map((row) => {
        const checkId = row.id?.substring(0, 8) || "N/A";
        const userName = row.completedBy?.name || "N/A";
        const date = row.date ? new Date(row.date).toLocaleDateString() : "N/A";
        const time = row.date ? new Date(row.date).toLocaleTimeString() : "N/A";
        const vehicleReg = row.vehicleRegNo || "";
        const status = row.status || "";
        const plateNo = row.plateNo || "";
        const badgeNo = row.badgeNo || "";

        return `"${checkId}","${userName}","${date}","${time}","${vehicleReg}","${status}","${plateNo}","${badgeNo}"`;
      })
      .join("\n");

    const blob = new Blob([headers + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `daily_checks_records_${new Date().getTime()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully");
  };

  const FilterDropdown = ({ label, value, options = [], filterType }) => (
    <div className="relative flex flex-col space-y-1 sm:space-y-2">
      <label className="text-xs font-medium text-gray-700 sm:text-sm md:text-base">
        {label}
      </label>
      <div className="relative">
        <div
          className="group cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown(filterType);
          }}
        >
          <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 hover:border-gray-400 hover:bg-gray-50 sm:px-4 sm:py-2.5">
            <span className="text-xs text-gray-700 sm:text-sm md:text-base">
              {value}
            </span>
            {dropdownStates[filterType] ? (
              <BsChevronUp className="h-3 w-3 text-gray-600 transition-transform duration-200 group-hover:text-gray-800 sm:h-4 sm:w-4" />
            ) : (
              <BsChevronDown className="h-3 w-3 text-gray-600 transition-transform duration-200 group-hover:text-gray-800 sm:h-4 sm:w-4" />
            )}
          </div>
        </div>
        {dropdownStates[filterType] && (
          <div
            className="absolute top-full right-0 z-50 mt-1 max-h-48 w-44 overflow-y-auto rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option, index) => (
              <div
                key={index}
                className="cursor-pointer px-3 py-2 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleFilterChange(filterType, option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8"
      onClick={closeAllDropdowns}
    >
      <Toaster position="top-center" reverseOrder={false} />

      <div className="mx-auto max-w-full space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-xl font-[700] text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">
              Daily Check Records
            </h1>
            <p className="text-sm text-gray-600 sm:text-sm md:text-lg">
              {user?.name || "Guest"} - {user?.role || "User"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-blue-600 px-4 py-2.5 text-blue-600 transition-all duration-200 hover:border-blue-700 hover:bg-blue-50 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:opacity-50 sm:px-5 sm:py-3 lg:min-w-40"
            >
              <BiRefresh
                className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? "animate-spin" : ""}`}
              />
              <span className="text-sm font-[600] sm:text-base">
                {loading ? "Loading..." : "Refresh"}
              </span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={checks.length === 0}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:opacity-50 sm:px-5 sm:py-3 lg:min-w-40"
            >
              <FaDownload className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-sm font-[600] sm:text-base">
                Export CSV
              </span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md sm:p-5 lg:p-6"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 transition-all duration-200 group-hover:scale-105 ${stat.bgColor}`}
                >
                  {stat.icon}
                </div>
                <div className="flex flex-col">
                  <div
                    className={`text-[32px] font-[700] sm:text-3xl ${
                      stat.textColor || "text-gray-900"
                    }`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 sm:text-base">
                    {stat.title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter Section */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 lg:max-w-2xl lg:flex-1">
                <FaSearch
                  className={`h-4 w-4 ${searchLoading ? "animate-pulse text-blue-500" : "text-gray-400"}`}
                />
                <input
                  type="text"
                  placeholder="Search by ID, status, vehicle reg, or operator..."
                  className="flex-1 bg-transparent text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                onClick={toggleFilterSection}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:outline-none lg:min-w-32"
              >
                <FaFilter className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">Filter</span>
                {isFilterOpen ? (
                  <BsChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <BsChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Filter Section */}
          {isFilterOpen && (
            <div
              className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
                  <FilterDropdown
                    label="User"
                    value={filters.user}
                    options={filterOptions.user}
                    filterType="user"
                  />
                  <FilterDropdown
                    label="Vehicle"
                    value={filters.vehicle}
                    options={filterOptions.vehicle}
                    filterType="vehicle"
                  />
                  <FilterDropdown
                    label="Status"
                    value={filters.status}
                    options={filterOptions.status}
                    filterType="status"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="mb-4 text-sm text-gray-600 sm:mb-6 sm:text-base">
              Daily Check Records ({checks.length})
              {searchTerm && (
                <span className="ml-2 text-blue-600">
                  - Search results for "{searchTerm}"
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">{error}</div>
            ) : checks.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                {searchTerm
                  ? `No results found for "${searchTerm}"`
                  : "No records found"}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="p-3 text-left text-sm font-semibold text-gray-800 sm:text-base">
                          Check ID
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-800 sm:text-base">
                          User
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-800 sm:text-base">
                          Date & Time
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-800 sm:text-base">
                          Vehicle Reg.
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-800 sm:text-base">
                          Status
                        </th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-800 sm:text-base">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {checks.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-gray-100 transition-colors duration-200 hover:bg-gray-50"
                        >
                          <td className="p-3 text-sm text-gray-700 sm:text-base">
                            {row.id?.substring(0, 8) || "N/A"}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                <span className="text-sm font-medium text-blue-600">
                                  {row.completedBy?.name?.charAt(0) || "U"}
                                </span>
                              </div>
                              <span className="text-sm text-gray-700 sm:text-base">
                                {row.completedBy?.name || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-700 sm:text-base">
                                {row.date
                                  ? new Date(row.date).toLocaleDateString()
                                  : "N/A"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {row.date
                                  ? new Date(row.date).toLocaleTimeString()
                                  : "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-700 sm:text-base">
                                {row.vehicleRegNo || "N/A"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {row.plateNo || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">{getStatusBadge(row.status)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-4">
                              <FaEye className="h-5 w-5 cursor-pointer text-gray-600 transition-colors duration-200 hover:text-blue-600" />
                              <FaEllipsisH className="h-4 w-4 cursor-pointer text-gray-600 transition-colors duration-200 hover:text-gray-800" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-4 lg:hidden">
                  {checks.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <span className="font-medium text-blue-600">
                              {row.completedBy?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {row.id?.substring(0, 8) || "N/A"}
                            </div>
                            <div className="text-sm text-gray-600">
                              {row.completedBy?.name || "N/A"}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(row.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-800">
                            Date & Time
                          </div>
                          <div className="text-gray-600">
                            {row.date
                              ? new Date(row.date).toLocaleDateString()
                              : "N/A"}
                          </div>
                          <div className="text-gray-500">
                            {row.date
                              ? new Date(row.date).toLocaleTimeString()
                              : "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            Vehicle Reg.
                          </div>
                          <div className="text-gray-600">
                            {row.vehicleRegNo || "N/A"}
                          </div>
                          <div className="text-gray-500">
                            {row.plateNo || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-4 border-t border-gray-100 pt-3">
                        <FaEye className="h-5 w-5 cursor-pointer text-gray-600 transition-colors duration-200 hover:text-blue-600" />
                        <FaEllipsisH className="h-4 w-4 cursor-pointer text-gray-600 transition-colors duration-200 hover:text-gray-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Records;
