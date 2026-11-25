import type { excerptPic_video } from "@alx-plugins/marginnote";
import type { ReturnBody_Toc, Toc } from "../return";

const pad = (value: number): string => String(value).padStart(2, "0");
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function orgDate(value: number): string | undefined {
  if (value == null) return undefined;
  const dt = new Date(value);
  if (!Number.isFinite(dt.getTime())) return undefined;
  return `[${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ` +
    `${weekdays[dt.getDay()]} ${pad(dt.getHours())}:${pad(dt.getMinutes())}]`;
}

function videoTime(position?: string): string | undefined {
  if (!position) return undefined;
  const [kind, total, relative, ...extra] = position.split("|");
  if (kind !== "MN3VIDEO" || extra.length || !total?.trim() || !relative?.trim()) return undefined;
  const duration = Number(total), fraction = Number(relative);
  const seconds = Math.floor(duration * fraction);
  if (duration <= 0 || fraction < 0 || fraction > 1 || !Number.isSafeInteger(seconds)) return undefined;
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(pad).join(":");
}

const singleLine = (value: string): string => value.replace(/[\r\n]+/g, " ").trim();

type Properties = Record<string, string | number | undefined>;

function heading(depth: number, title: string, properties: Properties): string {
  const drawer = Object.entries(properties)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `:${key}: ${singleLine(String(value))}`);
  return ["*".repeat(depth) + " " + singleLine(title), ":PROPERTIES:", ...drawer, ":END:"].join("\n");
}

export function convert_to_org({ data: root }: ReturnBody_Toc): string {
  const db = Database.sharedInstance();
  const entries: { depth: number; title: string; properties: Properties; body: string }[] = [];
  let hasVideo = false;

  function visit(toc: Toc, depth: number, isRoot = false): void {
    const note = db.getNoteById(toc.noteId);
    const video = Boolean((note?.excerptPic as excerptPic_video)?.video);
    hasVideo = hasVideo || video;
    // The document root is a container. A missing live lookup for a child
    // must not discard the text already captured in the export tree.
    const visible = !isRoot || video || Boolean(note?.parentNote);
    if (visible) {
      const body = [toc.excerptText, toc.notesText].filter(Boolean).join("\n\n");
      const preview = (body.split(/\r?\n/).find(line => line.trim()) || "").trim();
      const chars = Array.from(preview);
      const fallback = chars.length > 80 ? chars.slice(0, 79).join("") + "…" : preview;
      const title = toc.noteTitle?.trim() || fallback || "Untitled note";
      const common = {
        ID: toc.noteTitle || video ? toc.noteId : undefined,
        CREATED: orgDate(toc.createDate),
        MODIFIED: orgDate(toc.modifiedDate),
        MARGINNOTE_LINK: "marginnote3app://note/" + toc.noteId,
      };
      const properties = video ? {
        ...common,
        MPV_POSITION_START: videoTime(note?.startPos),
        MPV_POSITION_END: videoTime(note?.endPos),
      } : {
        ...common,
        NOTER_PAGE: toc.startPage,
        NOTER_PAGE_END: toc.endPage,
        HIGHLIGHT_COLOR_INDEX: note?.colorIndex,
        IS_MERGED: String(Boolean(toc.notesText)),
      };
      // Indent literal asterisk-led lines so excerpts cannot split the outline.
      entries.push({ depth, title, properties, body: body.replace(/^(\*+)(?=[ \t]|$)/gm, " $1") });
    }
    for (const child of toc.childNotes) visit(child, visible ? depth + 1 : depth);
  }

  visit(root, 0, true);
  const base = hasVideo ? 3 : 2;
  const lines = entries.map(entry => heading(base + entry.depth, entry.title, entry.properties) + "\n" + entry.body);
  if (hasVideo) {
    const document = db.getDocumentById(root.docMd5 || "");
    const name = document?.pathFile?.split("/").pop();
    lines.unshift(heading(2, root.noteTitle || name || "Video notes", { MPV_VIDEO_FILENAME: name }));
  }
  return lines.length ? lines.join("\n\n") + "\n" : "";
}
