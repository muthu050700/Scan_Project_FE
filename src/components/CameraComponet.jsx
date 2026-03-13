import React, { useState, useCallback, useRef } from 'react'
import Camera, { FACING_MODES } from "react-html5-camera-photo"
import "react-html5-camera-photo/build/css/index.css"
import { sendImageToBackend } from "../utils/decodeFormData"
import { motion, AnimatePresence } from "framer-motion"
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// ── Icons (inline SVG to avoid extra dependencies) ──────────────────────────
const ScanIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
        <path strokeLinecap="round" d="M7 12h10" />
    </svg>
)

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
)

const XIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const FlashIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H13L13 2z" />
    </svg>
)

const InfoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
    </svg>
)

const FlipIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
)

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
)

const CameraIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
)

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const PdfIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-4.414-4.414A2 2 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-6 4h6m-6-8h3" />
        <path d="M13 3v4a2 2 0 002 2h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)


// ── Animation variants ──────────────────────────────────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
}

const headerVariants = {
    hidden: { y: -80, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 15, delay: 0.1 } },
}

const mainVariants = {
    hidden: { scale: 0.85, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 18, delay: 0.25 } },
}

const footerVariants = {
    hidden: { y: 80, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 15, delay: 0.35 } },
}

const overlayVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
}

const toastVariants = {
    hidden: { y: 80, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 180, damping: 18 } },
    exit: { y: 80, opacity: 0, transition: { duration: 0.25 } },
}

const beamVariants = {
    animate: {
        y: [0, 220, 0],
        opacity: [0.6, 1, 0.6],
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
    },
}

// ── Scanning beam gradient line ─────────────────────────────────────────────
const ScanBeam = () => (
    <motion.div
        variants={beamVariants}
        animate="animate"
        className="absolute left-0 right-0 h-[3px] pointer-events-none z-10"
        style={{
            background: "linear-gradient(90deg, transparent 0%, #a855f7 20%, #c084fc 50%, #a855f7 80%, transparent 100%)",
            boxShadow: "0 0 16px 4px rgba(168, 85, 247, 0.6)",
        }}
    />
)

// ── Corner brackets overlay ────────────────────────────────────────────────
const ViewfinderCorners = () => (
    <>
        <div className="corner-tl" />
        <div className="corner-tr" />
        <div className="corner-bl" />
        <div className="corner-br" />
    </>
)

// ── Main Component ──────────────────────────────────────────────────────────
const CameraComponent = () => {
    const [status, setStatus] = useState("idle") // idle | scanning | success | error
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [facingMode, setFacingMode] = useState(FACING_MODES.ENVIRONMENT)
    const [ripple, setRipple] = useState(false)
    const [isCameraReady, setIsCameraReady] = useState(false)
    const [previewImage, setPreviewImage] = useState(null)
    const [previewType, setPreviewType] = useState("image") // image | pdf
    const [scanResult, setScanResult] = useState(null)
    const [isFullScreen, setIsFullScreen] = useState(false)

    const fileInputRef = useRef(null)

    const generateExcel = async (data) => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Scanned Data');

            let items = [];
            if (data.invoices && Array.isArray(data.invoices)) {
                items = data.invoices;
            } else if (typeof data === 'object' && !Array.isArray(data)) {
                // If it's a single object, wrap it in an array
                const { success, pages, rawText, ...rest } = data;
                items = [rest];
            }

            if (items.length === 0) {
                console.warn('No data to export');
                return;
            }

            // Extract all unique keys from all items to handle inconsistent objects
            const allKeys = new Set();
            items.forEach(item => {
                Object.keys(item).forEach(key => {
                    if (typeof item[key] !== 'object') { // Only primitive fields
                        allKeys.add(key);
                    }
                });
            });

            const keys = Array.from(allKeys);

            // Transform keys into readable headers (camelCase to Title Case)
            const formatHeader = (key) => {
                const result = key.replace(/([A-Z])/g, " $1");
                return result.charAt(0).toUpperCase() + result.slice(1);
            };

            // Define columns dynamically
            worksheet.columns = keys.map(key => ({
                header: formatHeader(key),
                key: key,
                width: Math.max(15, key.length * 1.5)
            }));

            // Add rows dynamically
            items.forEach(item => {
                const row = {};
                keys.forEach(key => {
                    row[key] = item[key] !== null ? item[key] : '';
                });
                worksheet.addRow(row);
            });

            // Style header row
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF7C3AED' } // Using the theme purple color
            };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(1).height = 25;

            // Add subtle borders to all cells with data
            worksheet.eachRow((row, rowNumber) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
                    };
                    if (rowNumber > 1) {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    }
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `Extracted_Data_${new Date().getTime()}.xlsx`);
        } catch (error) {
            console.error('Error generating Excel:', error);
        }
    }


    const processImage = useCallback(async (dataUri) => {
        setStatus("scanning")
        try {
            const result = await sendImageToBackend(dataUri)
            if (result && result.success) {
                setStatus("success")
                setScanResult(result)
                // Removed automatic download
            } else {
                throw new Error("Scan failed")
            }
        } catch (error) {
            console.error("Processing error:", error)
            setStatus("error")
            setTimeout(() => setStatus("idle"), 3500)
        }
    }, [])

    const handleTakePhoto = useCallback((dataUri) => {
        setRipple(true)
        setTimeout(() => setRipple(false), 600)
        setPreviewType("image")
        setPreviewImage(dataUri)
    }, [])

    const handleFileUpload = useCallback((e) => {
        const file = e.target.files?.[0]
        if (file) {
            const isPdf = file.type === "application/pdf"
            setPreviewType(isPdf ? "pdf" : "image")

            const reader = new FileReader()
            reader.onload = (event) => {
                const dataUri = event.target?.result
                if (typeof dataUri === 'string') {
                    setPreviewImage(dataUri)
                }
            }
            reader.readAsDataURL(file)
            // Fix: Reset the input value so the same file can be uploaded again
            e.target.value = ""
        }
    }, [])

    const handleCameraStart = useCallback(() => {
        setIsCameraReady(true)
    }, [])

    const handleCameraError = useCallback((err) => {
        console.error("Camera error:", err)
        setStatus("error")
        setIsCameraActive(false)
    }, [])

    const handleConfirmScan = () => {
        if (status === "success") {
            // Reset everything to start a new scan
            setStatus("idle")
            setPreviewImage(null)
            setScanResult(null)
            setIsFullScreen(false)
            return
        }
        
        if (previewImage) {
            processImage(previewImage)
        }
    }

    const handleCancelPreview = () => {
        setPreviewImage(null)
        setScanResult(null)
        setIsFullScreen(false)
    }

    const toggleCamera = () => {
        setIsCameraActive(!isCameraActive)
        if (!isCameraActive) {
            setIsCameraReady(false)
        }
    }

    const flipCamera = () => {
        setFacingMode(prev => prev === FACING_MODES.ENVIRONMENT ? FACING_MODES.USER : FACING_MODES.ENVIRONMENT)
        setIsCameraReady(false)
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative flex flex-col min-h-screen w-full font-inter overflow-hidden"
            style={{
                background: "linear-gradient(160deg, #0f0a1e 0%, #1a0b35 40%, #0d1526 100%)",
            }}
        >
            {/* ── Background decorative orbs ─────────────────────────────────── */}
            <div
                className="absolute top-[-120px] right-[-80px] w-72 h-72 rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(circle, rgba(120,40,255,0.18) 0%, transparent 70%)",
                }}
            />
            <div
                className="absolute bottom-[-80px] left-[-60px] w-56 h-56 rounded-full pointer-events-none"
                style={{
                    background: "radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)",
                }}
            />

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <motion.header
                variants={headerVariants}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-between px-5 pt-10 pb-4 z-20"
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{
                            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                            boxShadow: "0 4px 20px rgba(124,58,237,0.5)",
                        }}
                    >
                        <ScanIcon />
                    </div>
                    <div>
                        <h1 className="text-white text-xl font-bold tracking-tight leading-none">DocScan</h1>
                        <p className="text-purple-400 text-xs mt-0.5 font-medium">AI-Powered Scanner</p>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center glass text-purple-300"
                    aria-label="Info"
                >
                    <InfoIcon />
                </motion.button>
            </motion.header>

            {/* ── Toolbar ────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isCameraActive && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mx-5 mb-4 flex justify-between items-center z-20"
                    >
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={flipCamera}
                            className="px-4 py-2 rounded-xl glass text-purple-200 flex items-center gap-2 text-sm font-medium"
                        >
                            <FlipIcon /> Flip Camera
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleCamera}
                            className="w-10 h-10 rounded-xl glass text-red-400 flex items-center justify-center"
                        >
                            <CloseIcon />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Tip banner ─────────────────────────────────────────────────── */}
            {!isCameraActive && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mx-5 mb-4 px-4 py-2.5 rounded-xl glass flex items-center gap-2.5 z-20"
                >
                    <FlashIcon />
                    <p className="text-purple-200 text-xs font-medium">
                        Start the camera or upload an image to begin scanning
                    </p>
                </motion.div>
            )}

            {/* ── Main Viewfinder/Placeholder ────────────────────────────────── */}
            <motion.div
                variants={mainVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 mx-5 relative flex items-center justify-center z-20"
            >
                <div
                    className="relative w-full rounded-3xl overflow-hidden flex flex-col items-center justify-center"
                    style={{
                        minHeight: "360px",
                        maxHeight: "480px",
                        background: "rgba(0,0,0,0.6)",
                        border: "1px solid rgba(168,85,247,0.25)",
                        boxShadow: "0 0 40px rgba(124,58,237,0.2), inset 0 0 30px rgba(0,0,0,0.4)",
                    }}
                >
                    {previewImage ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 backdrop-blur-xl bg-[#0f0a1e]/80 overflow-hidden"
                        >
                            {/* Backdrop decorative glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-20 pointer-events-none"
                                style={{
                                    background: `radial-gradient(circle, #7c3aed 0%, transparent 60%)`,
                                    filter: 'blur(60px)'
                                }}
                            />

                            <motion.div
                                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="relative w-full h-[65%] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-black/20"
                            >
                                {previewType === "pdf" ? (
                                    <div
                                        className="flex flex-col items-center gap-4 text-purple-300 cursor-pointer"
                                        onClick={() => setIsFullScreen(true)}
                                    >
                                        <div className="p-6 rounded-3xl bg-purple-500/10 border border-purple-500/20 shadow-inner">
                                            <PdfIcon />
                                        </div>
                                        <span className="text-xs font-bold tracking-widest uppercase opacity-60">PDF Document</span>
                                    </div>
                                ) : (
                                    <img
                                        src={previewImage}
                                        alt="Preview"
                                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                                        onClick={() => setIsFullScreen(true)}
                                    />
                                )}

                                {/* Interactive hint */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="px-3 py-1.5 rounded-full glass text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">
                                        Tap to expand
                                    </div>
                                </div>

                                {/* Subtle scanning pulse overlay */}
                                <motion.div
                                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: "linear-gradient(180deg, transparent 0%, rgba(124,58,237,0.1) 50%, transparent 100%)",
                                    }}
                                />

                                <div className="absolute top-4 right-4">
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleCancelPreview}
                                        className="w-10 h-10 rounded-full glass text-white flex items-center justify-center border border-white/20 shadow-lg"
                                    >
                                        <CloseIcon />
                                    </motion.button>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mt-4"
                            >
                                <p className="text-purple-400/60 text-[10px] font-bold tracking-[0.2em] uppercase">Document Preview</p>
                            </motion.div>
                        </motion.div>
                    ) : isCameraActive ? (
                        <>
                            {/* Corner brackets */}
                            <ViewfinderCorners />

                            {/* Scan beam (only in idle state) */}
                            <AnimatePresence>
                                {status === "idle" && isCameraReady && <ScanBeam />}
                            </AnimatePresence>

                            {/* Camera */}
                            <div
                                className="w-full h-full flex items-center justify-center"
                            >
                                <Camera
                                    onTakePhoto={handleTakePhoto}
                                    onCameraStart={handleCameraStart}
                                    onCameraError={handleCameraError}
                                    isFullscreen={false}
                                    idealFacingMode={facingMode}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-purple-900/40 flex items-center justify-center mb-6 border border-purple-500/30">
                                <CameraIcon />
                            </div>
                            <h2 className="text-white text-xl font-bold mb-2">Camera Off</h2>
                            <p className="text-purple-300 text-sm mb-8 max-w-[240px]">
                                Ready to scan your documents? Use the camera or upload a file.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleCamera}
                                className="px-8 py-3 rounded-2xl text-white font-bold tracking-wide"
                                style={{
                                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                    boxShadow: "0 8px 20px rgba(124,58,237,0.4)",
                                }}
                            >
                                Open Camera
                            </motion.button>
                        </div>
                    )}

                    {/* ── State overlays ──────────────────────────────────────────── */}
                    <AnimatePresence>
                        {status === "scanning" && (
                            <motion.div
                                key="scanning"
                                variants={overlayVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl glass-dark z-30"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                    className="w-16 h-16 rounded-full border-4 border-transparent mb-4"
                                    style={{
                                        borderTopColor: "#a855f7",
                                        borderRightColor: "#7c3aed",
                                        boxShadow: "0 0 20px rgba(168,85,247,0.5)",
                                    }}
                                />
                                <p className="text-white font-semibold text-base">Processing…</p>
                                <p className="text-purple-300 text-xs mt-1">Analysing document</p>
                            </motion.div>
                        )}

                        {status === "success" && (
                            <motion.div
                                key="success"
                                variants={overlayVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl glass-dark z-50"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
                                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4 glow-green"
                                    style={{ background: "linear-gradient(135deg, #16a34a, #22c55e)" }}
                                >
                                    <CheckIcon />
                                </motion.div>
                                <p className="text-white font-bold text-lg">Scan Complete!</p>
                                <p className="text-green-400 text-sm mt-1">Document captured successfully</p>
                            </motion.div>
                        )}

                        {status === "error" && (
                            <motion.div
                                key="error"
                                variants={overlayVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl glass-dark z-30"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
                                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4 glow-red"
                                    style={{ background: "linear-gradient(135deg, #b91c1c, #ef4444)" }}
                                >
                                    <XIcon />
                                </motion.div>
                                <p className="text-white font-bold text-lg">Scan Failed</p>
                                <p className="text-red-400 text-sm mt-1">Please try again</p>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setStatus("idle")}
                                    className="mt-5 px-6 py-2 rounded-xl text-white text-sm font-semibold"
                                    style={{
                                        background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                        boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
                                    }}
                                >
                                    Retry
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* ── Footer — Actions ───────────────────────────────────────────── */}
            <motion.footer
                variants={footerVariants}
                initial="hidden"
                animate="visible"
                className="px-5 pt-6 pb-10 flex flex-col items-center gap-6 z-20"
            >
                {previewImage ? (
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col items-center gap-4 w-full px-4"
                    >
                        <div className="flex gap-2 w-full max-w-[280px]">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCancelPreview}
                                className="flex-1 py-2 rounded-lg glass text-purple-200 text-[9px] font-bold border border-purple-500/20 tracking-wider uppercase"
                            >
                                Retake
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(124,58,237,0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleConfirmScan}
                                className="flex-[1.2] py-2 rounded-lg text-white text-[9px] font-extrabold tracking-widest flex items-center justify-center gap-1.5 group relative overflow-hidden uppercase"
                                style={{
                                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                                }}
                            >
                                {/* Shining Effect */}
                                <motion.div
                                    animate={{ x: [-200, 400] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                    className="absolute top-0 bottom-0 w-16 bg-white/20 skew-x-[45deg] pointer-events-none"
                                />
                                {status === "success" ? "Done" : "Ready to Scan"} <CheckIcon />
                            </motion.button>
                        </div>

                        {/* Download Buttons - Appears after success */}
                        <AnimatePresence>
                            {status === "success" && scanResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex flex-col gap-3 w-full max-w-[280px]"
                                >
                                    <div className="flex w-full">
                                        {/* Excel Download */}
                                        <motion.button
                                            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(34,197,94,0.4)" }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => generateExcel(scanResult)}
                                            className="w-full py-2.5 rounded-xl text-white text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 group relative overflow-hidden uppercase"
                                            style={{
                                                background: "linear-gradient(135deg, #10b981, #059669)",
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download Excel
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="flex items-center justify-center w-full gap-8">
                        {/* Upload Button */}
                        <div className="flex flex-col items-center gap-2">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => fileInputRef.current?.click()}
                                className="w-14 h-14 rounded-2xl glass text-purple-200 flex items-center justify-center"
                                style={{ border: "1px solid rgba(168,85,247,0.3)" }}
                            >
                                <UploadIcon />
                            </motion.button>
                            <span className="text-purple-400 text-[10px] font-bold tracking-widest uppercase">File</span>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*,application/pdf"
                            className="hidden"
                        />

                        {/* Capture button (only visible when camera active) */}
                        <div className="relative flex items-center justify-center w-24 h-24">
                            <AnimatePresence>
                                {isCameraActive ? (
                                    <motion.div
                                        key="capture-btn"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="flex flex-col items-center"
                                    >
                                        <div className="relative flex items-center justify-center">
                                            {/* Ripple ring */}
                                            <AnimatePresence>
                                                {ripple && (
                                                    <motion.div
                                                        key="ripple"
                                                        initial={{ scale: 1, opacity: 0.7 }}
                                                        animate={{ scale: 2.2, opacity: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                                        className="absolute w-20 h-20 rounded-full"
                                                        style={{ background: "rgba(168,85,247,0.35)" }}
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {/* Pulse ring */}
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.12, 1],
                                                    opacity: [0.5, 0.2, 0.5],
                                                }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute w-24 h-24 rounded-full"
                                                style={{ background: "rgba(124,58,237,0.25)" }}
                                            />

                                            {/* Main capture button */}
                                            <motion.button
                                                whileHover={{ scale: 1.06 }}
                                                whileTap={{ scale: 0.92 }}
                                                disabled={status === "scanning" || !isCameraReady}
                                                aria-label="Capture document"
                                                className="relative w-20 h-20 rounded-full flex items-center justify-center disabled:opacity-50 z-10"
                                                style={{
                                                    background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)",
                                                    boxShadow: "0 0 0 4px rgba(168,85,247,0.3), 0 8px 32px rgba(124,58,237,0.6)",
                                                }}
                                                onClick={() => {
                                                    const shutterBtn = document.getElementById("outer-circle")
                                                    if (shutterBtn) shutterBtn.click()
                                                }}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-white opacity-90" />
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center opacity-30">
                                        <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 border-dashed" />
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Settings/Placeholder */}
                        <div className="flex flex-col items-center gap-2">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="w-14 h-14 rounded-2xl glass text-purple-200 flex items-center justify-center"
                                style={{ border: "1px solid rgba(168,85,247,0.3)" }}
                            >
                                <InfoIcon />
                            </motion.button>
                            <span className="text-purple-400 text-[10px] font-bold tracking-widest uppercase">Info</span>
                        </div>
                    </div>
                )}
            </motion.footer>

            {/* ── Full Screen Preview Modal ───────────────────────────────────── */}
            <AnimatePresence>
                {isFullScreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-2"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full h-full flex flex-col pt-12 pb-6 px-4"
                        >
                            {/* Close button */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsFullScreen(false)}
                                className="absolute top-4 right-4 w-12 h-12 rounded-full glass border border-white/20 flex items-center justify-center text-white z-50"
                            >
                                <CloseIcon />
                            </motion.button>

                            <div className="flex-1 w-full relative rounded-2xl overflow-hidden bg-black/40">
                                {previewType === "pdf" ? (
                                    <iframe
                                        src={previewImage}
                                        className="w-full h-full border-0"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <img
                                        src={previewImage}
                                        alt="Full View"
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>

                            <div className="mt-4 flex justify-center">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsFullScreen(false)}
                                    className="px-6 py-2 rounded-xl glass text-white text-xs font-bold border border-white/10 uppercase tracking-widest"
                                >
                                    Back to Scan
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast notifications */}
            <AnimatePresence>
                {status === "success" && (
                    <motion.div
                        key="toast-success"
                        variants={toastVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed bottom-6 left-4 right-4 mx-auto max-w-sm z-50"
                    >
                        {/* <div
                            className="flex items-center gap-3 px-5 py-4 rounded-2xl"
                            style={{
                                background: "linear-gradient(135deg, #14532d, #166534)",
                                border: "1px solid rgba(34,197,94,0.4)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.2)",
                            }}
                        >
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">Document scanned!</p>
                                <p className="text-green-300 text-xs mt-0.5">Sent to processing pipeline</p>
                            </div>
                        </div> */}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default CameraComponent