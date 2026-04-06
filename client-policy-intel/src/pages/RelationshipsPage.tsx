import { useState, useCallback } from "react";
import { api, type NetworkGraph, type StakeholderDossier } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

// ── Relationship Type Labels ─────────────────────────────────────────────────

const REL_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  funds: { label: "Funds", color: "#27ae60" },
  lobbies_for: { label: "Lobbies For", color: "#3498db" },
  opposes: { label: "Opposes", color: "#e74c3c" },
  co_sponsors: { label: "Co-Sponsors", color: "#2ecc71" },
  staff_of: { label: "Staff Of", color: "#95a5a6" },
  committee_together: { label: "Committee", color: "#f39c12" },
  testified_before: { label: "Testified Before", color: "#9b59b6" },
  client_of: { label: "Client Of", color: "#1abc9c" },
  ally: { label: "Ally", color: "#2980b9" },
  adversary: { label: "Adversary", color: "#c0392b" },
};

// ── Node Card ────────────────────────────────────────────────────────────────

function NodeCard({
  node,
  onSelect,
  selected,
}: {
  node: NetworkGraph["nodes"][0];
  onSelect: () => void;
  selected: boolean;
}) {
  const partyColor = node.party === "R" ? "#e74c3c" : node.party === "D" ? "#3498db" : "#95a5a6";

  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? "#eaf2f8" : "#fff",
        borderRadius: 8, padding: 12, cursor: "pointer",
        border: selected ? "2px solid #3498db" : "1px solid #ecf0f1",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {node.party && (
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: partyColor, display: "inline-block",
          }} />
        )}
        <span style={{ fontWeight: 600, fontSize: 14, color: "#2c3e50" }}>{node.name}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 11, color: "#888" }}>
        <span>{node.type}</span>
        {node.chamber && <span>{node.chamber}</span>}
        <span>Connections: {node.connectionCount}</span>
        <span>Influence: {node.influence}</span>
      </div>
    </div>
  );
}

// ── Dossier Panel ────────────────────────────────────────────────────────────

function DossierPanel({ dossier }: { dossier: StakeholderDossier }) {
  const s = dossier.stakeholder;
  const partyColor = s.party === "R" ? "#e74c3c" : s.party === "D" ? "#3498db" : "#95a5a6";

  return (
    <div style={{
      background: "#fff", borderRadius: 8, padding: 20,
      border: "1px solid #d5dbdb", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {s.party && (
            <span style={{
              background: partyColor, color: "#fff",
              padding: "2px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
            }}>
              {s.party}
            </span>
          )}
          <h2 style={{ margin: 0, color: "#1a365d" }}>{s.name}</h2>
        </div>
        <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
          {s.type} {s.chamber && `· ${s.chamber}`} {s.district && `· District ${s.district}`} {s.role && `· ${s.role}`}
        </div>
        <div style={{
          display: "flex", gap: 16, marginTop: 8,
        }}>
          <div style={{
            background: "#eaf2f8", padding: "8px 16px", borderRadius: 8,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1a365d" }}>{dossier.influenceScore}</div>
            <div style={{ fontSize: 11, color: "#888" }}>Influence</div>
          </div>
          <div style={{
            background: "#eaf2f8", padding: "8px 16px", borderRadius: 8,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1a365d" }}>{dossier.reachability}</div>
            <div style={{ fontSize: 11, color: "#888" }}>Reachability</div>
          </div>
          <div style={{
            background: "#eaf2f8", padding: "8px 16px", borderRadius: 8,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1a365d" }}>{dossier.relationships.length}</div>
            <div style={{ fontSize: 11, color: "#888" }}>Relationships</div>
          </div>
        </div>
      </div>

      {/* Committees */}
      {dossier.committees.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 8px", color: "#1a365d" }}>Committees</h4>
          {dossier.committees.map((c, i) => (
            <div key={i} style={{
              padding: "4px 0", fontSize: 13, borderBottom: "1px solid #f5f5f5",
              display: "flex", gap: 8,
            }}>
              <span style={{ fontWeight: 600 }}>{c.committee}</span>
              <span style={{
                background: c.role === "chair" ? "#f39c12" : c.role === "vice-chair" ? "#3498db" : "#ecf0f1",
                color: c.role === "chair" || c.role === "vice-chair" ? "#fff" : "#555",
                padding: "1px 8px", borderRadius: 10, fontSize: 11,
              }}>
                {c.role}
              </span>
              <span style={{ color: "#888" }}>{c.chamber}</span>
            </div>
          ))}
        </div>
      )}

      {/* Relationships */}
      {dossier.relationships.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 8px", color: "#1a365d" }}>Relationships</h4>
          {dossier.relationships.slice(0, 15).map((r, i) => {
            const relInfo = REL_TYPE_LABELS[r.type] ?? { label: r.type, color: "#95a5a6" };
            return (
              <div key={i} style={{
                padding: "6px 0", fontSize: 13, borderBottom: "1px solid #f5f5f5",
                display: "flex", gap: 8, alignItems: "center",
              }}>
                <span style={{
                  background: relInfo.color, color: "#fff",
                  padding: "1px 8px", borderRadius: 10, fontSize: 11, minWidth: 60, textAlign: "center",
                }}>
                  {relInfo.label}
                </span>
                <span style={{ fontWeight: 600 }}>{r.relatedStakeholder.name}</span>
                <span style={{ color: "#888", fontSize: 11 }}>
                  Strength: {Math.round(r.strength * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bill Connections */}
      {dossier.billConnections.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 8px", color: "#1a365d" }}>Bill Connections</h4>
          {dossier.billConnections.slice(0, 10).map((b, i) => (
            <div key={i} style={{ padding: "4px 0", fontSize: 13, borderBottom: "1px solid #f5f5f5" }}>
              <span style={{ fontWeight: 600 }}>{b.billId}</span>
              <span style={{ color: "#888", marginLeft: 8 }}>{b.role}</span>
              {b.alert && (
                <span style={{ color: "#555", marginLeft: 8, fontSize: 12 }}>
                  — {b.alert.title} (Score: {b.alert.score})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent Observations */}
      {dossier.observations.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 8px", color: "#1a365d" }}>Recent Observations</h4>
          {dossier.observations.slice(0, 5).map((o, i) => (
            <div key={i} style={{
              padding: "6px 0", fontSize: 13, borderBottom: "1px solid #f5f5f5",
            }}>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{
                  background: "#ecf0f1", padding: "1px 8px", borderRadius: 10, fontSize: 11,
                }}>{o.type}</span>
                <span style={{ color: "#888", fontSize: 11 }}>
                  {new Date(o.date).toLocaleDateString()}
                </span>
              </div>
              <div style={{ color: "#555", marginTop: 2 }}>{o.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function RelationshipsPage() {
  const [workspaceId] = useState(DEFAULT_WORKSPACE_ID);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [minStrength, setMinStrength] = useState(0.2);
  const [discovering, setDiscovering] = useState(false);

  const { data: network, loading, error, refetch } = useAsync(
    () => api.getRelationshipNetwork(workspaceId, { minStrength }),
    [workspaceId, minStrength],
  );

  const { data: dossier } = useAsync(
    () =>
      selectedNodeId
        ? api.getStakeholderDossier(workspaceId, selectedNodeId)
        : Promise.resolve(null),
    [workspaceId, selectedNodeId],
  );

  const handleAutoDiscover = useCallback(async () => {
    setDiscovering(true);
    try {
      await api.autoDiscoverRelationships(workspaceId);
      refetch();
    } finally {
      setDiscovering(false);
    }
  }, [workspaceId, refetch]);

  if (loading) return <div style={{ padding: 24 }}>Loading network...</div>;
  if (error) return <div style={{ padding: 24, color: "#e74c3c" }}>Error: {error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, color: "#1a365d", fontSize: 28 }}>🔗 Relationship Intelligence</h1>
          <p style={{ margin: "4px 0 0", color: "#555", fontSize: 14 }}>
            Political influence network — who knows who, who funds whom, who opposes what
          </p>
        </div>
        <button
          onClick={handleAutoDiscover}
          disabled={discovering}
          style={{
            padding: "8px 20px", background: "#2ecc71", color: "#fff",
            border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14,
            opacity: discovering ? 0.6 : 1,
          }}
        >
          {discovering ? "Discovering..." : "Auto-Discover Relationships"}
        </button>
      </div>

      {/* Network Stats */}
      {network && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16, marginBottom: 24,
        }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a365d" }}>{network.stats.totalNodes}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Stakeholders</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a365d" }}>{network.stats.totalEdges}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Relationships</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a365d" }}>{network.stats.avgConnections.toFixed(1)}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Avg Connections</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 8, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a365d" }}>{network.stats.clusters}</div>
            <div style={{ fontSize: 12, color: "#888" }}>Clusters</div>
          </div>
          {network.stats.mostConnected && (
            <div style={{ background: "#fff", borderRadius: 8, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a365d" }}>{network.stats.mostConnected.name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>Most Connected ({network.stats.mostConnected.connections})</div>
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div style={{
        display: "flex", gap: 16, alignItems: "center", marginBottom: 20,
        background: "#f8f9fa", padding: 12, borderRadius: 8,
      }}>
        <label style={{ fontSize: 13, color: "#555" }}>
          Min Strength:
          <input
            type="range" min={0} max={0.9} step={0.1}
            value={minStrength}
            onChange={(e) => setMinStrength(parseFloat(e.target.value))}
            style={{ marginLeft: 8 }}
          />
          <span style={{ marginLeft: 4, fontWeight: 600 }}>{Math.round(minStrength * 100)}%</span>
        </label>
      </div>

      {/* Main Content: Node List + Dossier */}
      <div style={{ display: "grid", gridTemplateColumns: dossier ? "1fr 1fr" : "1fr", gap: 24 }}>
        {/* Node List */}
        <div>
          <h3 style={{ color: "#1a365d", marginBottom: 12 }}>
            Network Nodes ({network?.nodes.length ?? 0})
          </h3>
          <div style={{ display: "grid", gap: 8, maxHeight: 700, overflowY: "auto" }}>
            {network?.nodes
              .sort((a, b) => b.influence - a.influence)
              .map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  onSelect={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                  selected={node.id === selectedNodeId}
                />
              ))}
          </div>
        </div>

        {/* Dossier */}
        {dossier && (
          <div>
            <h3 style={{ color: "#1a365d", marginBottom: 12 }}>📋 Stakeholder Dossier</h3>
            <DossierPanel dossier={dossier} />
          </div>
        )}
      </div>
    </div>
  );
}
