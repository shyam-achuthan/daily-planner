import logo from "./logo.svg";
import html2canvas from "html2canvas";
import React, { useState, useEffect, useRef } from "react";
import { Sun, Download, Trash2 } from "lucide-react";

const DailyPlanner = () => {
  // Create a ref for the planner element (for PDF export)
  const plannerRef = useRef(null);

  // Load data from localStorage or use defaults
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const [date, setDate] = useState(
    loadFromStorage("plannerDate", new Date().toISOString().split("T")[0])
  );
  const [schedule, setSchedule] = useState(
    loadFromStorage("plannerSchedule", {})
  );
  const [priorities, setPriorities] = useState(
    loadFromStorage("plannerPriorities", ["", "", "", ""])
  );
  const [goal, setGoal] = useState(loadFromStorage("plannerGoal", ""));
  const [appointments, setAppointments] = useState(
    loadFromStorage("plannerAppointments", ["", "", "", ""])
  );
  const [notes, setNotes] = useState(loadFromStorage("plannerNotes", ""));
  const [primaryColor, setPrimaryColor] = useState(
    loadFromStorage("plannerPrimaryColor", "#704214")
  );
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Time slots for the schedule
  const timeSlots = [
    "6-7 AM",
    "7-8 AM",
    "8-9 AM",
    "9-10 AM",
    "10-11 AM",
    "11-12 AM",
    "12-1 PM",
    "1-2 PM",
    "2-3 PM",
    "3-4 PM",
    "4-5 PM",
    "5-6 PM",
    "6-7 PM",
    "7-8 PM",
    "8-9 PM",
  ];

  // Days of the week for the header
  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem("plannerDate", date);
      localStorage.setItem("plannerSchedule", JSON.stringify(schedule));
      localStorage.setItem("plannerPriorities", JSON.stringify(priorities));
      localStorage.setItem("plannerGoal", goal);
      localStorage.setItem("plannerAppointments", JSON.stringify(appointments));
      localStorage.setItem("plannerNotes", notes);
      localStorage.setItem("plannerPrimaryColor", primaryColor);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [date, schedule, priorities, goal, appointments, notes, primaryColor]);

  // Handle schedule changes
  const handleScheduleChange = (timeSlot, value) => {
    setSchedule({
      ...schedule,
      [timeSlot]: value,
    });
  };

  // Handle priority changes
  const handlePriorityChange = (index, value) => {
    const newPriorities = [...priorities];
    newPriorities[index] = value;
    setPriorities(newPriorities);
  };

  // Handle appointment changes
  const handleAppointmentChange = (index, value) => {
    const newAppointments = [...appointments];
    newAppointments[index] = value;
    setAppointments(newAppointments);
  };

  // Handle checkbox toggle
  const handleCheckboxToggle = (type, index) => {
    if (type === "priority") {
      const newPriorities = [...priorities];
      newPriorities[index] = newPriorities[index].startsWith("✓ ")
        ? newPriorities[index].substring(2)
        : "✓ " + newPriorities[index];
      setPriorities(newPriorities);
    } else if (type === "appointment") {
      const newAppointments = [...appointments];
      newAppointments[index] = newAppointments[index].startsWith("✓ ")
        ? newAppointments[index].substring(2)
        : "✓ " + newAppointments[index];
      setAppointments(newAppointments);
    }
  };

  // Get current day of week
  const getDayOfWeek = () => {
    try {
      const dateObj = new Date(date);
      return dateObj.getDay();
    } catch (e) {
      return new Date().getDay(); // fallback to current day
    }
  };

  // Function to clear all planner data
  const clearAllData = () => {
    setShowConfirmation(true);
  };

  // Function to confirm clearing all data
  const confirmClearAll = () => {
    // Keep the date and primary color, but clear all other data
    setSchedule({});
    setPriorities(["", "", "", ""]);
    setGoal("");
    setAppointments(["", "", "", ""]);
    setNotes("");
    setShowConfirmation(false);

    // Optional: Set today's date
    setDate(new Date().toISOString().split("T")[0]);
  };

  // Function to cancel clearing data
  const cancelClearAll = () => {
    setShowConfirmation(false);
  };

  // Function to export the planner to PDF
  const exportToPdf = () => {
    // First, we need to load the necessary libraries
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    // Show a loading indicator
    const loadingMessage = document.createElement("div");
    loadingMessage.innerText = "Generating PDF...";
    loadingMessage.style.position = "fixed";
    loadingMessage.style.top = "50%";
    loadingMessage.style.left = "50%";
    loadingMessage.style.transform = "translate(-50%, -50%)";
    loadingMessage.style.padding = "1rem";
    loadingMessage.style.backgroundColor = "white";
    loadingMessage.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
    loadingMessage.style.borderRadius = "4px";
    loadingMessage.style.zIndex = "9999";
    document.body.appendChild(loadingMessage);

    // Format date for the filename
    const formatDate = (dateString) => {
      const d = new Date(dateString);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
    };

    // Load the required libraries and generate the PDF
    Promise.all([
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
      ),
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
      ),
    ])
      .then(() => {
        // Now both libraries are loaded
        const { jsPDF } = window.jspdf;

        // Capture the planner as an image
        html2canvas(plannerRef.current, {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: false,
        }).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");

          // Calculate the PDF dimensions (Letter size: 8.5 x 11 inches)
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "in",
            format: "letter",
          });

          const imgWidth = 8; // Slightly less than full width to add margins
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Add the image to the PDF
          pdf.addImage(imgData, "PNG", 0.25, 0.25, imgWidth, imgHeight);

          // Save the PDF
          pdf.save(`daily-planner-${formatDate(date)}.pdf`);

          // Remove the loading message
          document.body.removeChild(loadingMessage);
        });
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        loadingMessage.innerText = "Error generating PDF. Please try again.";
        setTimeout(() => {
          document.body.removeChild(loadingMessage);
        }, 3000);
      });
  };

  return (
    <div
      style={{
        padding: "1.5rem",
        maxWidth: "64rem",
        margin: "0 auto",
        fontFamily: "serif",
      }}
    >
      {/* PDF Export Button */}
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex" }}>
          <button
            onClick={exportToPdf}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.5rem",
              border: `1px solid ${primaryColor}`,
              borderRadius: "0.25rem",
              color: primaryColor,
              marginRight: "0.5rem",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <Download size={18} style={{ marginRight: "0.25rem" }} /> Export to
            PDF
          </button>
          <button
            onClick={clearAllData}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.5rem",
              border: `1px solid ${primaryColor}`,
              borderRadius: "0.25rem",
              color: primaryColor,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <Trash2 size={18} style={{ marginRight: "0.25rem" }} /> Clear All
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <label
              htmlFor="colorPicker"
              style={{ marginRight: "0.5rem", color: primaryColor }}
            >
              Theme Color:
            </label>
            <input
              type="color"
              id="colorPicker"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              style={{
                width: "2rem",
                height: "2rem",
                borderRadius: "0.25rem",
                cursor: "pointer",
              }}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "0.5rem",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              maxWidth: "28rem",
              width: "100%",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                color: primaryColor,
              }}
            >
              Clear All Data?
            </h3>
            <p style={{ marginBottom: "1.5rem" }}>
              This will reset all planner data for a new day. This action cannot
              be undone. Do you want to continue?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
              }}
            >
              <button
                onClick={cancelClearAll}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.25rem",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                style={{
                  padding: "0.5rem 1rem",
                  border: `1px solid ${primaryColor}`,
                  borderRadius: "0.25rem",
                  backgroundColor: primaryColor,
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main planner content */}
      <div
        ref={plannerRef}
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "0.5rem",
          overflow: "hidden",
          backgroundColor: "#faf8f1",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "1px solid #e2e8f0",
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          }}
        >
          <div
            style={{
              gridColumn: "span 8 / span 8",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <h1
              style={{
                fontSize: "2.25rem",
                fontFamily: "serif",
                color: primaryColor,
              }}
            >
              DAILY PLANNER
            </h1>
          </div>
          <div
            style={{
              gridColumn: "span 4 / span 4",
              padding: "1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderLeft: "1px solid #e2e8f0",
            }}
          >
            <Sun size={48} style={{ color: primaryColor }} />
          </div>
        </div>

        {/* Date and Days of Week */}
        <div
          style={{
            borderBottom: "1px solid #e2e8f0",
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          }}
        >
          <div
            style={{
              gridColumn: "span 7 / span 7",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ marginRight: "0.5rem", color: primaryColor }}>
              DATE :
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                borderBottom: "1px solid #a0aec0",
                backgroundColor: "transparent",
                padding: "0.25rem",
                color: primaryColor,
                outline: "none",
              }}
            />
          </div>
          <div
            style={{
              gridColumn: "span 5 / span 5",
              borderLeft: "1px solid #e2e8f0",
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            }}
          >
            {daysOfWeek.map((day, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: primaryColor,
                  fontWeight: index === getDayOfWeek() ? "bold" : "normal",
                  backgroundColor:
                    index === getDayOfWeek()
                      ? `${primaryColor}20`
                      : "transparent",
                }}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
          }}
        >
          {/* Schedule */}
          <div
            style={{
              gridColumn: "span 7 / span 7",
              borderRight: "1px solid #e2e8f0",
            }}
          >
            <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "0.5rem",
                  color: primaryColor,
                }}
              >
                TODAY'S SCHEDULE
              </h2>

              {timeSlots.map((timeSlot) => (
                <div
                  key={timeSlot}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    borderBottom: "1px solid #edf2f7",
                  }}
                >
                  <div
                    style={{
                      padding: "0.5rem",
                      borderRight: "1px solid #edf2f7",
                      display: "flex",
                      alignItems: "center",
                      color: primaryColor,
                    }}
                  >
                    {timeSlot}
                  </div>
                  <div style={{ gridColumn: "span 2 / span 2", padding: "0" }}>
                    <input
                      type="text"
                      value={schedule[timeSlot] || ""}
                      onChange={(e) =>
                        handleScheduleChange(timeSlot, e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        backgroundColor: "transparent",
                        border: "none",
                        outline: "none",
                      }}
                      placeholder=""
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ gridColumn: "span 5 / span 5" }}>
            {/* Priorities */}
            <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "0.5rem",
                  color: primaryColor,
                }}
              >
                TOP PRIORITIES
              </h2>

              {priorities.map((priority, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      border: `1px solid ${primaryColor}`,
                      marginRight: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => handleCheckboxToggle("priority", index)}
                  >
                    {priority.startsWith("✓ ") && (
                      <span style={{ color: primaryColor }}>✓</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={
                      priority.startsWith("✓ ")
                        ? priority.substring(2)
                        : priority
                    }
                    onChange={(e) =>
                      handlePriorityChange(index, e.target.value)
                    }
                    style={{
                      width: "100%",
                      borderBottom: "1px solid #edf2f7",
                      padding: "0.25rem",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Today's Goal */}
            <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "0.5rem",
                  color: primaryColor,
                }}
              >
                TODAY'S GOAL
              </h2>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                style={{
                  width: "100%",
                  height: "8rem",
                  border: "1px solid #e2e8f0",
                  padding: "0.5rem",
                  backgroundColor: "transparent",
                  resize: "none",
                  outline: "none",
                }}
              />
            </div>

            {/* Appointments */}
            <div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0" }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "0.5rem",
                  color: primaryColor,
                }}
              >
                APPOINTMENT
              </h2>

              {appointments.map((appointment, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "1.25rem",
                      height: "1.25rem",
                      border: `1px solid ${primaryColor}`,
                      marginRight: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => handleCheckboxToggle("appointment", index)}
                  >
                    {appointment.startsWith("✓ ") && (
                      <span style={{ color: primaryColor }}>✓</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={
                      appointment.startsWith("✓ ")
                        ? appointment.substring(2)
                        : appointment
                    }
                    onChange={(e) =>
                      handleAppointmentChange(index, e.target.value)
                    }
                    style={{
                      width: "100%",
                      borderBottom: "1px solid #edf2f7",
                      padding: "0.25rem",
                      backgroundColor: "transparent",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ padding: "1rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              marginBottom: "0.5rem",
              color: primaryColor,
            }}
          >
            NOTES
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: "100%",
              height: "6rem",
              border: "1px solid #e2e8f0",
              padding: "0.5rem",
              backgroundColor: "transparent",
              resize: "none",
              outline: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DailyPlanner;
