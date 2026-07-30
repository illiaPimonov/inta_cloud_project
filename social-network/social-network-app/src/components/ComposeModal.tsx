"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { useCompose } from "@/store/composeStore";
import { useToast } from "@/store/toastStore";
import { getCurrentUserHandle, getCurrentUserName } from "@/lib/session";
import styles from "./ComposeModal.module.css";

const MAX_CHARS = 280;
const DRAFTS_KEY = "sn_compose_drafts";
const EMOJIS = [
  "😀", "😂", "🥰", "😎", "🤔", "😢", "😮", "🔥",
  "🎉", "👏", "🙌", "👍", "👎", "❤️", "💯", "✨",
  "🚀", "😴", "🤯", "😅", "🙏", "😇", "🥳", "😤",
];
const STICKERS = [
  { id: "s1", label: "😂 LOL" },
  { id: "s2", label: "🎉 Party" },
  { id: "s3", label: "🔥 Fire" },
  { id: "s4", label: "❤️ Love" },
  { id: "s5", label: "😮 Wow" },
  { id: "s6", label: "👏 Clap" },
];
const AUDIENCES = ["Everyone", "People you follow", "Only people you mention"] as const;
type Audience = (typeof AUDIENCES)[number];

interface MediaItem {
  id: string;
  kind: "image" | "sticker";
  url?: string;
  label: string;
}

interface Draft {
  id: string;
  text: string;
  savedAt: number;
}

type Popover = "emoji" | "gif" | "audience" | "drafts" | null;

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadDrafts(): Draft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: Draft[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts.slice(0, 20)));
}

export default function ComposeModal() {
  const { isOpen, closeCompose } = useCompose();
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState("1 day");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [audience, setAudience] = useState<Audience>("Everyone");
  const [popover, setPopover] = useState<Popover>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [posting, setPosting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const t = window.setTimeout(() => textareaRef.current?.focus(), 10);
      return () => window.clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (popover) setPopover(null);
        else handleClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handlePost();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);

  }, [isOpen, text, media, pollOpen, pollOptions, locationOpen, location, popover]);

  useEffect(() => {
    return () => {
      media.forEach((m) => m.url && URL.revokeObjectURL(m.url));
    };

  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    media.forEach((m) => m.url && URL.revokeObjectURL(m.url));
    setText("");
    setMedia([]);
    setPollOpen(false);
    setPollOptions(["", ""]);
    setPollDuration("1 day");
    setScheduleOpen(false);
    setScheduledAt("");
    setLocationOpen(false);
    setLocation("");
    setAudience("Everyone");
    setPopover(null);
  };

  const handleClose = () => {
    if (text.trim().length > 0) {
      const save = window.confirm("Save this post to Drafts before closing?");
      if (save) {
        const next = [{ id: randomId(), text, savedAt: Date.now() }, ...loadDrafts()];
        saveDrafts(next);
        showToast("Saved to Drafts");
      } else {
        return;
      }
    }
    resetForm();
    closeCompose();
  };

  const insertAtCursor = (insert: string) => {
    const el = textareaRef.current;
    if (!el) {
      setText((t) => t + insert);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + insert + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setPopover(null);
    setMedia((prev) => {
      const room = Math.max(0, 4 - prev.length);
      const added: MediaItem[] = files.slice(0, room).map((f) => ({
        id: randomId(),
        kind: "image",
        url: URL.createObjectURL(f),
        label: f.name,
      }));
      return [...prev, ...added];
    });
  };

  const removeMedia = (id: string) => {
    setMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((m) => m.id !== id);
    });
  };

  const addSticker = (label: string) => {
    if (media.length >= 4) return;
    setMedia((prev) => [...prev, { id: randomId(), kind: "sticker", label }]);
    setPopover(null);
  };

  const togglePoll = () => {
    if (media.length > 0) return;
    setPollOpen((o) => !o);
  };

  const updatePollOption = (i: number, val: string) => {
    setPollOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  };

  const addPollOption = () => {
    setPollOptions((prev) => (prev.length < 4 ? [...prev, ""] : prev));
  };

  const removePollOption = (i: number) => {
    setPollOptions((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev));
  };

  const openDrafts = () => {
    setDrafts(loadDrafts());
    setPopover((p) => (p === "drafts" ? null : "drafts"));
  };

  const loadDraft = (draft: Draft) => {
    setText(draft.text);
    const remaining = loadDrafts().filter((d) => d.id !== draft.id);
    saveDrafts(remaining);
    setDrafts(remaining);
    setPopover(null);
    window.setTimeout(() => textareaRef.current?.focus(), 10);
  };

  const deleteDraft = (id: string) => {
    const remaining = loadDrafts().filter((d) => d.id !== id);
    saveDrafts(remaining);
    setDrafts(remaining);
  };

  const buildFinalText = () => {
    let out = text.trim();
    if (pollOpen) {
      const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (opts.length >= 2) {
        out += `\n\n📊 Poll (${pollDuration}): ${opts.join(" · ")}`;
      }
    }
    if (locationOpen && location.trim()) {
      out += `\n📍 ${location.trim()}`;
    }
    return out;
  };

  const handlePost = async () => {
    if (text.trim().length === 0 || text.length > MAX_CHARS || posting) return;
    if (pollOpen) {
      const filled = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (filled.length < 2) {
        showToast("A poll needs at least 2 options", "error");
        return;
      }
    }
    const handle = getCurrentUserHandle();
    if (!handle) {
      showToast("You're logged out — log back in to post", "error");
      return;
    }
    const authorName = getCurrentUserName();
    setPosting(true);
    try {
      const res = await fetch("/api/bff/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorHandle: handle,
          authorName,
          text: buildFinalText(),
          hasMedia: media.length > 0,
        }),
      });
      if (!res.ok) {
        showToast("Couldn't post — is the backend running?", "error");
        return;
      }
      if (scheduleOpen && scheduledAt) {
        showToast(
          `This demo has no background scheduler, so it posted now instead of at ${new Date(
            scheduledAt
          ).toLocaleString()}`
        );
      } else {
        showToast("Your post was sent", "success");
      }
      resetForm();
      closeCompose(true);
    } catch {
      showToast("Can't reach the backend — is docker compose running?", "error");
    } finally {
      setPosting(false);
    }
  };

  const remaining = MAX_CHARS - text.length;
  const pct = Math.min(100, (text.length / MAX_CHARS) * 100);
  const canPost = text.trim().length > 0 && text.length <= MAX_CHARS && !posting;
  const audienceLabel =
    audience === "Everyone"
      ? "Everyone can reply"
      : audience === "People you follow"
      ? "People you follow can reply"
      : "Only people you mention can reply";

  return (
    <div className={styles.scrim} onMouseDown={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Compose post" ref={wrapRef}>
        <div className={styles.top}>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
          <div className={styles.toolWrap}>
            <button className={styles.draftsLink} onClick={openDrafts}>
              Drafts
            </button>
            {popover === "drafts" && (
              <div className={styles.popover} style={{ left: "auto", right: 0, bottom: "auto", top: 36 }}>
                <div className={styles.draftsPanel}>
                  {drafts.length === 0 ? (
                    <div className={styles.draftEmpty}>No drafts saved</div>
                  ) : (
                    drafts.map((d) => (
                      <div key={d.id} className={styles.draftItem} onClick={() => loadDraft(d)}>
                        <span className={styles.draftPreview}>{d.text || "(empty)"}</span>
                        <button
                          className={styles.draftDelete}
                          aria-label="Delete draft"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDraft(d.id);
                          }}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={styles.content}>
          <Avatar name={getCurrentUserName()} size={40} />
          <div className={styles.right}>
            <div className={styles.toolWrap}>
              <button className={styles.audiencePill} onClick={() => setPopover((p) => (p === "audience" ? null : "audience"))}>
                {audienceLabel} <Icon name="chevron-down" size={12} />
              </button>
              {popover === "audience" && (
                <div className={styles.popover} style={{ top: 36, bottom: "auto" }}>
                  <div className={styles.menuList}>
                    {AUDIENCES.map((a) => (
                      <button
                        key={a}
                        className={`${styles.menuOption} ${a === audience ? styles.menuOptionActive : ""}`}
                        onClick={() => {
                          setAudience(a);
                          setPopover(null);
                        }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="What's happening?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />

            {media.length > 0 && (
              <div className={styles.mediaGrid}>
                {media.map((m) => (
                  <div key={m.id} className={styles.mediaItem}>
                    {m.kind === "image" ? (

                      <img src={m.url} alt={m.label} className={styles.mediaItemImg} />
                    ) : (
                      <div className={styles.stickerTile}>{m.label}</div>
                    )}
                    <button className={styles.removeMedia} aria-label="Remove media" onClick={() => removeMedia(m.id)}>
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pollOpen && (
              <div className={styles.pollBox}>
                <div className={styles.pollHeader}>
                  <span>Poll</span>
                  <button className={styles.inlineRemove} aria-label="Remove poll" onClick={togglePoll}>
                    <Icon name="close" size={14} />
                  </button>
                </div>
                {pollOptions.map((opt, i) => (
                  <div key={i} className={styles.pollOptionRow}>
                    <input
                      className={styles.pollOptionInput}
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      maxLength={25}
                      onChange={(e) => updatePollOption(i, e.target.value)}
                    />
                    {pollOptions.length > 2 && (
                      <button className={styles.pollRemoveOption} aria-label="Remove option" onClick={() => removePollOption(i)}>
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button className={styles.pollAddBtn} onClick={addPollOption}>
                    + Add option
                  </button>
                )}
                <select
                  className={styles.pollDurationSelect}
                  value={pollDuration}
                  onChange={(e) => setPollDuration(e.target.value)}
                >
                  <option>1 day</option>
                  <option>3 days</option>
                  <option>1 week</option>
                </select>
              </div>
            )}

            {scheduleOpen && (
              <div className={styles.inlineRow}>
                <input
                  type="datetime-local"
                  className={styles.inlineInput}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <button className={styles.inlineRemove} aria-label="Remove schedule" onClick={() => { setScheduleOpen(false); setScheduledAt(""); }}>
                  <Icon name="close" size={14} />
                </button>
              </div>
            )}

            {locationOpen && (
              <div className={styles.inlineRow}>
                <input
                  className={styles.inlineInput}
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <button className={styles.inlineRemove} aria-label="Remove location" onClick={() => { setLocationOpen(false); setLocation(""); }}>
                  <Icon name="close" size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className={styles.divider} />
        <div className={styles.bottom}>
          <div className={styles.toolbar}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFilesSelected}
            />
            <button
              className={styles.toolBtn}
              aria-label="Add image"
              disabled={pollOpen || media.length >= 4}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon name="image" size={20} />
            </button>
            <div className={styles.toolWrap}>
              <button
                className={styles.toolBtn}
                aria-label="Add GIF"
                disabled={pollOpen || media.length >= 4}
                onClick={() => setPopover((p) => (p === "gif" ? null : "gif"))}
              >
                <Icon name="gif" size={20} />
              </button>
              {popover === "gif" && (
                <div className={styles.popover}>
                  <div className={styles.stickerGrid}>
                    {STICKERS.map((s) => (
                      <button key={s.id} className={styles.stickerItem} onClick={() => addSticker(s.label)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className={styles.toolBtn} aria-label="Add poll" disabled={media.length > 0} onClick={togglePoll}>
              <Icon name="poll" size={20} />
            </button>
            <div className={styles.toolWrap}>
              <button
                className={styles.toolBtn}
                aria-label="Add emoji"
                onClick={() => setPopover((p) => (p === "emoji" ? null : "emoji"))}
              >
                <Icon name="emoji" size={20} />
              </button>
              {popover === "emoji" && (
                <div className={styles.popover}>
                  <div className={styles.emojiGrid}>
                    {EMOJIS.map((em) => (
                      <button key={em} className={styles.emojiItem} onClick={() => insertAtCursor(em)}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              className={styles.toolBtn}
              aria-label="Schedule"
              onClick={() => setScheduleOpen((o) => !o)}
            >
              <Icon name="schedule" size={20} />
            </button>
            <button
              className={styles.toolBtn}
              aria-label="Add location"
              onClick={() => setLocationOpen((o) => !o)}
            >
              <Icon name="location" size={20} />
            </button>
          </div>
          <div className={styles.rightControls}>
            {text.length > 0 && (
              <>
                {remaining <= 20 && <span className={styles.charCount}>{remaining}</span>}
                <div className={styles.charRing}>
                  <div
                    className={styles.charRingFg}
                    style={{
                      background: `conic-gradient(var(--color-accent) ${pct}%, transparent ${pct}%)`,
                      borderColor: remaining < 0 ? "var(--color-destructive)" : undefined,
                      WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))",
                      mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 3px))",
                    }}
                  />
                </div>
              </>
            )}
            <button
              className={styles.postBtn}
              disabled={!canPost}
              onClick={handlePost}
              style={{
                background: !canPost ? "var(--color-surface-hover)" : "var(--color-accent)",
                color: !canPost ? "var(--color-text-tertiary)" : "#fff",
                fontSize: 15,
                fontWeight: 700,
                padding: "0 22px",
                height: 40,
                borderRadius: "var(--radius-pill)",
                border: "none",
              }}
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
