import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  CreditCard,
  Plus,
  BarChart2,
  User,
  Scan,
  X,
  Camera,
  ArrowUpRight,
  Receipt,
  Search,
  ChevronRight,
  Send,
  Download,
  Wallet,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorker } from 'tesseract.js';
import './App.css';

const App = () => {
  const [receipts, setReceipts] = useState(() => {
    // Uygulama başladığında yerel depolamadaki verileri yükle
    const savedReceipts = localStorage.getItem('camfis_receipts');
    return savedReceipts ? JSON.parse(savedReceipts) : [];
  });

  const [activeTab, setActiveTab] = useState('home');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Fişler değiştikçe yerel depolamaya (localStorage) kaydet
  useEffect(() => {
    localStorage.setItem('camfis_receipts', JSON.stringify(receipts));
  }, [receipts]);

  // Trigger camera start when isScanning becomes true
  useEffect(() => {
    if (isScanning) {
      const initCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access denied", err);
          alert("Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.");
          setIsScanning(false);
        }
      };
      initCamera();
    }
  }, [isScanning]);

  const totalBalance = receipts.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });

  const startCamera = () => {
    setIsScanning(true);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const captureAndScan = async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');
    stopCamera();

    try {
      const worker = await createWorker('tur+eng');
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      processOCR(text);
    } catch (err) {
      console.error("OCR error", err);
      alert("Failed to read receipt. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const processOCR = (text) => {
    console.log("Extracted Text:", text);
    // Simple extraction logic for demo
    const lines = text.split('\n');
    let amount = 0;
    let name = "New Receipt";

    // Look for numbers that might be totals (TOPLAM, TOTAL, etc.)
    const totalMatch = text.match(/(TOPLAM|TOTAL|GENEL)\s*[:=]?\s*(\d+[,.]\d{2})/i);
    if (totalMatch) {
      amount = parseFloat(totalMatch[2].replace(',', '.'));
    } else {
      // Fallback: look for the largest number
      const amounts = text.match(/\d+[,.]\d{2}/g);
      if (amounts) {
        const floatAmounts = amounts.map(a => parseFloat(a.replace(',', '.')));
        amount = Math.max(...floatAmounts);
      }
    }

    // Look for potential store names (usually first non-empty line)
    const firstLine = lines.find(l => l.trim().length > 3);
    if (firstLine) name = firstLine.trim();

    const newReceipt = {
      id: Date.now(),
      name: name,
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
      amount: amount || 0,
      vat: (amount * 0.10).toFixed(2), // Estimated 10%
      category: 'General'
    };

    setReceipts([newReceipt, ...receipts]);
    setScanResult(newReceipt);
    setActiveTab('home');
  };

  return (
    <div className="app-container">
      {/* Header Section */}
      <div className="header-gradient">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Hello Efeka!</h3>
            <p style={{ fontSize: '12px', opacity: 0.8 }}>Welcome back</p>
          </div>
          <div className="action-icon" style={{ width: 40, height: 40 }}>
            <User size={20} />
          </div>
        </div>

        <div className="balance-card">
          <p className="balance-title">YOUR TOTAL EXPENSES</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="balance-amount">{totalBalance} ₺</h1>
            <BarChart2 size={24} style={{ opacity: 0.5 }} />
          </div>

          <div className="action-buttons">
            <button className="action-btn">
              <div className="action-icon"><Send size={20} /></div>
              <span>Transfer</span>
            </button>
            <button className="action-btn">
              <div className="action-icon"><Download size={20} /></div>
              <span>Withdraw</span>
            </button>
            <button className="action-btn">
              <div className="action-icon"><Coins size={20} /></div>
              <span>Invest</span>
            </button>
            <button className="action-btn">
              <div className="action-icon"><Wallet size={20} /></div>
              <span>Top up</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'home' && (
          <>
            <div style={{ background: 'rgba(124, 58, 237, 0.1)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'white', padding: 8, borderRadius: 10 }}>🚀</div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#4c1d95' }}>Check your spending insights!</p>
              </div>
              <ChevronRight size={18} color="#4c1d95" />
            </div>

            <div className="section-title">
              <h2>Recent Receipts</h2>
              <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>View All</p>
            </div>

            <AnimatePresence>
              {receipts.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="receipt-item"
                >
                  <div className="receipt-icon">
                    <Receipt size={22} />
                  </div>
                  <div className="receipt-info">
                    <p className="receipt-name">{item.name}</p>
                    <p className="receipt-date">{item.date} • {item.category}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="receipt-amount">{item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                    <p style={{ fontSize: '10px', color: 'var(--success)' }}>Vat: {item.vat} ₺</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}

        {activeTab === 'stat' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="section-title">
              <h2>Spending Statistics</h2>
            </div>

            <div className="balance-card" style={{ background: 'white', color: 'var(--text-main)', marginBottom: 24 }}>
              <p className="balance-title" style={{ color: 'var(--text-muted)' }}>TOTAL VAT REMITTED</p>
              <h1 className="balance-amount" style={{ color: 'var(--primary)' }}>
                {receipts.reduce((acc, curr) => acc + parseFloat(curr.vat), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </h1>
            </div>

            <div className="section-title">
              <h2>Income Breakdown</h2>
            </div>

            {['Grocery', 'Transport', 'Food', 'Shopping', 'General'].map((cat) => {
              const catTotal = receipts.filter(r => r.category === cat).reduce((a, b) => a + b.amount, 0);
              const percentage = totalBalance === "0" ? 0 : Math.round((catTotal / parseFloat(totalBalance.replace('.', '').replace(',', '.'))) * 100);
              if (catTotal === 0 && cat !== 'General') return null;

              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, background: 'white', padding: 12, borderRadius: 12 }}>
                  <div style={{ width: 40, height: 40, background: '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }}></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600' }}>{cat}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: '700' }}>{catTotal.toLocaleString('tr-TR')} ₺</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{percentage}%</p>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={24} />
          <span>Home</span>
        </div>
        <div className={`nav-item ${activeTab === 'card' ? 'active' : ''}`} onClick={() => setActiveTab('card')}>
          <CreditCard size={24} />
          <span>Card</span>
        </div>

        <div className="scan-button-container" onClick={startCamera}>
          <div className="scan-btn">
            <Scan size={28} />
          </div>
        </div>

        <div className={`nav-item ${activeTab === 'stat' ? 'active' : ''}`} onClick={() => setActiveTab('stat')}>
          <BarChart2 size={24} />
          <span>Stat</span>
        </div>
        <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={24} />
          <span>Profile</span>
        </div>
      </nav>

      {/* Scanner Modal */}
      {isScanning && (
        <div className="scanner-overlay">
          <div className="scanner-header">
            <button onClick={stopCamera} style={{ background: 'transparent', border: 'none', color: 'white' }}>
              <X size={28} />
            </button>
            <p style={{ fontWeight: '600' }}>Scan Receipt</p>
            <div style={{ width: 28 }}></div>
          </div>

          <div className="camera-preview">
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div className="scan-frame"></div>
          </div>

          <div className="scanner-actions">
            <button className="capture-btn" onClick={captureAndScan}>
              <div className="capture-btn-inner"></div>
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing Receipt...</p>
          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: 8 }}>AI is analyzing the text</p>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default App;
