import { MbBookNote } from "@alx-plugins/marginnote";

export const getWordCount = (src: string) => {
  return (src.match(/\b/g) || "").length / 2 + (src.match(chs) || "").length;
};
const prefix = "marginnote3app://note/";
const chs = RegExp(/[\u4e00-\u9fa5]/g);
export const mnUrl = (id: string) => prefix + id;

const baseProps = (() => {
  let allProps: any[] = [],
    curr = {};
  do {
    let props = Object.getOwnPropertyNames(curr);
    props.forEach((prop) => {
      if (allProps.indexOf(prop) === -1) allProps.push(prop);
    });
  } while ((curr = Object.getPrototypeOf(curr)));
  return allProps;
})();

export const getAllProperties = (obj: object) => {
  let allProps: any[] = [],
    curr = obj;
  do {
    let props = Object.getOwnPropertyNames(curr);
    props.forEach((prop) => {
      if (allProps.indexOf(prop) === -1 && baseProps.indexOf(prop) === -1)
        allProps.push(prop);
    });
  } while ((curr = Object.getPrototypeOf(curr)));
  return allProps;
};

const isMbBookNote = (obj: any): obj is MbBookNote => {
  return (
    obj?.noteId !== undefined &&
    obj?.childNotes !== undefined &&
    Array.isArray(obj.childNotes)
  );
};

export const scanObject = (obj: any, depth = 1): any => {
  const scan = (obj: any, dive?: boolean, accu: number = 0): any => {
    if (typeof obj !== "undefined" && obj !== null) {
      let out: any = {};
      for (const k of getAllProperties(obj)) {
        let value;
        if (accu < depth) {
          if (
            k === "parentNote" &&
            (dive === undefined || !dive) &&
            isMbBookNote(obj[k])
          ) {
            try {
              value = scan(obj[k], false, accu + 1);
            } catch (error) {
              value = `Error scaning: ${k} accu: ${accu}`;
            }
          } else if (
            k === "childNotes" &&
            (dive === undefined || dive) &&
            Array.isArray(obj[k])
          ) {
            try {
              value = (obj[k] as any[]).map((v) => scan(v, true, accu + 1));
            } catch (error) {
              value = `Error scaning: ${k} accu: ${accu}`;
            }
          } else if (k === "excerptPic") {
            try {
              value = scan(obj[k], false, accu + 1);
            } catch (error) {
              value = `Error scaning: ${k} accu: ${accu}`;
            }
          } else value = obj[k];
        } else value = obj[k];
        Object.defineProperty(out, k, {
          value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      return out;
    } else {
      return undefined;
    }
  };

  return scan(obj);
};

export { alert, copy, debug, showHUD };

const showHUD = (message: string, duration: number = 2) => {
  Application.sharedInstance().showHUD(message, self.window, duration);
};

const alert = (message: string) => {
  Application.sharedInstance().alert(message);
};

/**
 * Copy to Clipboard
 */
const copy = (content: string) => {
  // @ts-ignore
  let pasteBoard = UIPasteboard.generalPasteboard();
  pasteBoard.string = content;
};

const debug = (obj: any) => {
  const replacer = (k: string, value: any) => {
    if (value === undefined) {
      return "UNDEFINED";
    } else if (typeof value === "function") {
      return value.toString();
    } else return value;
  };

  try {
    return JSON.stringify(scanObject(obj), replacer, 2);
  } catch (error) {
    showHUD(error.toString());
    return null;
  }
};

/**
 * Get Objective-C class declaration
 */
export const getObjCClassDeclar = (name: string, type: string) =>
  `${name} : ${type}`;
