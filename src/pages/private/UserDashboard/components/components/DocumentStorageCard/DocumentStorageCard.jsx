import { AlertTriangle, CheckCircle, FileText, XCircle } from "lucide-react";

export const DocumentStorageCard = ({ doc }) => {
  const calculateStats = () => {
    const documentsToCount = doc;
    const totalDocuments = documentsToCount.length;

    const activeCount = documentsToCount.filter(
      (d) => d.status === "Subscriber",
    ).length;
    const expiringSoonCount = documentsToCount.filter((d) => {
      if (!d.expiryDate) return false;
      const expiryDate = new Date(d.expiryDate);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow && expiryDate > today;
    }).length;

    const expiredCount = documentsToCount.filter((d) => {
      if (!d.expiryDate) return false;
      const expiryDate = new Date(d.expiryDate);
      const today = new Date();
      return expiryDate < today;
    }).length;

    const pendingCount = documentsToCount.filter(
      (d) => d.status === "Pending",
    ).length;

    return [
      {
        icon: FileText,
        value: totalDocuments.toString(),
        label: "Total Documents",
        color: "#555555",
      },
      {
        icon: CheckCircle,
        value: activeCount.toString(),
        label: "Subscriber",
        color: "blue",
      },
      {
        icon: AlertTriangle,
        value: expiringSoonCount.toString(),
        label: "Expiring Soon",
        color: "amber",
      },
      {
        icon: XCircle,
        value: expiredCount.toString(),
        label: "Expired",
        color: "rose",
      },
      {
        icon: AlertTriangle,
        value: pendingCount.toString(),
        label: "Pending",
        color: "amber",
      },
    ];
  };

  const stats = calculateStats();

  const getStatIconClasses = (color) => {
    switch (color) {
      case "blue":
        return "text-blue-600";
      case "amber":
        return "text-amber-400";
      case "rose":
        return "text-rose-400";
      case "pink":
        return "text-pink-400";
      default:
        return "text-blue-600";
    }
  };

  const getStatValueClasses = (color) => {
    switch (color) {
      case "blue":
        return "text-blue-600";
      case "green":
        return "text-green-600";
      case "amber":
        return "text-amber-400";
      case "rose":
        return "text-rose-400";
      case "pink":
        return "text-pink-400";
      default:
        return "text-gray-600";
    }
  };
  
  return (
    <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-5 md:gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="flex flex-col gap-2.5 rounded-xl border border-neutral-300 bg-white p-4 sm:p-6"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex items-center justify-center rounded p-1 ${getStatIconClasses(stat.color)}`}
            >
              <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <div
                className={`font-['Roboto'] text-2xl font-[600] sm:text-3xl ${getStatValueClasses(stat.color)}`}
              >
                {stat.value}
              </div>
              <div className="font-['Roboto'] text-sm font-normal text-neutral-600 sm:text-base">
                {stat.label}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
