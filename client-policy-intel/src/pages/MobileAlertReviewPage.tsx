import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { api, type Alert } from "../api";
import { useAsync } from "../hooks";

/**
 * Mobile-optimized alert review with swipe gestures.
 * Swipe right → Approve  |  Swipe left → Suppress
 * Includes quick-action buttons for non-swipe users.
 */

interface UndoItem {
  alert: Alert;
  action: "ready" | "suppressed";
  previousStatus: string;
}

export function MobileAlertReviewPage() {
  const [reviewed, setReviewed] = useState(0);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const [undoStack, setUndoStack] = useState<UndoItem[]>([]);
  const [showUndo, setShowUndo] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAlerts = useCallback(
    () => api.getAlerts({ limit: 50, status: "pending_review" }),
    [],
  );
  const { data: result, loading, error, refetch } = useAsync(fetchAlerts, []);

  const pendingAlerts = result?.data ?? [];
  const total = result?.total ?? 0;
  const currentAlert = pendingAlerts[0] ?? null;

  // Cleanup undo timer
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  async function doReview(alert: Alert, status: "ready" | "suppressed", reviewerNote?: string) {
    setBusy(true);
    try {
      await api.patchAlert(alert.id, { status, reviewerNote });
      setReviewed((r) => r + 1);

      // Push undo
      const item: UndoItem = { alert, action: status, previousStatus: alert.status };
      setUndoStack((s) => [...s.slice(-9), item]);
      setShowUndo(true);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setShowUndo(false), 4000);

      // Animate exit then refetch
      setExitDir(status === "ready" ? "right" : "left");
      setTimeout(() => {
        setExitDir(null);
        setSwipeX(0);
        refetch();
      }, 250);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      window.alert("Review failed: " + msg);
    } finally {
      setBusy(false);
      setNoteMode(false);
      setNote("");
    }
  }

  async function handleUndo() {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    setBusy(true);
    try {
      await api.patchAlert(last.alert.id, { status: "pending_review" });
      setUndoStack((s) => s.slice(0, -1));
      setReviewed((r) => Math.max(0, r - 1));
      setShowUndo(false);
      refetch();
    } catch {
      /* ignore undo failures */
    } finally {
      setBusy(false);
    }
  }

  // --- Touch handlers for swipe ---
  function onTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
    setSwiping(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    setSwipeX(dx);
  }

  function onTouchEnd() {
    if (!touchStart.current || !currentAlert) {
      setSwiping(false);
      setSwipeX(0);
      return;
    }
    const threshold = 100;
    if (swipeX > threshold) {
      doReview(currentAlert, "ready");
    } else if (swipeX < -threshold) {
      doReview(currentAlert, "suppressed");
    } else {
      setSwipeX(0);
    }
    setSwiping(false);
    touchStart.current = null;
  }

  // Mouse-based swipe for testing on desktop
  const mouseDown = useRef(false);
  function onMouseDown(e: React.MouseEvent) {
    mouseDown.current = true;
    touchStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    setSwiping(true);
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!mouseDown.current || !touchStart.current) return;
    const dx = e.clientX - touchStart.current.x;
    setSwipeX(dx);
  }
  function onMouseUp() {
    if (!mouseDown.current) return;
    mouseDown.current = false;
    onTouchEnd();
  }

  const scoreColor = (s: number) => s >= 70 ? "#e74c3c" : s >= 40 ? "#e67e22" : "#95a5a6";

  // Swipe visual cues
  const swipePct = Math.min(Math.abs(swipeX) / 100, 1);
  const isApproveSwipe = swipeX > 30;
  const isSuppressSwipe = swipeX < -30;

  return (
    <div style={{
      maxWidth: 480,
      margin: "0 auto",
      padding: "16px 12px",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      touchAction: "pan-y",
      userSelect: "none",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        flexShrink: 0,
      }}>
        <Link href="/alerts">
          <span style={{ fontSize: 14, color: "#3498db", cursor: "pointer" }}>← Queue</span>
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#2c3e50" }}>
          Mobile Review
        </h1>
        <div style={{ fontSize: 12, color: "#888" }}>
          {reviewed} done
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4,
        background: "#e0e0e0",
        borderRadius: 2,
        marginBottom: 16,
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <div style={{
          height: "100%",
          width: total > 0 ? `${(reviewed / (reviewed + total)) * 100}%` : "0%",
          background: "#27ae60",
          borderRadius: 2,
          transition: "width 0.3s",
        }} />
      </div>

      {/* Counter */}
      <div style={{
        textAlign: "center",
        fontSize: 13,
        color: "#888",
        marginBottom: 12,
        flexShrink: 0,
      }}>
        {total > 0 ? `${total} pending review` : "All caught up!"}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading alerts...</div>}
      {error && <div style={{ textAlign: "center", padding: 40, color: "#e74c3c" }}>{error}</div>}

      {/* Empty state */}
      {!loading && !currentAlert && (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "#888",
          gap: 12,
        }}>
          <div style={{ fontSize: 48 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Inbox zero!</div>
          <div style={{ fontSize: 13 }}>No pending alerts to review.</div>
          <button
            onClick={() => { setReviewed(0); refetch(); }}
            style={{
              marginTop: 16,
              padding: "10px 24px",
              fontSize: 14,
              background: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      )}

      {/* Swipe card area */}
      {currentAlert && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          {/* Swipe indicators */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 20px",
            pointerEvents: "none",
            zIndex: 0,
          }}>
            <div style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#e74c3c",
              opacity: isSuppressSwipe ? swipePct : 0,
              transform: `scale(${isSuppressSwipe ? 0.8 + swipePct * 0.4 : 0.8})`,
              transition: swiping ? "none" : "all 0.2s",
            }}>
              SUPPRESS
            </div>
            <div style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#27ae60",
              opacity: isApproveSwipe ? swipePct : 0,
              transform: `scale(${isApproveSwipe ? 0.8 + swipePct * 0.4 : 0.8})`,
              transition: swiping ? "none" : "all 0.2s",
            }}>
              APPROVE
            </div>
          </div>

          {/* The main card */}
          <div
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={() => { if (mouseDown.current) onMouseUp(); }}
            style={{
              position: "relative",
              zIndex: 1,
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              padding: 20,
              transform: exitDir
                ? `translateX(${exitDir === "right" ? 400 : -400}px) rotate(${exitDir === "right" ? 15 : -15}deg)`
                : `translateX(${swipeX}px) rotate(${swipeX * 0.05}deg)`,
              transition: swiping ? "none" : "transform 0.25s ease-out",
              borderLeft: `5px solid ${
                isApproveSwipe
                  ? `rgba(39,174,96,${swipePct})`
                  : isSuppressSwipe
                  ? `rgba(231,76,60,${swipePct})`
                  : scoreColor(currentAlert.relevanceScore)
              }`,
              cursor: "grab",
              overflow: "hidden",
            }}
          >
            {/* Score badge */}
            <div style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: scoreColor(currentAlert.relevanceScore),
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{currentAlert.relevanceScore}</span>
              <span style={{ fontSize: 8, opacity: 0.8 }}>score</span>
            </div>

            {/* Title */}
            <div style={{ fontSize: 16, fontWeight: 700, color: "#2c3e50", paddingRight: 60, lineHeight: 1.3 }}>
              {currentAlert.title}
            </div>

            {/* Why it matters */}
            {currentAlert.whyItMatters && (
              <p style={{
                fontSize: 13,
                color: "#555",
                marginTop: 10,
                lineHeight: 1.5,
              }}>
                {currentAlert.whyItMatters.slice(0, 400)}
                {currentAlert.whyItMatters.length > 400 && "…"}
              </p>
            )}

            {/* Summary fallback */}
            {!currentAlert.whyItMatters && currentAlert.summary && (
              <p style={{ fontSize: 13, color: "#555", marginTop: 10, lineHeight: 1.5 }}>
                {currentAlert.summary.slice(0, 400)}
                {currentAlert.summary.length > 400 && "…"}
              </p>
            )}

            {/* Evaluator scorecard */}
            {currentAlert.reasonsJson?.length > 0 && currentAlert.reasonsJson[0]?.evaluator && (
              <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {currentAlert.reasonsJson.map((ev, i) => (
                  <span key={i} style={{
                    padding: "3px 8px",
                    borderRadius: 10,
                    fontSize: 11,
                    background: ev.evaluatorScore >= 15 ? "#27ae6022" : "#f0f0f0",
                    color: ev.evaluatorScore >= 15 ? "#27ae60" : "#888",
                  }}>
                    {ev.evaluator.replace(/_/g, " ")}: {ev.evaluatorScore}/{ev.maxScore}
                  </span>
                ))}
              </div>
            )}

            {/* Metadata */}
            <div style={{
              marginTop: 14,
              fontSize: 11,
              color: "#aaa",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}>
              <span>{new Date(currentAlert.createdAt).toLocaleDateString()}</span>
              {currentAlert.issueRoomId && (
                <span>Issue room #{currentAlert.issueRoomId}</span>
              )}
            </div>

            {/* Swipe hint */}
            <div style={{
              marginTop: 16,
              textAlign: "center",
              fontSize: 11,
              color: "#bbb",
              letterSpacing: 1,
            }}>
              ← SUPPRESS &nbsp;·&nbsp; SWIPE &nbsp;·&nbsp; APPROVE →
            </div>
          </div>

          {/* Note input (expandable) */}
          {noteMode && (
            <div style={{
              marginTop: 12,
              background: "#f8f9fa",
              borderRadius: 12,
              padding: 12,
            }}>
              <textarea
                placeholder="Add a note before reviewing..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  padding: 10,
                  fontSize: 14,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => doReview(currentAlert, "ready", note || undefined)}
                  disabled={busy}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    fontSize: 14,
                    fontWeight: 600,
                    background: "#27ae60",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => doReview(currentAlert, "suppressed", note || undefined)}
                  disabled={busy}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    fontSize: 14,
                    fontWeight: 600,
                    background: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  Suppress
                </button>
              </div>
            </div>
          )}

          {/* Quick-action bar */}
          <div style={{
            display: "flex",
            gap: 10,
            marginTop: 16,
            flexShrink: 0,
          }}>
            <button
              onClick={() => doReview(currentAlert, "suppressed")}
              disabled={busy}
              style={{
                flex: 1,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 700,
                background: "#fde8e8",
                color: "#e74c3c",
                border: "2px solid #e74c3c",
                borderRadius: 12,
                cursor: "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              ✕ Suppress
            </button>
            <button
              onClick={() => setNoteMode(!noteMode)}
              style={{
                width: 52,
                padding: "14px 0",
                fontSize: 15,
                background: noteMode ? "#3498db" : "#f0f0f0",
                color: noteMode ? "#fff" : "#555",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              ✎
            </button>
            <Link href={`/alerts/${currentAlert.id}`}>
              <div style={{
                width: 52,
                padding: "14px 0",
                fontSize: 15,
                background: "#f0f0f0",
                color: "#555",
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "center",
              }}>
                ⋯
              </div>
            </Link>
            <button
              onClick={() => doReview(currentAlert, "ready")}
              disabled={busy}
              style={{
                flex: 1,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 700,
                background: "#e8f8ef",
                color: "#27ae60",
                border: "2px solid #27ae60",
                borderRadius: 12,
                cursor: "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              ✓ Approve
            </button>
          </div>

          {/* Peek at next card */}
          {pendingAlerts.length > 1 && (
            <div style={{
              marginTop: 12,
              background: "#f8f9fa",
              borderRadius: 12,
              padding: "10px 14px",
              opacity: 0.6,
              fontSize: 13,
              color: "#555",
              borderLeft: `3px solid ${scoreColor(pendingAlerts[1].relevanceScore)}`,
            }}>
              <strong>Next:</strong> {pendingAlerts[1].title.slice(0, 80)}
              <span style={{ float: "right", fontWeight: 700, color: scoreColor(pendingAlerts[1].relevanceScore) }}>
                {pendingAlerts[1].relevanceScore}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Undo toast */}
      {showUndo && undoStack.length > 0 && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#2c3e50",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 24,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          zIndex: 2000,
        }}>
          <span>
            {undoStack[undoStack.length - 1].action === "ready" ? "Approved" : "Suppressed"}
          </span>
          <button
            onClick={handleUndo}
            disabled={busy}
            style={{
              padding: "4px 14px",
              fontSize: 12,
              fontWeight: 700,
              background: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            UNDO
          </button>
        </div>
      )}
    </div>
  );
}
