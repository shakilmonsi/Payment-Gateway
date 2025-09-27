import { useEffect, useState } from "react";
import { useAuth } from "../../../../featured/auth/AuthContext";
import { postData, getData } from "../../../../utils/axiosInstance";

export const User = () => {
  const { user } = useAuth();
  const [checkedFaulty, setCheckedFaulty] = useState({});
  const [checkedCorrect, setCheckedCorrect] = useState({});
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [defaultValues, setDefaultValues] = useState({
    completedBy: "",
    date: "",
    time: "",
  });

  useEffect(() => {
    const fetchChecklistItems = async () => {
      try {
        setLoading(true);
        const data = await getData("checklist-items");
        setChecklistItems(data);
      } catch (error) {
        console.error("Failed to fetch checklist items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklistItems();

    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];
    const formattedTime = now.toTimeString().split(" ")[0].substring(0, 5);

    setDefaultValues({
      completedBy: user?.name || "",
      date: formattedDate,
      time: formattedTime,
    });
  }, [user]);

  const toggleFaulty = (id) => {
    setCheckedFaulty((prev) => ({ ...prev, [id]: !prev[id] }));
    setCheckedCorrect((prev) => ({ ...prev, [id]: false }));
  };

  const toggleCorrect = (id) => {
    setCheckedCorrect((prev) => ({ ...prev, [id]: !prev[id] }));
    setCheckedFaulty((prev) => ({ ...prev, [id]: false }));
  };

  const handle = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const formObject = Object.fromEntries(formData.entries());
    console.log("Step 1: Raw Form Data from UI:", formObject);
    console.log("-----------------------------------------");

    console.log("Step 2: Checked Faulty Items State:", checkedFaulty);
    console.log("Step 2: Checked Correct Items State:", checkedCorrect);
    console.log("-----------------------------------------");

    const mileageValue = formData.get("mileage");
    const mileage =
      mileageValue && !isNaN(mileageValue) ? Number(mileageValue) : 0;
    console.log("Converted mileage value:", mileage);

    const itemResponses = checklistItems
      .map((item) => {
        if (checkedCorrect[item.id]) {
          console.log(`Mapping item ${item.id}: Correct`);
          return {
            checklistItemId: item.id,
            status: "CORRECT",
          };
        }
        if (checkedFaulty[item.id]) {
          console.log(`Mapping item ${item.id}: Faulty`);
          return {
            checklistItemId: item.id,
            status: "FAULTY",
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log("Step 3: Final itemResponses Array:", itemResponses);
    console.log("-----------------------------------------");

    const payload = {
      vehicleRegNo: formData.get("vehicle"),
      mileage: mileage,
      status: "completed",
      details: "daily check completed successfully",
      badgeNo: formData.get("driver"),
      plateNo: formData.get("plate"),
      notes: formData.get("notes") || null,
      completedById: user?.id, // ✅ correct field expected by Prisma
      itemResponses,
    };

    console.log("Step 4: Final API Payload:", payload);
    console.log("-----------------------------------------");

    try {
      console.log("Step 5: Sending POST request to /checks...");
      const response = await postData("checks", payload);
      console.log("Step 6: API Response (Success):", response);
      alert("Form submitted successfully!");
      event.target.reset();
      setCheckedFaulty({});
      setCheckedCorrect({});
    } catch (error) {
      console.error("Step 7: Submission failed:", error);
      if (error.response) {
        console.error("Error Response Data:", error.response.data);
        console.error("Error Response Status:", error.response.status);
        console.error("Error Response Headers:", error.response.headers);
      } else if (error.request) {
        console.error("No response received from the server:", error.request);
      } else {
        console.error("Error Message:", error.message);
      }
      alert("Form submission failed. Please check the console for details.");
    }
  };

  if (loading) {
    return <div>Loading checklist...</div>;
  }

  return (
    <div className="mt-[72px] md:mt-0">
      <form onSubmit={handle}>
        {/* --- FORM HEADER --- */}
        <div className="min-h-screen w-full bg-white p-6 font-['Roboto'] md:p-8 lg:p-10">
          <div className="rounded-md border border-gray-300 p-6 shadow-sm">
            <h1 className="text-lg font-bold text-[#212121] sm:text-xl md:text-2xl">
              APPENDIX J – ROUTINE DAILY VEHICLE CONDITION CHECK
            </h1>
            <p className="mt-2 text-sm text-neutral-600 sm:text-base">
              South Cambridgeshire District Council Daily Private Hire/Taxi
              Visual Inspection for All Vehicles
            </p>
            <div className="mt-2 space-y-2 text-sm text-gray-800 sm:mt-3 md:mt-4">
              <p className="flex w-full flex-wrap items-center text-base font-normal text-[#555555]">
                Completed by{" "}
                <input
                  type="text"
                  name="completed"
                  defaultValue={defaultValues.completedBy}
                  className="ml-2 min-w-[150px] flex-1 border-b border-dotted border-gray-600 bg-transparent outline-none"
                />
              </p>
              <p className="flex w-full flex-wrap items-center text-base font-normal text-[#555555]">
                Date{" "}
                <input
                  type="date"
                  name="date"
                  defaultValue={defaultValues.date}
                  className="ml-2 min-w-[120px] flex-[2] border-b border-dotted border-gray-600 bg-transparent outline-none"
                />{" "}
                Time{" "}
                <input
                  type="time"
                  name="time"
                  defaultValue={defaultValues.time}
                  className="ml-2 min-w-[100px] flex-[1] border-b border-dotted border-gray-600 bg-transparent outline-none"
                />
              </p>
              <p className="flex w-full flex-wrap items-center text-base font-normal text-[#555555]">
                Vehicle Reg No{" "}
                <input
                  type="text"
                  name="vehicle"
                  className="ml-2 min-w-[120px] flex-[2] border-b border-dotted border-gray-600 bg-transparent outline-none"
                />{" "}
                Plate No{" "}
                <input
                  type="text"
                  name="plate"
                  className="ml-2 min-w-[100px] flex-[1] border-b border-dotted border-gray-600 bg-transparent outline-none"
                />
              </p>
              <p className="flex w-full flex-wrap items-center text-base font-normal text-[#555555]">
                Driver Badge No{" "}
                <input
                  type="text"
                  name="driver"
                  className="ml-2 min-w-[120px] flex-[2] border-b border-dotted border-gray-600 bg-transparent outline-none"
                />{" "}
                Mileage{" "}
                <input
                  type="text"
                  name="mileage"
                  className="ml-2 min-w-[100px] flex-[1] border-b border-dotted border-gray-600 bg-transparent outline-none"
                />
              </p>
            </div>
          </div>

          {/* --- CHECKLIST TABLE --- */}
          <div className="mt-8 overflow-x-auto rounded-md border border-[#B9B9B9] text-black shadow-sm md:mt-14">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 text-left font-medium">
                  <th className="w-1/3 border border-gray-300 px-4 py-2">
                    Area
                  </th>
                  <th className="w-1/2 border border-gray-300 px-4 py-2">
                    Requirement
                  </th>
                  <th className="w-[80px] border border-gray-300 px-4 py-2 text-center">
                    Faulty
                  </th>
                  <th className="w-[80px] border border-gray-300 px-4 py-2 text-center">
                    Correct
                  </th>
                </tr>
              </thead>
              <tbody>
                {checklistItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={idx % 2 !== 0 ? "bg-[#F7F6F666]" : "bg-white"}
                  >
                    <td className="border border-gray-300 px-4 py-2 align-top text-[14px] font-normal text-[#555555]">
                      {item.area}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 align-top text-[14px] font-normal text-[#555555]">
                      {item.requirement.split("\n").map((req, i) => (
                        <p key={i}>• {req.trim()}</p>
                      ))}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-normal text-[#555555]">
                      <div
                        onClick={() => toggleFaulty(item.id)}
                        className={`mx-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded border ${
                          checkedFaulty[item.id]
                            ? "border-black bg-white text-black"
                            : "border-gray-400 text-transparent"
                        }`}
                      >
                        ✓
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-normal text-[#555555]">
                      <div
                        onClick={() => toggleCorrect(item.id)}
                        className={`mx-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded border ${
                          checkedCorrect[item.id]
                            ? "border-black bg-white text-black"
                            : "border-gray-400 text-transparent"
                        }`}
                      >
                        ✓
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- NOTES & SUBMIT --- */}
          <div className="mt-7 md:mt-10">
            <textarea
              name="notes"
              placeholder="Notes"
              className="h-32 w-full resize-none rounded-md border border-gray-300 p-4 text-gray-700 placeholder-gray-400 focus:border-[#d6d1d1] focus:ring-2 focus:ring-[#d6d1d1] focus:outline-none"
            ></textarea>
          </div>
          <div className="mt-6 flex justify-end pb-6">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white shadow-md hover:bg-blue-700"
            >
              Submit Here
            </button>
          </div>

          <p className="mb-5 max-w-[900px] text-base font-normal text-[#555555] md:mb-8">
            confirm that the vehicle has been visually inspected. If no faults
            have been identified and reported, I confirm the vehicle is found to
            be satisfactory at the time of check. If any faults have been
            identified and reported within this form, I confirm the faults will
            be rectified prior to the vehicle conducting any licensed work.
          </p>
          <h3 className="max-w-[800px] text-base font-semibold text-[#212121]">
            Warning: Drivers found to be using a defective vehicle will be in
            breach of their driver licence condition and could be at the risk of
            sanction, especially if the condition of the vehicle is such that it
            is obvious no routine checks have occurred over a number of
            days.{" "}
          </h3>
        </div>
      </form>
    </div>
  );
};
