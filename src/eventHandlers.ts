import {
  ChangeExcerptRange_Sender,
  DocumentController,
  EventHandler,
  NotifySender,
  PopupMenuOnNote_Sender,
  PopupMenuOnSelection_Sender,
  ProcessNewExcerpt_Sender,
} from "@alx-plugins/marginnote";
import PopupRecorder from "modules/PopupRecorder";
import { copy, showHUD } from "modules/tools";
import { addonOnName } from "togglePlugin";

import { stringify } from "./modules/parser";

export const onPopupMenuOnNote = (sender: PopupMenuOnNote_Sender) => {
  if (
    !Application.sharedInstance().checkNotifySenderInWindow(sender, self.window)
  )
    return; //Don't process message from other window

  if (!self[addonOnName]) return;

  if (self.recorder === undefined) {
    self.recorder = new PopupRecorder();
  }

  if (self.recorder.isDuplicate(Date.now())) return;

  const srcNote = sender.userInfo.note;
  let currentBook;

  if (!srcNote) {
    showHUD("no note in sender");
    return;
  }

  if (srcNote.docMd5)
    currentBook = Database.sharedInstance().getDocumentById(srcNote.docMd5);

  try {
    copy(stringify(srcNote, self.recorder, currentBook));
  } catch (error) {
    showHUD(error.toString());
  }
};

export const onPopupMenuOnSelection = (sender: PopupMenuOnSelection_Sender) => {
  if (
    !Application.sharedInstance().checkNotifySenderInWindow(sender, self.window)
  )
    return; //Don't process message from other window

  if (!self[addonOnName]) return;

  if (self.recorder === undefined) {
    self.recorder = new PopupRecorder();
  }

  const { selectionText: selection, document: currentBook } = sender.userInfo
    .documentController as DocumentController;

  try {
    if (selection && selection.length) {
      copy(stringify({ sel: selection }, self.recorder, currentBook));
    }
  } catch (error) {
    showHUD(error.toString());
  }
};

type HanlderBasic<T extends NotifySender> = {
  handler: EventHandler<T>;
  event: T["name"];
};

type Hanlder =
  | HanlderBasic<PopupMenuOnSelection_Sender>
  | HanlderBasic<ProcessNewExcerpt_Sender>
  | HanlderBasic<ChangeExcerptRange_Sender>
  | HanlderBasic<PopupMenuOnNote_Sender>;

export const bindEventHandlers = (
  handlerList: Hanlder[],
): {
  add: () => void;
  remove: () => void;
  handlers: { [k: string]: (sender: any) => void };
} => {
  const handlers: { [k: string]: (sender: any) => void } = {};
  handlerList.forEach((v) => {
    handlers["on" + v.event] = v.handler;
  });

  const add = () => {
    handlerList.forEach((v) => {
      NSNotificationCenter.defaultCenter().addObserverSelectorName(
        self,
        `on${v.event}:`,
        v.event,
      );
    });
  };

  const remove = () => {
    handlerList.forEach((v) => {
      NSNotificationCenter.defaultCenter().removeObserverName(self, v.event);
    });
  };

  return { add, remove, handlers };
};
