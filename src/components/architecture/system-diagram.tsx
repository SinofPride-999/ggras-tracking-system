"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

// ---- Node data ----
interface DiagramNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "process" | "decision" | "store" | "start" | "end";
  section: "operator" | "commission";
  description: string;
  details: string[];
}

const nodes: DiagramNode[] = [
  // Operator side (left column, x: 80-280)
  { id: "player", label: "Player Bet", x: 80, y: 80, type: "start", section: "operator", description: "Entry point — player initiates a wager on the gaming platform", details: ["Bet amount captured", "Game selection recorded", "Player pseudonym ID assigned"] },
  { id: "engine", label: "Gaming Engine", x: 80, y: 160, type: "process", section: "operator", description: "Core gaming platform captures the transaction event", details: ["Records stake amount", "Captures game type", "Generates raw event payload"] },
  { id: "settlement", label: "Settlement", x: 80, y: 240, type: "process", section: "operator", description: "Outcome events: win payouts, bet refunds, or settled bets", details: ["Win payouts processed", "Refund handling", "Bet settlement confirmation"] },
  { id: "connector", label: "Regulatory Connector", x: 80, y: 320, type: "process", section: "operator", description: "Certified middleware that validates and normalizes events to GGRAS schema", details: ["Schema validation", "Event normalization", "Unique Event ID generation", "Timestamp + Sequence #"] },
  { id: "signing_check", label: "Signing?", x: 100, y: 410, type: "decision", section: "operator", description: "Decision point: is cryptographic signing enabled for this operator?", details: ["ECDSA or RSA-2048 check", "Certificate validation", "Key availability check"] },
  { id: "crypto_sign", label: "Crypto Signing", x: 250, y: 400, type: "process", section: "operator", description: "Digital signature applied to events ensuring tamper evidence", details: ["ECDSA-P256 signature", "SHA-256 hash of payload", "Operator private key used", "Non-repudiation guaranteed"] },
  { id: "transmission", label: "Secure Transmission", x: 80, y: 500, type: "process", section: "operator", description: "TLS 1.3 / mTLS encrypted transport with retry capability", details: ["TLS 1.3 encryption", "mTLS client certificates", "Automatic retry queue"] },
  { id: "network_check", label: "Network?", x: 100, y: 590, type: "decision", section: "operator", description: "Checks if the network connection to GGRAS is available", details: ["Connection health check", "Timeout detection", "Fallback trigger"] },
  { id: "local_queue", label: "Local Queue", x: 250, y: 580, type: "store", section: "operator", description: "Events buffered locally when network is unavailable", details: ["Encrypted local storage", "Automatic replay", "Deduplication on resume", "Exactly-once delivery"] },

  // Commission side (right columns, x: 480-750)
  { id: "gateway", label: "Ingestion Gateway", x: 480, y: 80, type: "process", section: "commission", description: "Entry point for all operator event streams into GGRAS", details: ["Multi-tenant routing", "Authentication", "Rate limiting", "10,000 events/sec per operator"] },
  { id: "auth", label: "Auth + Validation", x: 480, y: 160, type: "process", section: "commission", description: "Authentication, authorization, and throttling of incoming events", details: ["mTLS + API token validation", "Per-operator throttling", "Schema compliance check"] },
  { id: "sig_valid", label: "Sig Valid?", x: 500, y: 250, type: "decision", section: "commission", description: "Validates cryptographic signatures and sequence integrity", details: ["Signature verification", "Sequence number check", "Gap detection algorithm"] },
  { id: "tamper_flag", label: "Tamper Alert", x: 680, y: 240, type: "end", section: "commission", description: "Event flagged for compliance review — potential tampering detected", details: ["Compliance case opened", "Operator notified", "Evidence preserved", "Escalation triggered"] },
  { id: "raw_store", label: "Raw Event Store", x: 480, y: 340, type: "store", section: "commission", description: "Append-only, immutable storage of all validated gaming events", details: ["Append-only writes", "AES-256 encryption at rest", "5+ years retention", "TimescaleDB backend"] },

  // Commission processing branches
  { id: "privacy", label: "Privacy Controls", x: 340, y: 440, type: "process", section: "commission", description: "Data minimization and pseudonymization controls", details: ["Pseudonymous IDs only", "Data minimization", "Access control enforcement", "Full audit logging"] },
  { id: "pii_vault", label: "PII Vault", x: 340, y: 540, type: "store", section: "commission", description: "Restricted storage for player PII — only if legally required", details: ["Legal justification required", "Restricted access controls", "Full audit trail", "Separate from main systems"] },
  { id: "hash_merkle", label: "Merkle Builder", x: 490, y: 440, type: "process", section: "commission", description: "Canonicalize events, compute SHA-256 hashes, build Merkle root", details: ["Event canonicalization", "SHA-256 hashing", "Merkle tree construction", "Per time-window roots"] },
  { id: "ledger", label: "Integrity Ledger", x: 490, y: 540, type: "store", section: "commission", description: "Immutable record of aggregate commitments — no player PII", details: ["Merkle Root storage", "Event count tracking", "Timestamp records", "Operator ID linkage"] },
  { id: "processing", label: "Revenue Calculator", x: 640, y: 440, type: "process", section: "commission", description: "Computes GGR, taxable base, and taxes due using published rules", details: ["GGR = Stakes - Payouts - Refunds", "Taxable = GGR - Exemptions", "Tax = Taxable × Rate", "Versioned rule engine"] },
  { id: "anomaly", label: "Anomaly Detection", x: 640, y: 540, type: "process", section: "commission", description: "ML-based detection of irregular gaming patterns", details: ["Under-reporting detection", "Payout spike alerts", "Feed drop monitoring", "Isolation Forest + LSTM models"] },

  // Commission outputs
  { id: "dashboards", label: "Dashboards", x: 490, y: 640, type: "end", section: "commission", description: "GGR summaries, taxes due, operator rankings, audit exports", details: ["Real-time dashboards", "PDF/CSV exports", "Operator rankings", "Tax summaries"] },
  { id: "compliance", label: "Compliance", x: 660, y: 640, type: "end", section: "commission", description: "End-to-end compliance case management", details: ["Notice generation", "Audit initiation", "Penalty assessment", "License actions"] },
];

// ---- Edge definitions ----
interface DiagramEdge {
  from: string;
  to: string;
  type: "normal" | "yes" | "no";
}

const edges: DiagramEdge[] = [
  { from: "player", to: "engine", type: "normal" },
  { from: "engine", to: "settlement", type: "normal" },
  { from: "settlement", to: "connector", type: "normal" },
  { from: "connector", to: "signing_check", type: "normal" },
  { from: "signing_check", to: "crypto_sign", type: "yes" },
  { from: "signing_check", to: "transmission", type: "no" },
  { from: "crypto_sign", to: "transmission", type: "normal" },
  { from: "transmission", to: "network_check", type: "normal" },
  { from: "network_check", to: "local_queue", type: "no" },
  { from: "network_check", to: "gateway", type: "yes" },
  { from: "local_queue", to: "gateway", type: "normal" },
  { from: "gateway", to: "auth", type: "normal" },
  { from: "auth", to: "sig_valid", type: "normal" },
  { from: "sig_valid", to: "tamper_flag", type: "no" },
  { from: "sig_valid", to: "raw_store", type: "yes" },
  { from: "tamper_flag", to: "compliance", type: "normal" },
  { from: "raw_store", to: "privacy", type: "normal" },
  { from: "raw_store", to: "hash_merkle", type: "normal" },
  { from: "raw_store", to: "processing", type: "normal" },
  { from: "privacy", to: "pii_vault", type: "normal" },
  { from: "hash_merkle", to: "ledger", type: "normal" },
  { from: "hash_merkle", to: "dashboards", type: "normal" },
  { from: "processing", to: "anomaly", type: "normal" },
  { from: "processing", to: "dashboards", type: "normal" },
  { from: "anomaly", to: "compliance", type: "normal" },
  { from: "anomaly", to: "dashboards", type: "normal" },
  { from: "ledger", to: "dashboards", type: "normal" },
];

// ---- Helpers ----
function getNodeDimensions(type: string) {
  switch (type) {
    case "decision": return { w: 90, h: 60 };
    case "store": return { w: 130, h: 44 };
    case "start": return { w: 130, h: 40 };
    case "end": return { w: 120, h: 40 };
    default: return { w: 140, h: 44 };
  }
}

function getNodeCenter(node: DiagramNode) {
  const { w, h } = getNodeDimensions(node.type);
  return { cx: node.x + w / 2, cy: node.y + h / 2 };
}

function getEdgePath(from: DiagramNode, to: DiagramNode): string {
  const f = getNodeCenter(from);
  const t = getNodeCenter(to);
  const fromDim = getNodeDimensions(from.type);
  const toDim = getNodeDimensions(to.type);

  const dx = t.cx - f.cx;
  const dy = t.cy - f.cy;

  // Vertical connection
  if (Math.abs(dx) < 50) {
    const startY = f.cy + fromDim.h / 2;
    const endY = t.cy - toDim.h / 2;
    return `M ${f.cx} ${startY} L ${f.cx} ${endY}`;
  }

  // Horizontal connection
  if (Math.abs(dy) < 30) {
    const startX = dx > 0 ? f.cx + fromDim.w / 2 : f.cx - fromDim.w / 2;
    const endX = dx > 0 ? t.cx - toDim.w / 2 : t.cx + toDim.w / 2;
    return `M ${startX} ${f.cy} L ${endX} ${t.cy}`;
  }

  // L-shaped path with rounded corner
  if (dx > 0) {
    const midY = t.cy;
    return `M ${f.cx} ${f.cy + fromDim.h / 2} L ${f.cx} ${midY} Q ${f.cx} ${midY} ${f.cx + 10} ${midY} L ${t.cx - toDim.w / 2} ${midY}`;
  } else {
    const midX = f.cx;
    const startY = f.cy + fromDim.h / 2;
    return `M ${midX} ${startY} L ${midX} ${t.cy} L ${t.cx + toDim.w / 2} ${t.cy}`;
  }
}

// ---- Animated Particle (uses SVG animateMotion for better compatibility) ----
function AnimatedParticle({
  pathId,
  color,
  duration,
  delay
}: {
  pathId: string;
  color: string;
  duration: number;
  delay: number;
}) {
  return (
    <circle r={5} fill={color} opacity={0.9}>
      <animateMotion
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        calcMode="linear"
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </circle>
  );
}

// ---- Main Diagram Component ----
export function SystemDiagram() {
  const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  // Define particle paths
  const particlePaths = [
    { id: "flow-1", nodes: ["player", "engine", "settlement", "connector"], color: "#3B82F6" },
    { id: "flow-2", nodes: ["connector", "signing_check", "transmission", "network_check"], color: "#3B82F6" },
    { id: "flow-3", nodes: ["network_check", "gateway"], color: "#22C55E" },
    { id: "flow-4", nodes: ["gateway", "auth", "sig_valid", "raw_store"], color: "#22C55E" },
    { id: "flow-5", nodes: ["raw_store", "hash_merkle", "ledger"], color: "#8B5CF6" },
    { id: "flow-6", nodes: ["raw_store", "processing", "dashboards"], color: "#F59E0B" },
    { id: "flow-7", nodes: ["processing", "anomaly", "compliance"], color: "#EF4444" },
  ];

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  const handleReset = () => setZoom(1);

  return (
    <div className="w-full h-full relative bg-zinc-50 rounded-lg border overflow-hidden">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-2 bg-white/90 backdrop-blur rounded-lg p-1 shadow-sm border">
        <Button variant="ghost" size="sm" onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleReset} title="Reset view">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur rounded-lg p-3 shadow-sm border text-xs">
        <p className="font-semibold mb-2">Legend</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Operator Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Commission Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-500" />
            <span>Decision</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-100 border border-orange-500" />
            <span>Data Store</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-green-500" />
            <span className="text-green-600">Yes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-red-500 border-dashed" style={{ borderTop: "2px dashed #EF4444", height: 0 }} />
            <span className="text-red-600">No</span>
          </div>
        </div>
        <p className="mt-2 text-muted-foreground">Click any node for details</p>
      </div>

      {/* SVG Diagram */}
      <svg
        ref={svgRef}
        viewBox="0 0 850 720"
        className="w-full h-full transition-transform duration-300"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          maxHeight: "calc(100vh - 120px)"
        }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arrow markers */}
          <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#94A3B8" />
          </marker>
          <marker id="arrow-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#22C55E" />
          </marker>
          <marker id="arrow-red" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#EF4444" />
          </marker>

          {/* Define paths for particles */}
          {particlePaths.map(flow => {
            const pathData = flow.nodes.slice(0, -1).map((nodeId, i) => {
              const from = nodeMap[nodeId];
              const to = nodeMap[flow.nodes[i + 1]];
              return getEdgePath(from, to);
            }).join(" ");
            return <path key={flow.id} id={flow.id} d={pathData} fill="none" />;
          })}
        </defs>

        {/* Section Backgrounds */}
        <rect x="30" y="40" width="360" height="640" rx="12" fill="#EFF6FF" fillOpacity={0.5} stroke="#BFDBFE" strokeWidth={1} />
        <text x="50" y="70" fill="#3B82F6" fontSize="13" fontWeight="600">OPERATOR ENVIRONMENT</text>
        <text x="50" y="86" fill="#64748B" fontSize="10">Event Capture &amp; Transmission</text>

        <rect x="420" y="40" width="400" height="640" rx="12" fill="#F0FDF4" fillOpacity={0.5} stroke="#BBF7D0" strokeWidth={1} />
        <text x="440" y="70" fill="#16A34A" fontSize="13" fontWeight="600">GGRAS COMMISSION</text>
        <text x="440" y="86" fill="#64748B" fontSize="10">Validation, Processing &amp; Analysis</text>

        {/* Draw Edges */}
        {edges.map((edge) => {
          const from = nodeMap[edge.from];
          const to = nodeMap[edge.to];
          if (!from || !to) return null;

          const path = getEdgePath(from, to);
          const isYes = edge.type === "yes";
          const isNo = edge.type === "no";
          const color = isYes ? "#22C55E" : isNo ? "#EF4444" : "#94A3B8";
          const marker = isYes ? "url(#arrow-green)" : isNo ? "url(#arrow-red)" : "url(#arrow)";

          return (
            <g key={`${edge.from}-${edge.to}`}>
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={isNo ? "4 3" : undefined}
                markerEnd={marker}
                opacity={0.7}
              />
              {/* Label for yes/no */}
              {edge.type !== "normal" && (
                <text
                  x={(getNodeCenter(from).cx + getNodeCenter(to).cx) / 2 + (isYes ? 8 : -8)}
                  y={(getNodeCenter(from).cy + getNodeCenter(to).cy) / 2}
                  fill={color}
                  fontSize="9"
                  fontWeight="500"
                >
                  {edge.type}
                </text>
              )}
            </g>
          );
        })}

        {/* Animated Particles */}
        {isPlaying && (
          <g filter="url(#glow)">
            {particlePaths.map((flow, i) => (
              <AnimatedParticle
                key={flow.id}
                pathId={flow.id}
                color={flow.color}
                duration={4}
                delay={i * 0.8}
              />
            ))}
          </g>
        )}

        {/* Draw Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const dim = getNodeDimensions(node.type);

          // Decision node (diamond)
          if (node.type === "decision") {
            const cx = node.x + dim.w / 2;
            const cy = node.y + dim.h / 2;
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <motion.polygon
                  points={`${cx},${cy - 28} ${cx + 42},${cy} ${cx},${cy + 28} ${cx - 42},${cy}`}
                  fill={isSelected ? "#FEF3C7" : "#FFFBEB"}
                  stroke={isSelected ? "#3B82F6" : "#F59E0B"}
                  strokeWidth={2}
                  whileHover={{ scale: 1.05 }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400E">
                  {node.label}
                </text>
              </g>
            );
          }

          // Store node (cylinder-like rectangle)
          if (node.type === "store") {
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <motion.rect
                  x={node.x} y={node.y} width={dim.w} height={dim.h} rx={4}
                  fill={isSelected ? "#FFF7ED" : "#FFEDD5"}
                  stroke={isSelected ? "#3B82F6" : "#EA580C"}
                  strokeWidth={2}
                  whileHover={{ scale: 1.03 }}
                  style={{ transformOrigin: `${node.x + dim.w/2}px ${node.y + dim.h/2}px` }}
                />
                {/* Cylinder top */}
                <ellipse
                  cx={node.x + dim.w / 2}
                  cy={node.y + 5}
                  rx={dim.w / 2 - 10}
                  ry={5}
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth={1.5}
                  opacity={0.6}
                />
                <text x={node.x + dim.w / 2} y={node.y + dim.h / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#9A3412">
                  {node.label}
                </text>
              </g>
            );
          }

          // Start node (rounded pill)
          if (node.type === "start") {
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <motion.rect
                  x={node.x} y={node.y} width={dim.w} height={dim.h} rx={20}
                  fill={isSelected ? "#DCFCE7" : "#F0FDF4"}
                  stroke={isSelected ? "#3B82F6" : "#22C55E"}
                  strokeWidth={2}
                  whileHover={{ scale: 1.05 }}
                  style={{ transformOrigin: `${node.x + dim.w/2}px ${node.y + dim.h/2}px` }}
                />
                <text x={node.x + dim.w / 2} y={node.y + dim.h / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#166534">
                  {node.label}
                </text>
              </g>
            );
          }

          // End node (rounded)
          if (node.type === "end") {
            const isTamper = node.id === "tamper_flag";
            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <motion.rect
                  x={node.x} y={node.y} width={dim.w} height={dim.h} rx={20}
                  fill={isSelected ? "#DBEAFE" : isTamper ? "#FEE2E2" : "#F0F9FF"}
                  stroke={isSelected ? "#3B82F6" : isTamper ? "#EF4444" : "#0EA5E9"}
                  strokeWidth={2}
                  whileHover={{ scale: 1.05 }}
                  style={{ transformOrigin: `${node.x + dim.w/2}px ${node.y + dim.h/2}px` }}
                />
                <text x={node.x + dim.w / 2} y={node.y + dim.h / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill={isTamper ? "#991B1B" : "#0C4A6E"}>
                  {node.label}
                </text>
              </g>
            );
          }

          // Process node (default rectangle)
          const isOperator = node.section === "operator";
          return (
            <g
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
            >
              <motion.rect
                x={node.x} y={node.y} width={dim.w} height={dim.h} rx={6}
                fill={isSelected ? "#DBEAFE" : "white"}
                stroke={isSelected ? "#3B82F6" : isOperator ? "#3B82F6" : "#22C55E"}
                strokeWidth={2}
                whileHover={{ scale: 1.03 }}
                style={{ transformOrigin: `${node.x + dim.w/2}px ${node.y + dim.h/2}px` }}
              />
              <text x={node.x + dim.w / 2} y={node.y + dim.h / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1E293B">
                {node.label}
              </text>
              {/* Activity indicator */}
              <motion.circle
                cx={node.x + dim.w - 8}
                cy={node.y + 8}
                r={4}
                fill={isOperator ? "#3B82F6" : "#22C55E"}
                animate={isPlaying ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </g>
          );
        })}
      </svg>

      {/* Node Detail Sheet */}
      <Sheet open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <SheetContent className="sm:max-w-md">
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <SheetHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={selectedNode.section === "operator" ? "default" : "secondary"}>
                      {selectedNode.section === "operator" ? "Operator" : "Commission"}
                    </Badge>
                    <Badge variant="outline">
                      {selectedNode.type === "decision" ? "Decision" :
                       selectedNode.type === "store" ? "Data Store" :
                       selectedNode.type === "start" ? "Entry Point" :
                       selectedNode.type === "end" ? "Output" : "Process"}
                    </Badge>
                  </div>
                  <SheetTitle className="text-xl">{selectedNode.label}</SheetTitle>
                  <SheetDescription className="text-sm">{selectedNode.description}</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      Key Details
                    </h4>
                    <ul className="space-y-2 pl-3">
                      {selectedNode.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Connected nodes */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      Connections
                    </h4>
                    <div className="space-y-2 pl-3">
                      {edges.filter(e => e.from === selectedNode.id).map(edge => {
                        const toNode = nodeMap[edge.to];
                        return toNode && (
                          <div key={edge.to} className="text-sm flex items-center gap-2">
                            <span className="text-muted-foreground">→</span>
                            <span>{toNode.label}</span>
                            {edge.type !== "normal" && (
                              <Badge variant={edge.type === "yes" ? "default" : "destructive"} className="text-[10px] h-4">
                                {edge.type}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                      {edges.filter(e => e.to === selectedNode.id).map(edge => {
                        const fromNode = nodeMap[edge.from];
                        return fromNode && (
                          <div key={edge.from} className="text-sm flex items-center gap-2">
                            <span className="text-muted-foreground">←</span>
                            <span>{fromNode.label}</span>
                            {edge.type !== "normal" && (
                              <Badge variant={edge.type === "yes" ? "default" : "destructive"} className="text-[10px] h-4">
                                {edge.type}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SheetContent>
      </Sheet>
    </div>
  );
}
