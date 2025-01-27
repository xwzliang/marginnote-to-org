import { NotifySender } from "@alx-plugins/marginnote";
import { isMac, showHUD } from "modules/tools";
import gt from "modules/translate";

export const pluginName = "marginnote-to-org";

export const toggleHandlerName = `toggle${pluginName}`;

export const addonOnName = `${pluginName}_on`;

export const togglePlugin = (sender: NotifySender) => {
  const toggleAddon = () => {
    self[addonOnName] = !self[addonOnName];
    NSUserDefaults.standardUserDefaults().setObjectForKey(
      self[addonOnName],
      `marginnote_${pluginName}`,
    );
    Application.sharedInstance()
      .studyController(self.window)
      .refreshAddonCommands();
  };

  if (!self[addonOnName]) {
    toggleAddon();
    self.tocMode = true;
    showHUD(gt("addon") + gt("enabled"));
  } else {
    toggleAddon();
    showHUD(gt("addon") + gt("disabled"));
  }
  // UIAlertView.showWithTitleMessageStyleCancelButtonTitleOtherButtonTitlesTapBlock(
  //   gt("toggle_title"),
  //   "",
  //   0 /* Default */,
  //   gt("cancel"),
  //   [
  //     (self.tocMode ? gt("off") : gt("on")) + gt("toc"),
  //     (self[addonOnName] ? gt("off") : gt("on")) + gt("addon"),
  //   ],
  //   (alert, buttonIndex) => {
  //     switch (buttonIndex) {
  //       case 1:
  //         self.tocMode = !self.tocMode;
  //         if (self.tocMode) showHUD(gt("toggle_desc_toc_on"));
  //         break;
  //       case 2:
  //         toggleAddon();
  //         showHUD(gt("addon") + gt("disabled"));
  //         break;
  //       case 0:
  //         break;
  //       default:
  //         JSB.log(
  //           "🌈🌈🌈 MNLOG tapBlock: Unexpected button pressed %o",
  //           alert.buttonTitleAtIndex(buttonIndex),
  //         );
  //         break;
  //     }
  //   },
  // );
};
