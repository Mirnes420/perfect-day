import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function App() {
  const [plan, setPlan] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationMeta, setLocationMeta] = useState({ city: '', weather: '' });
  const [finalPlan, setFinalPlan] = useState([]);
  
  const itineraryRef = useRef(null);

  const handleMagicButtonClick = async () => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await sendDataToDjango(latitude, longitude);
      },
      (error) => {
        setLoading(false);
        alert("Location access denied.");
      }
    );
  };

  const sendDataToDjango = async (lat, lng) => {
    try {
      // Mocking response for demonstration - replace with your actual fetch
      const response = await fetch('/api/generate-perfect-day/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await response.json();
      
      setLocationMeta({ city: data.city, weather: data.weather });
      setPlan(data.plan);
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // FIX: Ensure every item added to the plan gets a unique ID to prevent cross-editing
  const addToPlan = (itemToAdd) => {
    const newItem = { 
      ...itemToAdd, 
      id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
    };
    setPlan([...plan, newItem]);
    setSuggestions(suggestions.filter(item => item.id !== itemToAdd.id));
  };

  const updatePlanItem = (id, field, value) => {
    setPlan(prevPlan => prevPlan.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeFromPlan = (id) => {
    setPlan(plan.filter(item => item.id !== id));
  };

  const submitPlan = () => {
    setFinalPlan([...plan]);
  };

  // --- EXPORT LOGIC ---
  const exportAsImage = async () => {
    if (!itineraryRef.current) return;
    const canvas = await html2canvas(itineraryRef.current, { 
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true 
    });
    const link = document.createElement('a');
    link.download = 'my-perfect-day.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportAsPDF = async () => {
    if (!itineraryRef.current) return;
    const canvas = await html2canvas(itineraryRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save('my-perfect-day.pdf');
  };

return (
    <div style={styles.pageWrapper}>
      <header style={styles.header}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✨ Perfect Day</h1>
        {locationMeta.city && (
          <div style={styles.badge}>
            📍 {locationMeta.city} • {locationMeta.weather}
          </div>
        )}
      </header>

      <div style={styles.mainGrid}>
        {/* LEFT: EDITOR SECTION */}
        <div style={styles.editorPane}>
          <button onClick={handleMagicButtonClick} disabled={loading} style={styles.magicBtn}>
            {loading ? "Creating Magic..." : "Generate New Plan"}
          </button>

          <div style={{ marginTop: '30px' }}>
            <h3 style={styles.subHeading}>Edit Schedule</h3>
            {plan.length === 0 && !loading && <p style={{ color: '#888' }}>No activities yet.</p>}
            
            {plan.map((item) => (
              <div key={item.id} style={styles.editCard}>
                <input
                  style={styles.timeInput}
                  value={item.time || ''}
                  onChange={(e) => updatePlanItem(item.id, 'time', e.target.value)}
                  placeholder="00:00"
                />
                <textarea
                  style={styles.activityInput}
                  value={item.activity || ''}
                  onChange={(e) => updatePlanItem(item.id, 'activity', e.target.value)}
                  rows={2}
                />
                <button 
                  title='Remove from your plan.' 
                  onClick={() => removeFromPlan(item.id)} 
                  style={styles.btnTransRemove}
                >✕</button>
              </div>
            ))}
            
            {plan.length > 0 && (
              <button onClick={submitPlan} style={styles.submitBtn}>
                Confirm Itinerary →
              </button>
            )}
          </div>

          {suggestions.length > 0 && (
            <div style={styles.suggestionBox}>
              <h4 style={{ marginTop: 0, color: '#aaa' }}>Quick Adds</h4>
              {suggestions.map((item) => (
                <div key={item.id} style={styles.suggestionItem}>
                  <span style={{ flex: 1 }}>{item.activity}</span>
                  <button 
                    title='Add to your plan.' 
                    onClick={() => addToPlan(item)} 
                    style={styles.btnTransAdd}
                  >+</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: FINAL VIEW SECTION (Only visible when finalPlan exists) */}
        {finalPlan.length > 0 && (
          <div style={styles.itineraryPane}>
            <div ref={itineraryRef} style={styles.itineraryPaper}>
              <h2 style={{ marginTop: 0 }}>Final Itinerary</h2>
              <h3 style={styles.subHeading}>
                Your Perfect Day in {locationMeta.city}
              </h3>
              {finalPlan.map((item, idx) => (
                <div key={idx} style={styles.finalRow}>
                  <span style={styles.finalTime}>{item.time}</span>
                  <span style={styles.finalActivity}>{item.activity}</span>
                </div>
              ))}
            </div>
            

            <div style={styles.exportControls}>
              <button 
                title="Save as Image" 
                onClick={exportAsImage} 
                style={styles.exportBtn}
              >Save as Image</button>
              <button 
                title="Save as PDF" 
                onClick={exportAsPDF} 
                style={{ ...styles.exportBtn, background: '#333' }}
              >Save as PDF</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 850px) {
          /* Force columns to stack on mobile */
          div[style*="display: flex"] { flex-direction: column !important; }
          /* Ensure editor takes full width when alone */
          div[style*="flex: 1.2"] { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: { padding: '40px 20px', maxWidth: '100%', margin: 'auto', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh'},
  header: { textAlign: 'center', marginBottom: '40px' },
  badge: { display: 'inline-block', padding: '8px 16px', background: '#f0f0f0', borderRadius: '20px', fontSize: '0.9rem', color: '#555' },
  mainGrid: { display: 'flex', gap: '50px', alignItems: 'flex-start' },
  editorPane: { flex: 1.2, minWidth: '320px' },
  itineraryPane: { flex: 0.8, minWidth: '320px', position: 'sticky', top: '20px' },
  
  // Cards & Inputs
  editCard: { display: 'flex', gap: '10px', padding: '15px 0', borderBottom: '1px solid #eee', alignItems: 'center' },
  timeInput: { width: '70px', padding: '8px', border: '1px solid #ddd', borderRadius: '6px' },
  activityInput: { flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '6px', resize: 'none', fontSize: '0.95rem' },
  
  // Minimalist Buttons
  btnTransRemove: { background: 'transparent', color: '#ff4d4d', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' },
  btnTransAdd: { background: 'transparent', color: '#2ecc71', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' },
  
  // Layout Components
  itineraryPaper: { background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' },
  finalRow: { display: 'flex', padding: '12px 0', borderBottom: '1px solid #f9f9f9' },
  finalTime: { width: '80px', fontWeight: '700', color: '#007bff' },
  finalActivity: { flex: 1, color: '#333' },
  
  // Action Buttons
  magicBtn: { width: '100%', padding: '16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' },
  submitBtn: { width: '100%', marginTop: '20px', padding: '12px', background: '#fff', border: '2px solid #007bff', color: '#007bff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  suggestionBox: { marginTop: '40px', background: '#1a1a1a', padding: '20px', borderRadius: '12px', color: '#fff' },
  suggestionItem: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #333', fontSize: '0.9rem' },
  exportControls: { display: 'flex', gap: '10px', marginTop: '20px' },
  exportBtn: { flex: 1, padding: '12px', background: '#666', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  subHeading: { fontSize: '1.2rem', color: '#444', marginBottom: '10px' }
};

export default App;