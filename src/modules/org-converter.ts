import moment from "moment";
import {
  Book,
  Data,
  Note,
  ReturnBody,
  ReturnBody_Note,
  ReturnBody_Sel,
  ReturnBody_Toc,
  Selection,
  Toc,
} from "../return";
import {
  excerptPic_video,
  linkComment,
  MbBookNote,
} from "@alx-plugins/marginnote";

const orgTimeFormatForMomentjs = "YYYY-MM-DD ddd HH:mm";

export const convert_to_org = (body: ReturnBody_Toc): string => {
  const { data: toc } = body;
  const noteBook = Database.sharedInstance().getDocumentById(toc.docMd5 || "");
  const fileName = noteBook?.pathFile || "";
  let isVideoNotebook = false;
  // try {
  const iterate = (toc: Toc, depth = 0): string => {
    let {
      noteId,
      noteTitle,
      childNotes,
      excerptText,
      notesText: otherMergedText,
      // docMd5,
      startPage,
      endPage,
      createDate,
      modifiedDate,
    } = toc;
    excerptText = excerptText === undefined ? "" : excerptText;
    let isMerged = false;
    if (otherMergedText) {
      excerptText = excerptText + "\n\n" + otherMergedText;
      isMerged = true;
    }

    const note = Database.sharedInstance().getNoteById(noteId);
    const videoId = (note?.excerptPic as excerptPic_video)?.video;

    let createDateOrg = moment(createDate).format(orgTimeFormatForMomentjs);
    let modifiedDateOrg = moment(modifiedDate).format(orgTimeFormatForMomentjs);

    let rendered;
    if (videoId) {
      isVideoNotebook = true;
      rendered =
        "*".repeat(depth + 2) +
        ` ${noteTitle}
:PROPERTIES:
:ID:       ${noteId}
:CREATED: [${createDateOrg}]
:MODIFIED: [${modifiedDateOrg}]
:MPV_POSITION_START: ${videoPosToTimestamp(note?.startPos)}
:MPV_POSITION_END: ${videoPosToTimestamp(note?.endPos)}
:MARGINNOTE_LINK: [[marginnote3app://note/${noteId}][link]]
:END:
${excerptText}
`;
    } else if (note?.parentNote === undefined) {
      rendered = ""; // Skip root note
    } else if (noteTitle === undefined) {
      // Don't include noteId if noteTitle is undefined
      rendered =
        "*".repeat(depth + 1) +
        ` undefined
:PROPERTIES:
:CREATED: [${createDateOrg}]
:MODIFIED: [${modifiedDateOrg}]
:NOTER_PAGE: ${startPage}
:NOTER_PAGE_END: ${endPage}
:MARGINNOTE_LINK: [[marginnote3app://note/${noteId}][link]]
:IS_MERGED: ${isMerged}
:END:
${excerptText}
`;
    } else {
      rendered =
        "*".repeat(depth + 1) +
        ` ${noteTitle}
:PROPERTIES:
:ID:       ${noteId}
:CREATED: [${createDateOrg}]
:MODIFIED: [${modifiedDateOrg}]
:NOTER_PAGE: ${startPage}
:NOTER_PAGE_END: ${endPage}
:MARGINNOTE_LINK: [[marginnote3app://note/${noteId}][link]]
:IS_MERGED: ${isMerged}
:END:
${excerptText}
`;
    }
    const lines = Array.isArray(childNotes)
      ? childNotes.map((t) => iterate(t, depth + 1))
      : [];
    lines.unshift(rendered);
    return lines.join("\n");
  };
  const orgContent = iterate(toc);
  return isVideoNotebook
    ? `** ${toc.noteTitle}
:PROPERTIES:
:MPV_VIDEO_FILENAME: ${fileName}
:END:


` + orgContent
    : orgContent;
  // } catch (error) {}
};

const videoPosToTimestamp = (pos: string | undefined): string | undefined => {
  if (!pos || typeof pos !== "string") return undefined;
  const [mark, totalStr, propStr, ...others] = pos.split("|"),
    total = +totalStr,
    prop = +propStr;
  if (
    mark === "MN3VIDEO" &&
    others.length === 0 &&
    Number.isFinite(total) &&
    Number.isFinite(prop) &&
    total > 0 &&
    prop >= 0 &&
    prop <= 1
  ) {
    const seconds = total * prop;
    const timestamp = new Date(seconds * 1000).toISOString().substr(11, 8);
    return timestamp;
  } else {
    console.error("invalid MNVIDEO time: ", pos);
    return undefined;
  }
};
