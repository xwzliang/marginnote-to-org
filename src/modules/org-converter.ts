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
    } = toc;
    excerptText = excerptText === undefined ? "" : excerptText;
    if (otherMergedText) {
      excerptText = excerptText + "\n\n" + otherMergedText;
    }

    let rendered;
    if (startPage === undefined || noteTitle === undefined) {
      rendered = ""; // Skip root note
    } else {
      rendered =
        "*".repeat(depth) +
        ` ${noteTitle}
:PROPERTIES:
:ID:       ${noteId}
:MARGINNOTE_LINK: [[marginnote3app://note/${noteId}][link]]
:NOTER_PAGE: ${startPage}
:NOTER_PAGE_END: ${endPage}
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
