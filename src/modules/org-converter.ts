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

const orgTimeFormatForMomentjs = "YYYY-MM-DD ddd HH:mm";

export const convert_to_org = (body: ReturnBody_Toc): string => {
  const { data: toc } = body;
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
    if (otherMergedText) {
      excerptText = excerptText + "\n\n" + otherMergedText;
    }

    let createDateOrg = moment(createDate).format(orgTimeFormatForMomentjs);
    let modifiedDateOrg = moment(modifiedDate).format(orgTimeFormatForMomentjs);

    let rendered;
    if (startPage === undefined || noteTitle === undefined) {
      rendered = ""; // Skip root note
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
  return iterate(toc);
  // } catch (error) {}
};
