import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function toF(c) { return Math.round(c * 9/5 + 32); }

function heatIndex(tF, rh) {
  if (tF < 80) return tF;
  let hi = -42.379 + 2.04901523*tF + 10.14333127*rh
    - 0.22475541*tF*rh - 0.00683783*tF*tF
    - 0.05481717*rh*rh + 0.00122874*tF*tF*rh
    + 0.00085282*tF*rh*rh - 0.00000199*tF*tF*rh*rh;
  return Math.round(hi);
}

function RHBar({ value }) {
  const color = value < 30 ? "#e9935a" : value < 60 ? "#5a9ee9" : "#5ae9a0";
  return (
    <div style={{ background: "#1a2235", borderRadius: 6, height: 6, overflow: "hidden", marginTop: 3 }}>
      <div style={{ width: `${Math.min(value,100)}%`, background: color, height: "100%", borderRadius: 6 }} />
    </div>
  );
}

function discomfortLabel(dewF) {
  if (dewF < 55) return { label: "Comfortable", color: "#5ae9a0" };
  if (dewF < 60) return { label: "Noticeable", color: "#a8e05f" };
  if (dewF < 65) return { label: "Sticky", color: "#fdd74b" };
  if (dewF < 70) return { label: "Oppressive", color: "#f8954a" };
  return { label: "Miserable", color: "#f05555" };
}

function HourlyChart({ hours }) {
  if (!hours || hours.length === 0) return null;
  const temps = hours.map(h => h.tempF);
  const feels = hours.map(h => h.feelsF);
  const dews  = hours.map(h => h.dewF);
  const allVals = [...temps, ...feels, ...dews];
  const minV = Math.min(...allVals) - 3;
  const maxV = Math.max(...allVals) + 3;
  const W = 800, H = 160, PAD = 30;
  const xOf = i => PAD + (i / (hours.length - 1)) * (W - PAD*2);
  const yOf = v => H - PAD - ((v - minV) / (maxV - minV)) * (H - PAD*2);

  function polyline(vals, color, dash="") {
    const pts = vals.map((v,i) => `${xOf(i)},${yOf(v)}`).join(" ");
    return <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeDasharray={dash} />;
  }

  const labelHours = hours.filter((_, i) => i % 3 === 0);

  return (
    <div style={{ overflowX: "auto", marginTop: 12 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 320, display: "block" }}>
        {[0.25,0.5,0.75].map(f => (
          <line key={f} x1={PAD} x2={W-PAD} y1={PAD + f*(H-PAD*2)} y2={PAD + f*(H-PAD*2)} stroke="#1a2a3a" strokeWidth="1" />
        ))}
        {polyline(temps, "#e8f0ff")}
        {polyline(feels, "#f8954a")}
        {polyline(dews,  "#7ec8e3", "4 3")}
        {labelHours.map((h, i) => (
          <text key={i} x={xOf(hours.indexOf(h))} y={H-6} textAnchor="middle" fill="#3a5a7a" fontSize="11" fontFamily="monospace">
            {h.label}
          </text>
        ))}
        {[
          { vals: temps, color: "#e8f0ff" },
          { vals: feels, color: "#f8954a" },
          { vals: dews,  color: "#7ec8e3" },
        ].map(({ vals, color }, si) => {
          const noonIdx = Math.floor(hours.length / 2);
          return <circle key={si} cx={xOf(noonIdx)} cy={yOf(vals[noonIdx])} r="3" fill={color} />;
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4, flexWrap: "wrap" }}>
        {[
          { color: "#e8f0ff", label: "Temp", dash: false },
          { color: "#f8954a", label: "Feels Like", dash: false },
          { color: "#7ec8e3", label: "Dewpoint", dash: true },
        ].map(({ color, label, dash }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#5a7fa8" }}>
            <svg width="20" height="10">
              <line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth="2" strokeDasharray={dash ? "4 3" : ""} />
            </svg>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayCard({ day, isToday, isExpanded, onToggle }) {
  const date = new Date(day.date + "T12:00:00");
  const label = isToday ? "Today" : DAYS[date.getDay()];
  const dateStr = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  const { label: disLabel, color: disColor } = discomfortLabel(toF(day.dewpointC));

  return (
    <div style={{
      background: isToday ? "#0f2040" : "#111927",
      border: isExpanded ? "1px solid #2a5298" : isToday ? "1px solid #2a5298" : "1px solid #1e2d45",
      borderRadius: 14, padding: "18px 16px", minWidth: 0, flex: "1 1 150px",
      cursor: "pointer", transition: "border-color 0.2s"
    }} onClick={onToggle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#5a7fa8", letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#3a5a7a" }}>{dateStr}</div>
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: disColor, textAlign: "right" }}>{disLabel}</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#5a7fa8", fontSize: 9, letterSpacing: 1, fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>HIGH</div>
          <div style={{ color: "#e8f0ff", fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{toF(day.tempMaxC)}°</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#5a7fa8", fontSize: 9, letterSpacing: 1, fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>LOW</div>
          <div style={{ color: "#8aaace", fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{toF(day.tempMinC)}°</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#5a7fa8", fontSize: 9, letterSpacing: 1, fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>FEELS</div>
          <div style={{ color: "#f8954a", fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{heatIndex(toF(day.tempMaxC), day.rh)}°</div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #1e2d45", paddingTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ color: "#5a7fa8", fontSize: 9, letterSpacing: 1, fontFamily: "'Space Mono', monospace" }}>DEWPOINT</span>
          <span style={{ color: "#7ec8e3", fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{toF(day.dewpointC)}°F</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ color: "#5a7fa8", fontSize: 9, letterSpacing: 1, fontFamily: "'Space Mono', monospace" }}>HUMIDITY</span>
          <span style={{ color: day.rh < 30 ? "#e9935a" : day.rh < 60 ? "#5a9ee9" : "#5ae9a0", fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{day.rh}%</span>
        </div>
        <RHBar value={day.rh} />
        {day.sunrise && isToday && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <div>
              <div style={{ color: "#5a7fa8", fontSize: 9, letterSpacing: 1, fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>CIVIL DAWN</div>
              <div style={{ color: "#fdd74b", fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                {new Date(new Date(day.sunrise).getTime() - 24*60*1000).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#5a7fa8", fontSize: 9, letterSpacing: 1, fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>CIVIL DUSK</div>
              <div style={{ color: "#f8954a", fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
                {new Date(new Date(day.sunset).getTime() + 24*60*1000).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
              </div>
            </div>
          </div>
        )}
      </div>
      {isExpanded && day.hours && (
        <div style={{ borderTop: "1px solid #1e2d45", marginTop: 14, paddingTop: 10 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#3a5a7a", letterSpacing: 2, marginBottom: 6 }}>HOURLY (°F)</div>
          <HourlyChart hours={day.hours} />
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: 10, fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#2a3a4a" }}>
        {isExpanded ? "▲ collapse" : "▼ hourly detail"}
      </div>
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [forecast, setForecast] = useState([]);
  const [locationLabel, setLocationLabel] = useState(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setStatus("loading");
    setError("");
    setForecast([]);
    setLocationLabel(null);
    setExpanded(null);

    try {
      // Step 1: Geocode the location using Open-Meteo's free geocoding API
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      if (!geoData.results?.length) throw new Error("Location not found. Try a city name or zip code.");

      const { latitude, longitude, name, admin1 } = geoData.results[0];
      const locationName = admin1 ? `${name}, ${admin1}` : name;
      setLocationLabel(locationName);

      // Step 2: Fetch real forecast via our serverless function
      const wxRes = await fetch(`/api/forecast?lat=${latitude}&lon=${longitude}`);
      if (!wxRes.ok) throw new Error("Weather data unavailable. Please try again.");
      const wx = await wxRes.json();

      // Step 3: Build day cards from daily data
      const days = wx.daily.time.map((date, i) => {
        const tempMaxC  = wx.daily.temperature_2m_max[i];
        const tempMinC  = wx.daily.temperature_2m_min[i];
        const dewpointC = wx.daily.dewpoint_2m_mean[i];
        const rh        = wx.daily.relative_humidity_2m_mean[i];

        // Pull the 24 hourly entries for this day
        const dayStart = i * 24;
        const hours = Array.from({ length: 24 }, (_, h) => {
          const idx = dayStart + h;
          const tempC     = wx.hourly.temperature_2m[idx];
          const dewC      = wx.hourly.dewpoint_2m[idx];
          const rhH       = wx.hourly.relative_humidity_2m[idx];
          const tF        = toF(tempC);
          const dF        = toF(dewC);
          const fF        = toF(wx.hourly.apparent_temperature[idx]);
          const label     = h === 0 ? "12am" : h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h-12}pm`;
          return { hour: h, tempC, dewpointC: dewC, rh: rhH, tempF: tF, dewF: dF, feelsF: fF, label };
        });

        const sunrise = wx.daily.sunrise[i];
        const sunset  = wx.daily.sunset[i];
        return { date, tempMaxC, tempMinC, dewpointC, rh, hours, sunrise, sunset };
      });

      setForecast(days);
      setStatus("done");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setStatus("error");
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  const glyphStyle = {
    display: "inline-block", width: 8, height: 8,
    borderRadius: "50%", background: "currentColor",
    marginRight: 6, verticalAlign: "middle"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080f1a", color: "#c8d8f0", fontFamily: "'Space Grotesk', sans-serif", padding: "0 0 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080f1a; }
        input::placeholder { color: #2a3a4a; }
      `}</style>
      <div style={{ background: "#080f1a", borderBottom: "1px solid #131f30", padding: "24px 28px 18px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#2a5298", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Atmospheric</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#e8f0ff", letterSpacing: -0.5, lineHeight: 1.1 }}>
            Dewpoint &amp; Humidity - SWACK Factor<br />
            <span style={{ color: "#2a5298" }}>5-Day Forecast</span>
          </h1>
          {locationLabel && (
            <div style={{ marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#5a7fa8" }}>
              📍 {locationLabel}
            </div>
          )}
        </div>
      </div>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="City, state or zip code…"
            style={{
              flex: 1, background: "#0d1825", border: "1px solid #1e2d45", borderRadius: 10,
              padding: "13px 16px", color: "#e8f0ff", fontSize: 14,
              fontFamily: "'Space Grotesk', sans-serif", outline: "none",
            }}
          />
          <button onClick={handleSearch} disabled={status === "loading"}
            style={{
              background: status === "loading" ? "#1a3060" : "#2a5298",
              color: "#e8f0ff", border: "none", borderRadius: 10,
              padding: "13px 20px", fontSize: 14, fontWeight: 700,
              cursor: status === "loading" ? "not-allowed" : "pointer",
              fontFamily: "'Space Grotesk', sans-serif", whiteSpace: "nowrap"
            }}>
            {status === "loading" ? "Loading…" : "Get Forecast"}
          </button>
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#2a3a4a", marginBottom: 22 }}>
          Live forecast · Click a day card for hourly detail
        </div>
        {error && (
          <div style={{ background: "#1a1020", border: "1px solid #4a1a2a", borderRadius: 10, padding: "12px 16px", marginBottom: 18, color: "#e07070", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
            {error}
          </div>
        )}
        {status === "idle" && (
          <div style={{ textAlign: "center", paddingTop: 40, color: "#2a3a4a", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
            Enter a location above to see your forecast
          </div>
        )}
        {status === "loading" && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", color: "#2a5298", fontSize: 13 }}>⟳  Fetching live forecast…</div>
          </div>
        )}
        {status === "done" && forecast.length > 0 && (
  <>
    <div style={{ marginBottom: 20 }}>
      <DayCard
        key={forecast[0].date} day={forecast[0]} isToday={true}
        isExpanded={expanded === 0}
        onToggle={() => setExpanded(expanded === 0 ? null : 0)}
      />
    </div>
            <div style={{ background: "#0d1825", border: "1px solid #1e2d45", borderRadius: 12, padding: "14px 18px", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#3a5a7a", letterSpacing: 2, marginBottom: 10 }}>DEWPOINT DISCOMFORT SCALE</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { color: "#5ae9a0", range: "< 55°F", label: "Comfortable — pleasant air" },
                  { color: "#a8e05f", range: "55–59°F", label: "Noticeable — slight mugginess" },
                  { color: "#fdd74b", range: "60–64°F", label: "Sticky — noticeably humid" },
                  { color: "#f8954a", range: "65–69°F", label: "Oppressive — Swampy" },
                  { color: "#f05555", range: "≥ 70°F",  label: "Miserable — dangerous for exertion" },
                ].map(({ color, range, label }) => (
                  <div key={range} style={{ display: "flex", alignItems: "center", fontFamily: "'Space Mono', monospace", fontSize: 13, color: "#5a7fa8" }}>
                    <span style={{ ...glyphStyle, color }} />
                    <span style={{ color, marginRight: 8, minWidth: 70 }}>{range}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
              {forecast.slice(1).map((day, i) => (
                <DayCard
                  key={day.date} day={day} isToday={false}
                  isExpanded={expanded === i + 1}
                  onToggle={() => setExpanded(expanded === i + 1 ? null : i + 1)}
                />
              ))}
            </div>
            <div style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#1e2d45", marginTop: 12 }}>
              Data: Open-Meteo · {new Date().toLocaleDateString()}
            </div>
          </>
        )}
      </div>
  </div>
  );
}
