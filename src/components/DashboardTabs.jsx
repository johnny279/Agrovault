import { useState } from "react";

function DashboardTabs({ tabs }) {
  const [active, setActive] = useState(tabs[0].label);

  return (
    <>
      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={`tab-button ${active === tab.label ? "tab-button--active" : ""}`}
            onClick={() => setActive(tab.label)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.label} style={{ display: active === tab.label ? "block" : "none" }}>
          {tab.content}
        </div>
      ))}
    </>
  );
}

export default DashboardTabs;