import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiMinus, FiMaximize2, FiRotateCcw, FiLayers, 
  FiAlertTriangle, FiGlobe, FiInfo, FiActivity, FiCrosshair
} from 'react-icons/fi';
import { WORLD_MAP_PATH } from '../../common/WorldMapData';

export default function InteractiveWorldMap({
  threats = [],
  selectedThreat = null,
  onSelectThreat,
  cameraTarget,
  onResetView,
  isLoading = false
}) {
  const containerRef = useRef(null);

  // ViewBox pan & zoom state
  // Default world: x: 0, y: 0, width: 800, height: 400
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 400 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [hoveredThreat, setHoveredThreat] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Sync camera when cameraTarget changes (e.g. user selected a location)
  useEffect(() => {
    if (cameraTarget) {
      setViewBox({
        x: cameraTarget.x,
        y: cameraTarget.y,
        width: cameraTarget.width,
        height: cameraTarget.height
      });
    }
  }, [cameraTarget]);

  // Current Zoom Level calculation
  const currentZoom = useMemo(() => {
    return Math.round((800 / viewBox.width) * 10) / 10;
  }, [viewBox.width]);

  // Handle Zoom In
  const handleZoomIn = () => {
    setViewBox(prev => {
      const zoomFactor = 1.4;
      const newWidth = Math.max(80, prev.width / zoomFactor);
      const newHeight = Math.max(40, prev.height / zoomFactor);
      const newX = Math.max(0, Math.min(800 - newWidth, prev.x + (prev.width - newWidth) / 2));
      const newY = Math.max(0, Math.min(400 - newHeight, prev.y + (prev.height - newHeight) / 2));
      return { x: newX, y: newY, width: newWidth, height: newHeight };
    });
  };

  // Handle Zoom Out
  const handleZoomOut = () => {
    setViewBox(prev => {
      const zoomFactor = 1.4;
      const newWidth = Math.min(800, prev.width * zoomFactor);
      const newHeight = Math.min(400, prev.height * zoomFactor);
      const newX = Math.max(0, Math.min(800 - newWidth, prev.x - (newWidth - prev.width) / 2));
      const newY = Math.max(0, Math.min(400 - newHeight, prev.y - (newHeight - prev.height) / 2));
      return { x: newX, y: newY, width: newWidth, height: newHeight };
    });
  };

  // Reset to Global View
  const handleReset = () => {
    setViewBox({ x: 0, y: 0, width: 800, height: 400 });
    if (typeof onResetView === 'function') {
      onResetView();
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cursorXRatio = (e.clientX - rect.left) / rect.width;
    const cursorYRatio = (e.clientY - rect.top) / rect.height;

    const zoomDelta = e.deltaY < 0 ? 1.25 : 0.8;

    setViewBox(prev => {
      const newWidth = Math.max(80, Math.min(800, prev.width / zoomDelta));
      const newHeight = Math.max(40, Math.min(400, prev.height / zoomDelta));
      
      const newX = Math.max(0, Math.min(800 - newWidth, prev.x + (prev.width - newWidth) * cursorXRatio));
      const newY = Math.max(0, Math.min(400 - newHeight, prev.y + (prev.height - newHeight) * cursorYRatio));

      return { x: newX, y: newY, width: newWidth, height: newHeight };
    });
  };

  // Pointer drag to pan
  const handlePointerDown = (e) => {
    // Left mouse click only
    if (e.button !== 0) return;
    setIsPanning(true);
    setStartPoint({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (!isPanning || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - startPoint.x) / rect.width) * viewBox.width;
    const dy = ((e.clientY - startPoint.y) / rect.height) * viewBox.height;

    setViewBox(prev => {
      const newX = Math.max(0, Math.min(800 - prev.width, prev.x - dx));
      const newY = Math.max(0, Math.min(400 - prev.height, prev.y - dy));
      return { ...prev, x: newX, y: newY };
    });

    setStartPoint({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  // Plottable threat markers with valid coordinates
  const plottableThreats = useMemo(() => {
    return threats.filter(t => t.projectedX !== null && t.projectedY !== null);
  }, [threats]);

  // Refined marker clustering: preserves distinct city and host nodes while cleanly grouping overlapping coordinates
  const clusters = useMemo(() => {
    // Tighter clustering threshold displays more individual real threat dots
    const threshold = viewBox.width > 400 ? 5.5 : (viewBox.width > 200 ? 3 : 1.5);
    const result = [];
    const processed = new Set();

    for (let i = 0; i < plottableThreats.length; i++) {
      if (processed.has(i)) continue;
      const base = plottableThreats[i];
      const group = [base];
      processed.add(i);

      for (let j = i + 1; j < plottableThreats.length; j++) {
        if (processed.has(j)) continue;
        const candidate = plottableThreats[j];
        const dist = Math.hypot(base.projectedX - candidate.projectedX, base.projectedY - candidate.projectedY);
        if (dist <= threshold) {
          group.push(candidate);
          processed.add(j);
        }
      }

      // Calculate centroid
      const avgX = group.reduce((sum, item) => sum + item.projectedX, 0) / group.length;
      const avgY = group.reduce((sum, item) => sum + item.projectedY, 0) / group.length;
      
      // Determine highest severity in cluster
      const hasCritical = group.some(t => t.severity === 'Critical');
      const hasHigh = group.some(t => t.severity === 'High');
      const severity = hasCritical ? 'Critical' : (hasHigh ? 'High' : 'Medium');

      result.push({
        id: `cluster-${base.id}`,
        x: avgX,
        y: avgY,
        threats: group,
        count: group.length,
        severity,
        primaryThreat: group[0]
      });
    }

    return result;
  }, [plottableThreats, viewBox.width]);

  const getSeverityColor = (sev) => {
    switch ((sev || '').toUpperCase()) {
      case 'CRITICAL': return '#EF4444'; // Red
      case 'HIGH': return '#F59E0B';     // Amber
      case 'MEDIUM': return '#56A6D9';   // Blue
      case 'LOW':
      default: return '#20D9D2';         // Cyan
    }
  };

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`relative w-full h-[400px] sm:h-[480px] lg:h-[540px] bg-[#070B12] border border-[#223244] rounded-2xl overflow-hidden shadow-2xl select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* 1. TOP-LEFT HUD OVERLAY */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto flex flex-col gap-2">
        <div className="bg-[#101A27]/90 backdrop-blur-md border border-[#223244] p-3 sm:p-4 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20D9D2] animate-pulse" />
            <h4 className="text-xs sm:text-sm font-bold text-[#F1F5F9] uppercase tracking-wider font-mono">
              SOC Threat Grid
            </h4>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono text-[#A5B4C7] mt-2">
            <div>
              <span className="text-[10px] uppercase block text-[#A5B4C7]/70">Plotted Nodes</span>
              <span className="text-sm font-bold text-[#20D9D2]">{plottableThreats.length}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase block text-[#A5B4C7]/70">Zoom Level</span>
              <span className="text-sm font-bold text-[#F1F5F9]">{currentZoom}x</span>
            </div>
            <div>
              <span className="text-[10px] uppercase block text-[#A5B4C7]/70">Clusters</span>
              <span className="text-sm font-bold text-[#56A6D9]">{clusters.length}</span>
            </div>
          </div>
        </div>

        {/* Forensic Hosting Disclaimer Pill */}
        <div className="bg-[#152334]/80 backdrop-blur-md border border-[#223244] px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#A5B4C7] flex items-center gap-1.5 max-w-sm">
          <FiInfo className="text-[#20D9D2] shrink-0" size={12} />
          <span>Showing verified IP hosting nodes. Zero fabricated GPS points.</span>
        </div>
      </div>

      {/* 2. TOP-RIGHT MAP CONTROLS */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto flex flex-col gap-1.5 bg-[#101A27]/90 backdrop-blur-md border border-[#223244] p-1.5 rounded-xl shadow-lg">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg text-[#F1F5F9] hover:bg-[#152334] hover:text-[#20D9D2] transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <FiPlus size={16} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg text-[#F1F5F9] hover:bg-[#152334] hover:text-[#20D9D2] transition-colors cursor-pointer"
          title="Zoom Out (-)"
        >
          <FiMinus size={16} />
        </button>
        <div className="w-full h-px bg-[#223244] my-0.5" />
        <button
          onClick={handleReset}
          className="p-2 rounded-lg text-[#F1F5F9] hover:bg-[#152334] hover:text-[#20D9D2] transition-colors cursor-pointer"
          title="Reset to Global View"
        >
          <FiRotateCcw size={15} />
        </button>
      </div>

      {/* 3. BOTTOM-LEFT SEVERITY LEGEND */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-3 bg-[#101A27]/85 backdrop-blur-md border border-[#223244] px-3 py-2 rounded-xl text-xs font-mono">
        <span className="text-[10px] uppercase text-[#A5B4C7] font-semibold mr-1">Severity:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <span className="text-[#F1F5F9] text-[11px]">Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <span className="text-[#F1F5F9] text-[11px]">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#56A6D9]" />
          <span className="text-[#F1F5F9] text-[11px]">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#20D9D2]" />
          <span className="text-[#F1F5F9] text-[11px]">Low</span>
        </div>
      </div>

      {/* 4. BOTTOM-RIGHT SCALE / COORDINATE MONITOR */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none hidden md:block text-right">
        <div className="bg-[#101A27]/80 backdrop-blur-md border border-[#223244] px-3 py-1.5 rounded-xl font-mono text-[11px] text-[#A5B4C7]">
          <span>Equirectangular Grid &bull; WGS84 Projection</span>
        </div>
      </div>

      {/* 5. INTERACTIVE SVG WORLD MAP */}
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="w-full h-full transition-transform duration-75"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="socDotGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="#20D9D2" opacity="0.12" />
          </pattern>
        </defs>

        {/* Background Grid */}
        <rect width="800" height="400" fill="url(#socDotGrid)" />

        {/* Latitude & Longitude Reference Lines */}
        <g stroke="#20D9D2" strokeOpacity="0.08" strokeWidth="0.5" strokeDasharray="3 4">
          {[60, 120, 180, 240, 300, 360].map(y => <line key={`lat-${y}`} x1="0" y1={y} x2="800" y2={y} />)}
          {[100, 200, 300, 400, 500, 600, 700].map(x => <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="400" />)}
        </g>

        {/* World Continent Boundaries */}
        <path
          d={WORLD_MAP_PATH}
          fill="#101A27"
          stroke="#20D9D2"
          strokeOpacity="0.32"
          strokeWidth={viewBox.width < 400 ? 0.3 : 0.6}
        />

        {/* Threat Markers and Clusters */}
        {clusters.map((cluster) => {
          const isSelected = selectedThreat && cluster.threats.some(t => t.id === selectedThreat.id);
          const color = getSeverityColor(cluster.severity);
          const radius = cluster.count > 1 ? Math.min(10, 4 + Math.log2(cluster.count) * 2) : 3.5;
          const strokeW = viewBox.width < 400 ? 0.8 : 1.2;

          return (
            <g
              key={cluster.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectThreat(cluster.primaryThreat);
              }}
              onMouseEnter={() => setHoveredThreat(cluster.primaryThreat)}
              onMouseLeave={() => setHoveredThreat(null)}
              className="cursor-pointer"
            >
              {/* Static Distinct Selection Ring (Anchored without pulsing or ringing) */}
              {isSelected && (
                <circle
                  cx={cluster.x}
                  cy={cluster.y}
                  r={radius + 3.5}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  opacity="0.95"
                />
              )}

              {/* Marker Base Circle */}
              <circle
                cx={cluster.x}
                cy={cluster.y}
                r={radius}
                fill={color}
                fillOpacity="0.85"
                stroke={isSelected ? '#FFFFFF' : '#070B12'}
                strokeWidth={isSelected ? 1.5 : strokeW}
              />

              {/* Cluster Count Label (if > 1) */}
              {cluster.count > 1 && (
                <text
                  x={cluster.x}
                  y={cluster.y + (radius > 5 ? 2.5 : 2)}
                  fontSize={radius > 6 ? 6 : 4.5}
                  fontWeight="bold"
                  fill="#070B12"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {cluster.count > 99 ? '99+' : cluster.count}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* 6. HOVER POPUP / TOOLTIP */}
      <AnimatePresence>
        {hoveredThreat && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-[#152334]/95 backdrop-blur-md border border-[#20D9D2]/40 px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-3 text-xs font-mono"
          >
            <span 
              className="w-2.5 h-2.5 rounded-full shrink-0" 
              style={{ backgroundColor: getSeverityColor(hoveredThreat.severity) }} 
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F1F5F9]">{hoveredThreat.evidence?.host || 'Unknown'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#101A27] text-[#20D9D2] border border-[#223244]">
                  {hoveredThreat.hostingCountry || 'Unmapped'}
                  {hoveredThreat.hostingCity ? `, ${hoveredThreat.hostingCity}` : ''}
                </span>
              </div>
              <span className="text-[11px] text-[#A5B4C7] truncate max-w-xs mt-0.5">
                {hoveredThreat.indicator}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
